import Vue from 'vue';
import { Component, Prop, Watch } from 'vue-property-decorator';
import VSelectPage from 'v-selectpage';
import { Inject } from 'services/core/injector';
import { prepareOptions, TTwitchTag, TTwitchTagWithLabel } from 'services/platforms/twitch/tags';
import { CustomizationService } from 'services/customization';
import TsxComponent from 'components/tsx-component';

Vue.use(VSelectPage);

@Component({})
export default class VSelectPageWrapper extends TsxComponent<{
  value: unknown;
  options: unknown[];
  onInput: unknown;
}> {
  @Inject() private customizationService: CustomizationService;

  @Prop() name: string;

  @Prop() value: unknown[];

  @Prop() options: unknown[];

  mounted() {
    const search = document.querySelector('.sp-search');
    const searchInput = document.querySelector('.sp-search-input');
    const results = document.querySelector('.sp-result-area');
    const cssClass = this.customizationService.currentTheme;
    search.classList.toggle(cssClass);
    searchInput.classList.toggle(cssClass);
    results.classList.toggle(cssClass);
  }

  onInput(tags: TTwitchTagWithLabel[]) {
    this.$emit('input', tags);
  }
}
