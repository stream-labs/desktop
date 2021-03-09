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
        service.speakText(speech,
            (e) => {
                console.log(`#${this.index}: onstart`, e);
            }, (e) => {
                console.log(`#${this.index}: onend`, e);
            } );
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
  set pitch(e: number) {
    this.nicoliveCommentSynthesizerService.pitch = e;
  }

  get rate(): number {
    return this.nicoliveCommentSynthesizerService.rate;
  }
  set rate(e: number) {
    this.nicoliveCommentSynthesizerService.rate = e;
  }
}
