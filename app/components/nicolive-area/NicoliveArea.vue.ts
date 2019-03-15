import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { NicoliveProgramService } from 'services/nicolive-program/nicolive-program';

@Component({
  components: {},
})
export default class NicolivePanelRoot extends Vue {
  @Inject()
  nicoliveProgramService: NicoliveProgramService;

  isCreating: boolean = false;
  async createProgram() {
    try {
      this.isCreating = true;
      return await this.nicoliveProgramService.createProgram();
    } catch (e) {
      // TODO
      console.warn(e);
    } finally {
      this.isCreating = false;
    }
  }

  isFetching: boolean = false;
  async fetchProgram() {
    try {
      this.isFetching = true;
      return await this.nicoliveProgramService.fetchProgram();
    } catch (e) {
      // TODO
      console.warn(e);
    } finally {
      this.isFetching = false;
    }
  }

  async refreshProgram() {
    try {
      this.isFetching = true;
      return await this.nicoliveProgramService.fetchProgram();
    } catch (e) {
      // TODO
      console.warn(e);
    } finally {
      this.isFetching = false;
    }
  }

  isEditing: boolean = false;
  async editProgram() {
    try {
      this.isEditing = true;
      return await this.nicoliveProgramService.editProgram();
    } catch (e) {
      // TODO
      console.warn(e);
    } finally {
      this.isEditing = false;
    }
  }

  isStarting: boolean = false;
  async startProgram() {
    try {
      this.isStarting = true;
      return await this.nicoliveProgramService.startProgram();
    } catch (e) {
      // TODO
      console.warn(e);
    } finally {
      this.isStarting = false;
    }
  }

  isEnding: boolean = false;
  async endProgram() {
    try {
      this.isEnding = true;
      return await this.nicoliveProgramService.endProgram();
    } catch (e) {
      // TODO
      console.warn(e);
    } finally {
      this.isEnding = false;
    }
  }

  isExtending: boolean = false;
  async extendProgram() {
    try {
      this.isExtending = true;
      return await this.nicoliveProgramService.extendProgram();
    } catch (e) {
      // TODO
      console.warn(e);
    } finally {
      this.isExtending = false;
    }
  }

  toggleAutoExtension() {
    this.nicoliveProgramService.toggleAutoExtension();
  }

  isCommentSending: boolean = false;
  operatorCommentValue: string = '';
  async sendOperatorComment(event: KeyboardEvent) {
    const text = this.operatorCommentValue;
    const isPermanent = event.ctrlKey;

    try {
      this.isCommentSending = true;
      await this.nicoliveProgramService.sendOperatorComment(text, isPermanent);
      this.operatorCommentValue = '';
    } catch (err) {
      // TODO
      console.warn(err);
    } finally {
      this.isCommentSending = false;
    }
  }

  get hasProgram(): boolean {
    return this.nicoliveProgramService.hasProgram;
  }

  get programID(): string {
    return this.nicoliveProgramService.state.programID;
  }

  get programStatus(): string {
    return this.nicoliveProgramService.state.status;
  }

  get programTitle(): string {
    return this.nicoliveProgramService.state.title;
  }

  get programDescription(): string {
    return this.nicoliveProgramService.state.description;
  }

  get programEndTime(): number {
    return this.nicoliveProgramService.state.endTime;
  }

  get programStartTime(): number {
    return this.nicoliveProgramService.state.startTime;
  }

  get communityID(): string {
    return this.nicoliveProgramService.state.communityID;
  }

  get communityName(): string {
    return this.nicoliveProgramService.state.communityName;
  }

  get communitySymbol(): string {
    return this.nicoliveProgramService.state.communitySymbol;
  }

  get viewers(): number {
    return this.nicoliveProgramService.state.viewers;
  }

  get comments(): number {
    return this.nicoliveProgramService.state.comments;
  }

  get adPoint(): number {
    return this.nicoliveProgramService.state.adPoint;
  }

  get giftPoint(): number {
    return this.nicoliveProgramService.state.giftPoint;
  }

  get isProgramExtendable() {
    return this.nicoliveProgramService.state.extendable;
  }

  get autoExtentionEnabled() {
    return this.nicoliveProgramService.state.autoExtentionEnabled;
  }
}
