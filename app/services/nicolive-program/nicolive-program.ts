import { StatefulService, mutation } from 'services/stateful-service';
import { NicoliveClient, CreateResult, EditResult, isOk } from './NicoliveClient';

interface INicoliveProgramState {
  programID: string;
  status: string;
  title: string;
  description: string;
  endTime: number;
  startTime: number;
  communityID: string;
  communityName: string;
  communitySymbol: string;
  viewers: number;
  comments: number;
  adPoint: number;
  giftPoint: number;
  extendable: boolean;
  /** TODO: 永続化 */
  autoExtentionEnabled: boolean;
}

export class NicoliveProgramService extends StatefulService<INicoliveProgramState> {
  static initialState: INicoliveProgramState = {
    programID: '',
    status: '',
    title: '',
    description: '',
    endTime: 0,
    startTime: 0,
    communityID: '',
    communityName: '',
    communitySymbol: '',
    viewers: 0,
    comments: 0,
    adPoint: 0,
    giftPoint: 0,
    extendable: true,
    autoExtentionEnabled: false,
  };

  client: NicoliveClient = new NicoliveClient();

  get hasProgram(): boolean {
    return Boolean(this.state.programID);
  }

  private setState(partialState: Partial<INicoliveProgramState>) {
    const nextState = { ...this.state, ...partialState };
    this.refreshStatisticsPolling(this.state, nextState);
    this.SET_STATE(nextState);
  }

  @mutation()
  private SET_STATE(nextState: INicoliveProgramState): void {
    this.state = nextState;
  }

  async createProgram(): Promise<CreateResult> {
    const result = await this.client.createProgram();
    if (result === 'CREATED') {
      await this.fetchProgram();
    }
    return result;
  }

  async fetchProgram(): Promise<void> {
    const schedulesResponse = await this.client.fetchProgramSchedules();
    if (!isOk(schedulesResponse)) {
      console.warn(schedulesResponse.value.meta.errorCode);
      throw schedulesResponse.value;
    }

    // TODO: select suitable program
    const programSchedule = schedulesResponse.value[0];

    if (!programSchedule) {
      if (this.state) {
        this.setState({ status: 'end' });
      }
      throw new Error('no suitable schedule');
    }
    const { nicoliveProgramId, socialGroupId } = programSchedule;

    const [programResponse, communityResponse] = await Promise.all([
      this.client.fetchProgram(nicoliveProgramId),
      this.client.fetchCommunity(socialGroupId),
    ]);
    if (!isOk(programResponse)) {
      console.warn(programResponse.value.meta.errorCode);
      throw programResponse.value;
    }
    if (!isOk(communityResponse)) {
      console.warn(communityResponse.value.meta.errorCode);
      throw communityResponse.value;
    }

    const community = communityResponse.value;
    const program = programResponse.value;

    this.setState({
      programID: nicoliveProgramId,
      status: program.status,
      title: program.title,
      description: program.description,
      startTime: program.beginAt,
      endTime: program.endAt,
      communityID: socialGroupId,
      communityName: community.name,
      communitySymbol: community.thumbnailUrl.small,
      extendable: true,
    });
  }

  async refreshProgram(): Promise<void> {
    const programResponse = await this.client.fetchProgram(this.state.programID);
    if (!isOk(programResponse)) {
      console.warn(programResponse.value.meta.errorCode);
      throw programResponse.value;
    }

    const program = programResponse.value;

    this.setState({
      status: program.status,
      title: program.title,
      description: program.description,
      startTime: program.beginAt,
      endTime: program.endAt,
    });
  }

  async editProgram(): Promise<EditResult> {
    const result = await this.client.editProgram(this.state.programID);
    if (result === 'EDITED') {
      await this.refreshProgram();
    }
    return result;
  }

  async startProgram(): Promise<void> {
    const result = await this.client.startProgram(this.state.programID);
    if (isOk(result)) {
      const endTime = result.value.end_time;
      const startTime = result.value.start_time;
      this.setState({ status: 'onAir', endTime, startTime });
      return;
    }

    throw result.value;
  }

  async endProgram(): Promise<void> {
    const result = await this.client.endProgram(this.state.programID);
    if (isOk(result)) {
      const endTime = result.value.end_time;
      this.setState({ status: 'end', endTime });
      return;
    }

    throw result.value;
  }

  toggleAutoExtension() {
    const autoExtentionEnabled = !this.state.autoExtentionEnabled;
    this.setState({ autoExtentionEnabled });
  }

  async extendProgram(): Promise<void> {
    const result = await this.client.extendProgram(this.state.programID);
    if (isOk(result)) {
      this.setState({
        endTime: result.value.end_time,
      });
      return;
    }

    if (result.value.meta.status === 400) {
      this.setState({
        extendable: false,
      });
    }

    throw result.value;
  }

  private statsTimer: number = 0;
  refreshStatisticsPolling(prevState: INicoliveProgramState, nextState: INicoliveProgramState): void {
    const onInitialize = !prevState;
    const hasNextProgram = Boolean(nextState.programID);
    const programUpdated = onInitialize || prevState.programID !== nextState.programID;
    const nextStatusIsOnAir = nextState.status === 'onAir';
    const statusUpdated = onInitialize || prevState.status !== nextState.status;

    if (hasNextProgram && nextStatusIsOnAir && (programUpdated || statusUpdated)) {
      clearInterval(this.statsTimer);
      this.updateStatistics(nextState.programID); // run and forget
      this.statsTimer = window.setInterval((id: string) => this.updateStatistics(id), 60 * 1000, nextState.programID);
    } else if (!nextStatusIsOnAir) {
      clearInterval(this.statsTimer);
    }
  }

  updateStatistics(programID: string): void {
    this.client
      .fetchStatistics(programID)
      .then(res => {
        if (isOk(res)) {
          this.setState({
            viewers: res.value.watchCount,
            comments: res.value.commentCount,
          });
        }
      })
      .catch(() => null);
    this.client
      .fetchNicoadStatistics(programID)
      .then(res => {
        if (isOk(res)) {
          this.setState({
            adPoint: res.value.totalAdPoint,
            giftPoint: res.value.totalGiftPoint,
          });
        }
      })
      .catch(() => null);
  }

  async sendOperatorComment(text: string, isPermanent: boolean): Promise<void> {
    const result = await this.client.sendOperatorComment(this.state.programID, { text, isPermanent });
    if (!isOk(result)) throw result.value;
  }
}
