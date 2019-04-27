import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import SceneSelector from 'components/SceneSelector.vue';
import Mixer from 'components/Mixer.vue';
import { UserService } from 'services/user';
import { Inject } from 'util/injector';
import Display from 'components/shared/Display.vue';
import { CustomizationService } from 'services/customization';
import VTooltip from 'v-tooltip';
import { $t, I18nService } from 'services/i18n';
import { NavigationService } from 'services/navigation';
import ResizeBar from 'components/shared/ResizeBar.vue';
import BrowserFrame from 'components/shared/BrowserFrame.vue';

Vue.use(VTooltip);
VTooltip.options.defaultContainer = '#mainWrapper';

@Component({
  components: {
    SceneSelector,
    Mixer,
    Display,
    ResizeBar,
    BrowserFrame,
  },
})
export default class Live extends Vue {
  @Inject() userService: UserService;
  @Inject() customizationService: CustomizationService;
  @Inject() i18nService: I18nService;
  @Inject() navigationService: NavigationService;

  $refs: {
    webview: BrowserFrame;
  };

  enablePreviewTooltip = $t('Enable the preview stream');
  disablePreviewTooltip = $t('Disable the preview stream, can help with CPU');

  mounted() {
    this.$refs.webview.$on('new-window', (event: Electron.Event, url: string) => {
      const match = url.match(/dashboard\/([^\/^\?]*)/);

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

  get previewEnabled() {
    return (
      this.customizationService.state.livePreviewEnabled &&
      !this.performanceModeEnabled &&
      !this.customizationService.state.hideStyleBlockingElements
    );
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

  get partition() {
    return this.userService.state.auth.partition;
  }

  get height() {
    return this.customizationService.state.bottomdockSize;
  }

  set height(value) {
    this.customizationService.setSettings({ bottomdockSize: value });
  }

  get displayWidth() {
    // 29 pixels is roughly the size of the title control label
    return (16 / 9) * (this.height - 29);
  }

  get maxHeight() {
    // Roughly 400 pixels below the top is a good top limit for
    // resizing. It allows plenty of room for the title bar and header.
    return this.$root.$el.getBoundingClientRect().height - 400;
  }

  get minHeight() {
    return 50;
  }

  onResizeStartHandler() {
    this.customizationService.setSettings({ hideStyleBlockingElements: true });
  }

  onResizeStopHandler() {
    this.customizationService.setSettings({ hideStyleBlockingElements: false });
  }
}
