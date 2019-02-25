import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import SceneSelector from 'components/SceneSelector.vue';
import Mixer from 'components/Mixer.vue';
import { UserService } from 'services/user';
import { Inject } from 'util/injector';
import Display from 'components/shared/Display.vue';
import { CustomizationService } from 'services/customization';
import { SliderInput } from 'components/shared/inputs/inputs';
import VTooltip from 'v-tooltip';
import { $t, I18nService } from 'services/i18n';
import { NavigationService } from 'services/navigation';

Vue.use(VTooltip);
VTooltip.options.defaultContainer = '#mainWrapper';

@Component({
  components: {
    SceneSelector,
    Mixer,
    Display,
    SliderInput,
  },
})
export default class Live extends Vue {
  @Inject() userService: UserService;
  @Inject() customizationService: CustomizationService;
  @Inject() i18nService: I18nService;
  @Inject() navigationService: NavigationService;

  $refs: {
    webview: Electron.WebviewTag;
  };

  enablePreviewTooltip = $t('Enable the preview stream');
  disablePreviewTooltip = $t('Disable the preview stream, can help with CPU');

  mounted() {
    I18nService.setWebviewLocale(this.$refs.webview);

    this.$refs.webview.addEventListener('new-window', e => {
      const match = e.url.match(/dashboard\/([^\/^\?]*)/);

      if (match && match[1] === 'recent-events') {
        this.popout();
      } else if (match) {
        this.navigationService.navigate('Dashboard', {
          subPage: match[1],
        });
      }
    });
  }

  popout() {
    this.userService.popoutRecentEvents();
  }

  get sliderMetadata() {
    return {
      min: 275,
      max: 600,
      interval: 1,
      displayValue: 'false',
      dotSize: 11,
      sliderStyle: { 'background-color': '#3c4c53' },
    };
  }

  get previewSize() {
    return this.customizationService.state.previewSize;
  }

  set previewSize(previewSize: number) {
    this.customizationService.setSettings({ previewSize });
  }

  get previewEnabled() {
    return this.customizationService.state.livePreviewEnabled && !this.performanceModeEnabled;
  }

  get performanceModeEnabled() {
    return this.customizationService.state.performanceMode;
  }

  set previewEnabled(value: boolean) {
    this.customizationService.setLivePreviewEnabled(value);
  }

  get recenteventsUrl() {
    return this.userService.recentEventsUrl();
  }
}
