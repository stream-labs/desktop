import electron from 'electron';
import { Component } from 'vue-property-decorator';
import { OnboardingStep } from 'streamlabs-beaker';
import TsxComponent from 'components/tsx-component';
import { $t } from 'services/i18n';
import { Inject } from 'services';
import { ScenesService } from 'services/scenes';
import styles from './StreamlabsFeatures.m.less';

@Component({})
export default class ObsImport extends TsxComponent<{}> {
  @Inject() scenesService: ScenesService;

  get hasExternalMonitor() {
    return electron.remote.screen
      .getAllDisplays()
      .find(display => display.bounds.x !== 0 || display.bounds.y !== 0);
  }

  get isIrlStreamer() {
    return this.scenesService.scenes.find(scene => /irl/i.test(scene.name));
  }

  get recommendedFeatures() {
    const featureList = ['appStore'];

    if (!this.hasExternalMonitor) {
      featureList.push('gameOverlay');
    } else if (this.isIrlStreamer) {
      featureList.push('facemasks');
    } else {
      featureList.push('videoEncoding');
    }

    return featureList;
  }

  get featuresMetadata() {
    return {
      appStore: {
        title: $t('App Store'),
        description: $t(
          'Check out 50+ amazing apps from independent developers, ranging from DMCA-compliant music ' +
            'to stunning overlays to more tools to engage with your community. Head over to the app store in the main ' +
            'navigation to browse our selection of free and paid apps.',
        ),
        image: 'app-store',
      },
      gameOverlay: {
        title: $t('In-game Overlay'),
        description: $t(
          'Only have one screen? Perfect! Enable our in-game overlay to make sure you catch every chat message and ' +
            'stream event that happens while you get your game on. You can enable this feature in the ‘Game Overlay’ ' +
            'tab of the settings menu.',
        ),
        image: 'game-overlay',
      },
      facemasks: {
        title: $t('Facemasks'),
        description: $t(
          'Enjoy interacting with your viewers via IRL streams? Take that interaction to the next level with ' +
            'Streamlabs Facemasks, a tool that lets your viewers add 3-D masks to your face when they donate. ' +
            'Head over to the facemask settings to get started.',
        ),
        image: 'facemasks',
      },
      videoEncoding: {
        title: $t('Optimized Video Encoding'),
        description: $t(
          'Stream at higher quality and lower CPU usage by enabling video encoding optimization. We achieve these ' +
            'improvements because we tune Streamlabs OBS specifically for your game of choice and your bandwidth. ' +
            'To enable, check the box ‘Use optimized encoder settings’ while editing your stream information.',
        ),
        image: 'video-encoding',
      },
    };
  }

  render() {
    return (
      <OnboardingStep slot="2">
        <template slot="title">{$t('A few benefits of using Streamlabs OBS')}</template>
        <template slot="desc">
          {$t('Some exclusive features we recommend to take your stream to the next level')}
        </template>
        <div class={styles.container}>
          {this.recommendedFeatures.map(feature => {
            const data = this.featuresMetadata[feature];
            return (
              <div class={styles.card}>
                <h3>{data.title}</h3>
                <img src={require(`../../../../media/images/onboarding/${data.image}.png`)} />
                <div>{data.description}</div>
              </div>
            );
          })}
        </div>
      </OnboardingStep>
    );
  }
}
