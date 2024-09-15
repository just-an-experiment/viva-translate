import { MeetType } from '../constants';
import { IInterim, ISummary } from '../types';

class TranscriptionsDataClass {
  private static instance: TranscriptionsDataClass;

  public title: string = '';

  public meetType: MeetType = MeetType.LIVE_CC;

  public url: string = '';

  public startTime: string = '';

  public interims: IInterim[] = [];

  public summaries: ISummary[] = [];

  private constructor() {
    this.reset();
  }

  public static get shared(): TranscriptionsDataClass {
    if (!TranscriptionsDataClass.instance) {
      TranscriptionsDataClass.instance = new TranscriptionsDataClass();
    }
    return TranscriptionsDataClass.instance;
  }

  public reset(): void {
    this.title = '';
    this.meetType = MeetType.LIVE_CC;
    this.url = '';
    this.interims = [];
    this.summaries = [];
  }
}

const TranscriptionsData = TranscriptionsDataClass.shared;
export default TranscriptionsData;
