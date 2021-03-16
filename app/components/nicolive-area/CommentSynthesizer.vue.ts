import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import VueSlider from 'vue-slider-component';
import { Inject } from 'util/injector';
import {
  NicoliveCommentSynthesizerService,
} from 'services/nicolive-program/nicolive-comment-synthesizer';
import { sleep } from 'util/sleep';

@Component({
  components: {
    VueSlider,
  }
})
export default class CommentSynthesizer extends Vue {
  @Inject()
  private nicoliveCommentSynthesizerService: NicoliveCommentSynthesizerService;

  pitch: number = 0;
  rate: number = 0;
  volume: number = 0;

  mounted() {
    this.pitch = this.nicoliveCommentSynthesizerService.pitch;
    this.rate = this.nicoliveCommentSynthesizerService.rate;
    this.volume = this.nicoliveCommentSynthesizerService.volume;
  }

  apply() {
    this.nicoliveCommentSynthesizerService.pitch = this.pitch;
    this.nicoliveCommentSynthesizerService.rate = this.rate;
    this.nicoliveCommentSynthesizerService.volume = this.volume;
  }

  close() {
    this.$emit('close');
  }

  private index: number = 0;

  async play() {
    const service = this.nicoliveCommentSynthesizerService;

    const speech = service.makeSimpleTextSpeech('これは読み上げ設定のテスト音声です');
    if (speech) {
      this.index++;
      if (service.speaking) {
        service.cancelSpeak();
        await sleep(200);
      }

      speech.pitch = this.pitch;
      speech.rate = this.rate;
      speech.volume = this.volume;

      service.speakText(speech,
        (e) => {
          console.log(`#${this.index}: onstart`, e);
        }, (e) => {
          console.log(`#${this.index}: onend`, e);
        });
    }
  }

  get enabled(): boolean {
    return this.nicoliveCommentSynthesizerService.enabled;
  }
  set enabled(e: boolean) {
    this.nicoliveCommentSynthesizerService.enabled = e;
  }

  get pitchCandidates(): number[] {
    return [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2];
  }
  resetPitch() {
    this.pitch = 1.0;
  }

  get rateCandidates(): number[] {
    return [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.5, 1.75, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  }
  resetRate() {
    this.rate = 1.0;
  }

  get volumeCandidates(): number[] {
    return [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
  }
  resetVolume() {
    this.volume = 1.0;
  }
}
