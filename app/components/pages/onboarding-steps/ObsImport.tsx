import electron from 'electron';
import { Component } from 'vue-property-decorator';
import Multiselect from 'vue-multiselect';
import TsxComponent, { createProps } from 'components/tsx-component';
import { Inject } from 'services/core/injector';
import { ObsImporterService } from 'services/obs-importer';
import { ScenesService } from 'services/scenes';
import defer from 'lodash/defer';
import { $t } from 'services/i18n';
import styles from './ObsImport.m.less';

class ObsImportProps {
  continue: (bool: boolean) => void = () => {};
  setProcessing: (bool: boolean) => void = () => {};
}

@Component({ props: createProps(ObsImportProps) })
export default class ObsImport extends TsxComponent<ObsImportProps> {
  @Inject() obsImporterService: ObsImporterService;
  @Inject() scenesService: ScenesService;

  get hasExternalMonitor() {
    return electron.remote.screen
      .getAllDisplays()
      .find(display => display.bounds.x !== 0 || display.bounds.y !== 0);
  }

  get isIrlStreamer() {
    return this.scenesService.views.scenes.find(scene => /irl/i.test(scene.name));
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
        title: $t('Face Masks'),
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

  importing = false;
  pathChosen = false;

  sceneCollections = this.obsImporterService.getSceneCollections();

  profiles = this.obsImporterService.getProfiles();

  selectedProfile = this.profiles[0] || null;

  startImport(forceStart?: boolean) {
    if (this.importing) return;
    this.pathChosen = true;
    if (this.profiles.length > 1 && !forceStart) return;

    this.importing = true;
    this.props.setProcessing(true);
    defer(async () => {
      try {
        await this.obsImporterService.load(this.selectedProfile);
        this.importing = false;
        this.props.setProcessing(false);
        this.props.continue(true);
      } catch (e) {
        this.$toasted.show($t('Something went wrong.'), {
          position: 'bottom-center',
          className: 'toast-alert',
          duration: 3000,
        });
        this.props.setProcessing(false);
        this.importing = false;
      }
    });
  }

  get featureCards() {
    return (
      <div class={styles.container}>
        {this.recommendedFeatures.map(feature => {
          const data = this.featuresMetadata[feature];
          return (
            <div class={styles.card}>
              <div>
                <h3>{data.title}</h3>
                <div>{data.description}</div>
              </div>
              <img src={require(`../../../../media/images/onboarding/${data.image}.png`)} />
            </div>
          );
        })}
      </div>
    );
  }

  render() {
    return (
      <div style="width: 100%;">
        <h1>{$t('Importing Your Existing Settings From OBS')}</h1>
        <div>
          {$t(
            'It takes about one minute to import your settings, so you have some time to look at some of our features',
          )}
        </div>
        {this.profiles.length > 1 && !this.importing && (
          <div>
            <span class={styles.profileSelectTitle}>{$t('Select an OBS profile to import')}</span>
            <Multiselect
              class={styles.profileSelect}
              value={this.selectedProfile}
              onInput={(val: string) => (this.selectedProfile = val)}
              options={this.profiles}
              allowEmpty={false}
              showLabels={false}
            />
            <button class="button button--action" onClick={() => this.startImport(true)}>
              {$t('Start')}
            </button>
          </div>
        )}
        {this.importing && <i class="fa fa-spinner fa-pulse" />}
        {this.featureCards}
      </div>
    );
  }
}
