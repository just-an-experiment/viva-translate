function resample(inData: number[], inRate: number, outRate: number): Float32Array {
  const outCount = Math.round(inData.length * (outRate / inRate));
  const outData = new Float32Array(outCount);
  const samplingFactor = (inData.length - 1) / (outCount - 1);
  outData[0] = inData[0];
  for (let i = 1; i < outCount - 1; i += 1) {
    const j = i * samplingFactor;
    outData[i] = inData[Math.floor(j)] * (1 - (j % 1)) + inData[Math.ceil(j)] * (j % 1);
  }
  outData[outCount - 1] = inData[inData.length - 1];
  return outData;
}

function toS16le(values: Float32Array): Int16Array {
  const frame = new Int16Array(values.length);
  values.forEach((sample: number, idx: number) => {
    const s = Math.max(-1, Math.min(1, sample));
    frame[idx] = s < 0 ? s * 0x8000 : s * 0x7fff;
  });
  return frame;
}

/**
 * Transform an audio processing event into a form suitable to be sent to the API.
 * (S16LE or Signed 16 bit Little Endian).
 *
 * Reference:
 * https://github.com/revdotcom/revai-examples/blob/master/browser_example/javascript/index.js#L107
 */
class PcmRawProcessor extends AudioWorkletProcessor {
  private frameBuffer: number[];

  private inSampleRate: number;

  private outSampleRate: number;

  private frameSize: number;

  constructor(options: any) {
    super();
    this.inSampleRate = options.processorOptions.inSampleRate;
    this.outSampleRate = options.processorOptions.outSampleRate;
    this.frameSize = options.processorOptions.frameSize;
    this.frameBuffer = [];
  }

  process(inputs: Float32Array[][]) {
    this.frameBuffer.push(...inputs[0][0]);
    while (this.frameBuffer.length >= this.frameSize) {
      const samplesF32le = resample(this.frameBuffer.splice(0, this.frameSize), this.inSampleRate, this.outSampleRate);
      const samplesS16le = toS16le(samplesF32le);
      this.port.postMessage({
        timestamp: Date.now(),
        int16: samplesS16le,
        processMeta: {
          s16le: {
            type: samplesS16le.constructor.name,
            length: samplesS16le.length,
            data: samplesS16le.slice(0, 5).toString(),
          },
        },
      });
    }
    return true;
  }
}

registerProcessor('pcm-procesor', PcmRawProcessor);
