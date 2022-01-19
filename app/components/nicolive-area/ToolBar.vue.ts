import Vue from 'vue';
import { Component, Watch } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';
import { NicoliveProgramService } from 'services/nicolive-program/nicolive-program';
import {
  NicoliveFailure,
  openErrorDialogFromFailure,
} from 'services/nicolive-program/NicoliveFailure';
import Popper from 'vue-popperjs';

@Component({
  components: { Popper },
})
export default class ToolBar extends Vue {
  @Inject()
  nicoliveProgramService: NicoliveProgramService;

  // TODO: 後で言語ファイルに移動する
  fetchTooltip = '番組再取得';
  extentionTooltip = '延長設定';

  showPopupMenu: boolean = false;

  get compactMode(): boolean {
    return this.nicoliveProgramService.state.isCompact;
  }

  get isOnAir(): boolean {
    return this.nicoliveProgramService.state.status === 'onAir';
  }

  format(timeInSeconds: number): string {
    return NicoliveProgramService.format(timeInSeconds);
  }

  get isFetching(): boolean {
    return this.nicoliveProgramService.state.isFetching;
  }
  async fetchProgram(): Promise<void> {
    if (this.isFetching) throw new Error('fetchProgram is running');
    try {
      await this.nicoliveProgramService.fetchProgram();
    } catch (caught) {
      if (caught instanceof NicoliveFailure) {
        await openErrorDialogFromFailure(caught);
      } else {
        throw caught;
      }
    }
  }

  get isExtending(): boolean {
    return this.nicoliveProgramService.state.isExtending;
  }
  async extendProgram() {
    if (this.isExtending) throw new Error('extendProgram is running');
    try {
      return await this.nicoliveProgramService.extendProgram();
    } catch (caught) {
      if (caught instanceof NicoliveFailure) {
        await openErrorDialogFromFailure(caught);
      } else {
        throw caught;
      }
    }
  }

  toggleAutoExtension() {
    this.nicoliveProgramService.toggleAutoExtension();
  }

  get programStatus(): string {
    return this.nicoliveProgramService.state.status;
  }

  get programEndTime(): number {
    return this.nicoliveProgramService.state.endTime;
  }

  get programStartTime(): number {
    return this.nicoliveProgramService.state.startTime;
  }

  get isProgramExtendable() {
    return (
      this.nicoliveProgramService.isProgramExtendable && this.programEndTime - this.currentTime > 60
    );
  }

  get autoExtensionEnabled() {
    return this.nicoliveProgramService.state.autoExtensionEnabled;
  }

  currentTime: number = NaN;
  updateCurrentTime() {
    this.currentTime = Math.floor(Date.now() / 1000);
  }

  get programCurrentTime(): number {
    return this.currentTime - this.programStartTime;
  }

  get programTotalTime(): number {
    return this.programEndTime - this.programStartTime;
  }

  @Watch('programStatus')
  onStatusChange(newValue: string, oldValue: string) {
    if (newValue === 'end') {
      clearInterval(this.timeTimer);
      this.currentTime = NaN;
    } else if (oldValue === 'end') {
      clearInterval(this.timeTimer);
      this.startTimer();
    }
  }

  startTimer() {
    this.timeTimer = setInterval(() => this.updateCurrentTime(), 1000) as any as number;
  }

  timeTimer: number = 0;
  mounted() {
    if (this.programStatus !== 'end') {
      this.startTimer();
    }
  }

  get isStarting(): boolean {
    return this.nicoliveProgramService.state.isStarting;
  }
  async startProgram() {
    // TODO
  }
  get isEnding(): boolean {
    return this.nicoliveProgramService.state.isEnding;
  }
  async endProgram() {
    // TODO
  }
}
