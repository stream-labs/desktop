import { Inject } from 'services/core/injector';
import { NicoliveCommentLocalFilterService } from 'services/nicolive-program/nicolive-comment-local-filter';
import { NicoliveCommentSynthesizerService } from 'services/nicolive-program/nicolive-comment-synthesizer';
import { SynthesizerId, SynthesizerIds } from 'services/nicolive-program/state';
import { sleep } from 'util/sleep';
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import VueSlider from 'vue-slider-component';
import Multiselect from 'vue-multiselect';

@Component({
  components: {
    Multiselect,
    VueSlider,
  },
})
export default class CommentSettings extends Vue {
  @Inject()
  private nicoliveCommentSynthesizerService: NicoliveCommentSynthesizerService;
  @Inject()
  private nicoliveCommentLocalFilterService: NicoliveCommentLocalFilterService;

  close() {
    this.$emit('close');
  }

  async testSpeechPlay(synthId: SynthesizerId) {
    const service = this.nicoliveCommentSynthesizerService;

    await service.startTestSpeech('これは読み上げ設定のテスト音声です', synthId);
  }

  get enabled(): boolean {
    return this.nicoliveCommentSynthesizerService.enabled;
  }
  set enabled(e: boolean) {
    this.nicoliveCommentSynthesizerService.enabled = e;
  }

  get rate(): number {
    return this.nicoliveCommentSynthesizerService.rate;
  }
  set rate(v: number) {
    this.nicoliveCommentSynthesizerService.rate = v;
  }
  get rateCandidates(): number[] {
    return [
      0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.5, 1.75, 2, 3, 4, 5, 6, 7,
      8, 9, 10,
    ];
  }
  get rateDefault(): number {
    return NicoliveCommentSynthesizerService.initialState.rate;
  }
  resetRate() {
    this.rate = this.rateDefault;
  }

  get volume(): number {
    return this.nicoliveCommentSynthesizerService.volume;
  }
  set volume(v: number) {
    this.nicoliveCommentSynthesizerService.volume = v;
  }
  get volumeCandidates(): number[] {
    return [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
  }
  get volumeDefault(): number {
    return NicoliveCommentSynthesizerService.initialState.volume;
  }
  resetVolume() {
    this.volume = this.volumeDefault;
  }

  resetVoice() {
    this.resetRate();
    this.resetVolume();
  }

  get synthIds(): readonly SynthesizerId[] {
    return SynthesizerIds;
  }
  synthName(id: SynthesizerId): string {
    return this.$t(`settings.synthId.${id}`) as string;
  }
  get normal(): SynthesizerId {
    return this.nicoliveCommentSynthesizerService.normal;
  }
  set normal(s: SynthesizerId) {
    this.nicoliveCommentSynthesizerService.normal = s;
  }
  get normalDefault(): SynthesizerId {
    return NicoliveCommentSynthesizerService.initialState.selector.normal;
  }
  get operator(): SynthesizerId {
    return this.nicoliveCommentSynthesizerService.operator;
  }
  set operator(s: SynthesizerId) {
    this.nicoliveCommentSynthesizerService.operator = s;
  }
  get operatorDefault(): SynthesizerId {
    return NicoliveCommentSynthesizerService.initialState.selector.operator;
  }
  get system(): SynthesizerId {
    return this.nicoliveCommentSynthesizerService.system;
  }
  set system(s: SynthesizerId) {
    this.nicoliveCommentSynthesizerService.system = s;
  }
  get systemDefault(): SynthesizerId {
    return NicoliveCommentSynthesizerService.initialState.selector.system;
  }

  resetAssignment() {
    this.normal = this.normalDefault;
    this.operator = this.operatorDefault;
    this.system = this.systemDefault;
  }

  get showAnonymous() {
    return this.nicoliveCommentLocalFilterService.showAnonymous;
  }

  set showAnonymous(v: boolean) {
    this.nicoliveCommentLocalFilterService.showAnonymous = v;
  }
}
