/* Store the original prototype for audio play/pause */
const AudioPlayOriginal = HTMLAudioElement.prototype.play;
const AudioPauseOriginal = HTMLAudioElement.prototype.pause;

/* Keep a track of audio components */
let audioCnt: number = 0;

/* Register a DOM container to make public the streams */
const myStreamsContainer = document.createElement('div');
myStreamsContainer.setAttribute('id', 'viva-streams');
document?.body?.appendChild(myStreamsContainer);

const GetUserMediaOriginal = MediaDevices.prototype.getUserMedia;

// eslint-disable-next-line func-names
MediaDevices.prototype.getUserMedia = async function (...args): Promise<MediaStream> {
  const constraints = args[0] as any;
  if (constraints?.audio) {
    document.dispatchEvent(
      new CustomEvent('viva-mic-selected', { detail: constraints.audio })
    );
  }
  return GetUserMediaOriginal.call(this, ...args);
};

/* Redefine audio play prototype */
// eslint-disable-next-line func-names
HTMLAudioElement.prototype.play = function () {
  let audioId: string;

  if (!this.hasAttribute('viva-audio-id')) {
    /* Add custom attribute to allow identify the stream */
    audioId = `${audioCnt}`;
    this.setAttribute('viva-audio-id', audioId);
    const cors = this.getAttribute('crossorigin');
    if (!cors || cors === '' || cors === 'anonymous') {
      this.setAttribute('crossorigin', 'anonymous');
    }
    audioCnt += 1;

    /* Ensure that the component is accesible through the DOM */
    if (!document?.body?.contains(this)) {
      myStreamsContainer.appendChild(this);
    }
  } else {
    audioId = this.getAttribute('viva-audio-id') || '';
  }

  /* Send notification about new audio play */
  document.dispatchEvent(new CustomEvent('viva-audio-stream', { detail: audioId }));

  /* Call the original play function */
  return AudioPlayOriginal.call(this);
};

/* Redefine audio pause prototype */
// eslint-disable-next-line func-names
HTMLAudioElement.prototype.pause = function () {
  const videoId = this.getAttribute('viva-audio-id') || '';

  /* Send notification about the pause event */
  document.dispatchEvent(new CustomEvent('viva-audio-stream-paused', { detail: videoId }));

  /* Call the original play function */
  return AudioPauseOriginal.call(this);
};
