import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import VueSlider from 'vue-slider-component';
import { Inject } from 'services/core/injector';
import { NicoliveCommentSynthesizerService } from 'services/nicolive-program/nicolive-comment-synthesizer';
import { sleep } from 'util/sleep';

@Component({
  components: {
    VueSlider,
  },
})
export default class CommentSynthesizer extends Vue {
  @Inject()
  private nicoliveCommentSynthesizerService: NicoliveCommentSynthesizerService;

  close() {
    this.$emit('close');
  }

  async testSpeechPlay() {
    const service = this.nicoliveCommentSynthesizerService;

    const speech = service.makeSimpleTextSpeech('これは読み上げ設定のテスト音声です');
    if (speech) {
      if (service.speaking) {
        service.cancelSpeak();
        await sleep(200);
      }

      service.speakText(
        speech,
        () => {},
        () => {},
      );
    }
  }

  get enabled(): boolean {
    return this.nicoliveCommentSynthesizerService.enabled;
  }
  set enabled(e: boolean) {
    this.nicoliveCommentSynthesizerService.enabled = e;
  }

  get pitch(): number {
    return this.nicoliveCommentSynthesizerService.pitch;
  }
  set pitch(v: number) {
    this.nicoliveCommentSynthesizerService.pitch = v;
  }
  get pitchCandidates(): number[] {
    return [
      0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9,
      2,
    ];
  }
  resetPitch() {
    this.pitch = 1.0;
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
  resetRate() {
    this.rate = 1.0;
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
  resetVolume() {
    this.volume = 1.0;
  }

  reset() {
    this.resetPitch();
    this.resetRate();
    this.resetVolume();
  }
}
