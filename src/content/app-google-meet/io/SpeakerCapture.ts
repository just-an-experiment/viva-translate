import { InterimEmitter, VADEvents } from '../../../common/constants';
import AudioStream, { QueueStatus, StreamStatus } from './AudioStream';
import Gladia from '../../../common/gladia';
import { debugLog, errorLog } from '../../../common/utils/logger';
import { HTMLMediaElementWithCaptureStream } from '../../../common/types';

class SpeakerCapture {
  private static instance: SpeakerCapture;

  private streams: { [key: string]: AudioStream } = {};

  private preference: string[] = [];

  private speaking: StreamStatus;

  private constructor() {
    this.speaking = StreamStatus.IDLE;
    this.listenForUserVADEvents();
  }

  public static get shared(): SpeakerCapture {
    if (!SpeakerCapture.instance) {
      SpeakerCapture.instance = new SpeakerCapture();
    }
    return SpeakerCapture.instance;
  }

  /**
   * Listen for user mic VAD events
   */
  private listenForUserVADEvents() {
    /* User mic may start speaking */
    Gladia.on(VADEvents.PRE_VAD_START, () => {
      /**
       * Start storing the buffers in queue for the speaker stream
       */
      this.speaking = StreamStatus.PRE_START;
      this.queueStream();
    });

    /* User mic may stop speaking */
    Gladia.on(VADEvents.PRE_VAD_STOP, () => {
      /**
       * Start storing the buffers in queue for the speaker stream
       */
      this.speaking = StreamStatus.PRE_STOP;
      this.queueStream();
    });

    /* User mic started speaking */
    Gladia.on(VADEvents.VAD_START, () => {
      /**
       * Discard the buffers in the queue and ignore
       * any buffer from stream
       */
      this.speaking = StreamStatus.STARTED;
      this.ignoreStream();
    });

    /* User mic stoped speaking */
    Gladia.on('vad-stop', () => {
      this.speaking = StreamStatus.IDLE;
      this.queueStream();
      this.lookNextStream();
    });
  }

  /**
   * Looks for the next speaker stream to transcribe
   */
  private lookNextStream() {
    let found = false;
    let itr = 0;
    while (!found && itr < this.preference.length) {
      const stream = this.streams[this.preference[itr]];
      if (stream.isQueueActive) {
        /* Check if the stream is speaking */
        if (stream.streamStatus === StreamStatus.STARTED) {
          found = true;
          stream.setQueueStatus(QueueStatus.NORMAL);
        } else itr += 1;
        if (stream.streamStatus !== StreamStatus.PRE_START) stream.flushQueue();
      } else {
        stream.clearQueue();
        itr += 1;
      }
    }

    /* If there is no any active stream then remove all */
    if (!found) {
      this.preference = [];
    } else {
      /* Remove the previous streams but keep the active one */
      this.preference.splice(0, itr);
    }
  }

  /**
   * Mark all streams as ignored
   */
  private ignoreStream() {
    Object.keys(this.streams).forEach((key: string) => {
      this.streams[key].setQueueStatus(QueueStatus.IGNORE_STREAM);
      this.streams[key].clearQueue();
    });
  }

  /**
   * Mark all streams as queue
   */
  private queueStream() {
    Object.keys(this.streams).forEach((key: string) => {
      this.streams[key].setQueueStatus(QueueStatus.FORCE_QUEUE);
    });
  }

  /**
   * Start speaking from one SPEAKER stream
   * @param id
   */
  private streamStart(id: string) {
    const stream = this.streams[id];
    if (!stream.isQueueActive || this.speaking === StreamStatus.STARTED) {
      stream.clearQueue();
      return;
    }
    if (this.preference.indexOf(id) < 0) {
      this.preference.push(id);
    }
    if (this.preference[0] === id) {
      this.streams[id].flushQueue();
      this.streams[id].setQueueStatus(QueueStatus.NORMAL);
    } else {
      this.streams[id].setQueueStatus(QueueStatus.FORCE_QUEUE);
    }
  }

  /**
   * Stop speaking from one SPEAKER stream
   * @param id
   */
  private streamStop(id: string) {
    const idx = this.preference.indexOf(id);
    if (idx === 0) {
      this.preference.slice(idx, 1);
      const stream = this.streams[id];
      if (stream.isQueueActive && this.speaking !== StreamStatus.STARTED) {
        this.streams[id].flushQueue();
        this.streams[id].setQueueStatus(QueueStatus.FORCE_QUEUE);
      }
      stream.clearQueue();
      this.lookNextStream();
    }
  }

  /**
   * Get MediaStream from media object (audio or video)
   * If the stream is not loaded wait until it gets loaded
   *
   * @param value
   * @param allowLoad
   * @returns
   */
  private getMediaStream(value: HTMLMediaElementWithCaptureStream, allowLoad = true): Promise<MediaStream> {
    return new Promise<MediaStream>((resolve, reject) => {
      if (allowLoad) {
        const playing = !value.paused && !value.ended && value.readyState > 2;
        const loadStream = () => {
          this.getMediaStream(value, false)
            .then((reloadedStream: MediaStream) => {
              if (reloadedStream && reloadedStream.getAudioTracks().length > 0) {
                const newStream = new MediaStream(reloadedStream.getAudioTracks());
                resolve(newStream);
                value.onplaying = null;
                value.onloadeddata = null;
              }
            })
            .catch((error) => {
              errorLog(
                error,
                {
                  description: 'Error getting audio streaming from component',
                  src: value.src,
                }
              );
              reject(error);
            });
        };
        if (value.src && !playing) {
          let resolved = false;

          value.onplaying = () => {
            if (resolved) return;
            resolved = true;
            loadStream();
          };

          value.onloadeddata = () => {
            if (resolved) return;
            resolved = true;
            loadStream();
          };
        } else {
          loadStream();
        }
        return;
      }

      try {
        let stream: MediaStream | undefined;
        /* Force stream to be tracked at the first time by the onloadeddata event */
        if (!allowLoad) {
          if (value.captureStream) {
            stream = value.captureStream();
          } else if (value.srcObject) {
            stream = value.srcObject as MediaStream;
          }
        }

        if (stream && stream.getAudioTracks()?.length > 0) {
          const newStream = new MediaStream(stream.getAudioTracks());
          resolve(newStream);
        } else {
          reject(new Error('Invalid media format'));
        }
      } catch (error: any) {
        errorLog(error, {
          description: 'Error getting audio streaming from speaker device',
          src: value.src,
        });
        reject(error);
      }
    });
  }

  /**
   * Capture audio stream from audio or video component in any web page
   * Audio play/pause events are captured from the interceptor
   *
   * @param type
   */
  public fromMediaStream(type: 'audio' | 'video', cbInvalidStream?: any) {
    const playCustomStream = (idx: number) => {
      const streamId = `viva-${type}-id-${idx}`;

      /* If there is a previous stream then stop it */
      if (this.streams[streamId]) {
        this.streams[streamId].disconnect();
        delete this.streams[streamId];
      }

      /* Look for the target element */
      debugLog('Looking for media element', idx);
      const mediaElement: HTMLMediaElementWithCaptureStream = document.querySelector(
        `${type}[viva-${type}-id='${idx}']`
      ) as HTMLMediaElementWithCaptureStream;
      if (!mediaElement) return;

      /* Add event to handle media element ended stream */
      mediaElement.onended = () => {
        debugLog('Media stream ended');
        if (this.streams[streamId]) this.streams[streamId].disconnect();
        delete this.streams[streamId];
        mediaElement.onended = null;
      };

      /* Try to capture the stream */
      this.getMediaStream(mediaElement)
        .then((stream: MediaStream) => {
          this.streams[streamId] = new AudioStream(InterimEmitter.SPEAKER, stream, streamId);
          this.streams[streamId].setQueueStatus(QueueStatus.FORCE_QUEUE);
          this.streams[streamId].on(VADEvents.VAD_START, this.streamStart.bind(this));
          this.streams[streamId].on(VADEvents.VAD_STOP, this.streamStop.bind(this));
          debugLog('Playing new speaker stream', idx);
        })
        .catch(() => {
          if (cbInvalidStream) cbInvalidStream();
        });
    };

    /* Register listener for stream play */
    document.addEventListener(`viva-${type}-stream`, (evt: any) => {
      const idx = evt.detail;
      playCustomStream(idx);
    });

    /* Handle audio stream pause */
    document.addEventListener(`viva-${type}-stream-paused`, (evt: any) => {
      const idx = evt.detail;
      debugLog('Pause media speaker stream', idx);
      const streamId = `viva-${type}-id-${idx}`;
      if (!this.streams[streamId]) return;

      this.streams[streamId].disconnect();
      delete this.streams[streamId];
    });

    /* Search if there is any stream playing during the load */
    const mediaElements = document.getElementsByTagName(type);
    for (let itr = 0; itr < mediaElements.length; itr += 1) {
      const obj = mediaElements.item(itr);
      if (obj) {
        const playing = !obj.paused && !obj.ended && obj.readyState > 2;
        if (playing) {
          try {
            const idx = parseInt(obj.getAttribute(`viva-${type}-id`) || '-1', 10);
            if (idx >= 0) playCustomStream(idx);
          } catch (error) {
            /* If there is a playing streaming and an error ocurr then raise as invalid stream */
            errorLog(error, {
              description: "Audio stream can't be played",
              src: obj.src
            });
          }
        }
      }
    }
  }

  /**
   * Clear all the streams
   */
  public disconnect() {
    /* Clear all the streams */
    Object.keys(this.streams).forEach((key: string) => {
      this.streams[key].disconnect();
    });

    this.streams = {};
  }
}

const SpeakerCaptureObj = SpeakerCapture.shared;
export default SpeakerCaptureObj;
