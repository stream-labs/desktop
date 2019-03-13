import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { NicoliveClient } from 'services/nicolive-program/NicoliveClient';

interface State {
  programID: string;
  status: string;
  title: string;
  description: string;
  communityID: string;
  communityName: string;
  communitySymbol: string;
}

@Component({
  components: {},
})
export default class NicolivePanelRoot extends Vue {
  state: State = null;

  viewers: number = 0;
  comments: number = 0;
  adPoint: number = 0;
  giftPoint: number = 0;
  statsTimer: number = 0;

  get hasProgram(): boolean {
    return Boolean(this.state);
  }

  get programTitle() {
    return this.state.title;
  }
  get programDescription() {
    return this.state.description;
  }
  get programStatus() {
    return this.state.status;
  }
  get communityName() {
    return this.state.communityName;
  }
  get communitySymbol() {
    return this.state.communitySymbol;
  }

  private setState(nextState: State) {
    this.refreshStatisticsPolling(this.state, nextState);
    this.state = nextState;
  }

  client: NicoliveClient = new NicoliveClient();
  autoExtensionEnabled = false;
  async createProgram() {
    const result = await this.client.createProgram();
    if (result === 'CREATED') {
      await this.fetchProgram();
    }
  }
  async fetchProgram() {
    const schedulesResponse = await this.client.fetchProgramSchedules();
    if (schedulesResponse.ok === false) {
      console.error(schedulesResponse.value.meta.errorCode);
      return;
    }
    // TODO: select suitable program
    const programSchedule = schedulesResponse.value[0];

    if (!programSchedule) {
      if (this.state) {
        this.setState({ ...this.state, status: 'end' });
      }
      return;
    }
    const { nicoliveProgramId, socialGroupId } = programSchedule;

    const [programResponse, communityResponse] = await Promise.all([
      this.client.fetchProgram(nicoliveProgramId),
      this.client.fetchCommunity(socialGroupId),
    ]);
    if (programResponse.ok === false) {
      console.error(programResponse.value.meta.errorCode);
      return;
    }
    if (communityResponse.ok === false) {
      console.error(communityResponse.value.meta.errorCode);
      return;
    }

    const community = communityResponse.value;
    const program = programResponse.value;

    this.setState({
      programID: nicoliveProgramId,
      status: program.status,
      title: program.title,
      description: program.description,
      communityID: socialGroupId,
      communityName: community.name,
      communitySymbol: community.thumbnailUrl.small,
    });
  }
  async refreshProgram() {
    const programResponse = await this.client.fetchProgram(this.state.programID);
    if (programResponse.ok === false) {
      this.setState({ ...this.state, status: 'end' });
      console.error(programResponse.value.meta.errorCode);
      return;
    }

    const program = programResponse.value;

    this.setState({
      ...this.state,
      status: program.status,
      title: program.title,
      description: program.description,
    });
  }
  async editProgram() {
    const result = await this.client.editProgram(this.state.programID);
    if (result === 'EDITED') {
      await this.refreshProgram();
    }
  }
  async startProgram() {
    const result = await this.client.startProgram(this.state.programID);
    if (result.ok) {
      this.setState({ ...this.state, status: 'onAir' });
    }
  }
  async endProgram() {
    const result = await this.client.endProgram(this.state.programID);
    if (result.ok) {
      this.setState({ ...this.state, status: 'end' });
    }
  }
  toggleAutoExtension() {
    this.autoExtensionEnabled = !this.autoExtensionEnabled;
  }
  extendProgram() {
    this.client.extendProgram(this.state.programID);
  }

  private refreshStatisticsPolling(prevState: State, nextState: State) {
    const onInitialize = !prevState;
    const hasNextProgram = Boolean(nextState.programID);
    const programUpdated = onInitialize || prevState.programID !== nextState.programID;
    const nextStatusIsOnAir = nextState.status === 'onAir';
    const statusUpdated = onInitialize || prevState.status !== nextState.status;

    if (hasNextProgram && nextStatusIsOnAir && (programUpdated || statusUpdated)) {
      console.log('(re)start polling');
      clearInterval(this.statsTimer);
      this.updateStatistics(nextState.programID); // run and forget
      this.statsTimer = setInterval((id: string) => this.updateStatistics(id), 60000, nextState.programID);
    } else if (!nextStatusIsOnAir) {
      console.log('stop polling');
      clearInterval(this.statsTimer);
    }
  }

  updateStatistics(programID: string) {
    this.client
      .fetchStatistics(programID)
      .then(res => {
        if (res.ok) {
          this.viewers = res.value.watchCount;
          this.comments = res.value.commentCount;
        }
      })
      .catch(() => null);
    this.client
      .fetchNicoadStatistics(programID)
      .then(res => {
        if (res.ok) {
          this.adPoint = res.value.totalAdPoint;
          this.giftPoint = res.value.totalGiftPoint;
        }
      })
      .catch(() => null);
  }

  operatorCommentValue: string = '';
  sendOperatorComment(event: KeyboardEvent) {
    const text = this.operatorCommentValue;
    const isPermanent = event.ctrlKey;
    this.client.sendOperatorComment(this.state.programID, { text, isPermanent }).then(() => {
      this.operatorCommentValue = '';
    });
  }
}
