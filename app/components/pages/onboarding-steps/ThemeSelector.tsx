import { Component, Prop } from 'vue-property-decorator';
import { OnboardingStep, ProgressBar } from 'streamlabs-beaker';
import TsxComponent from 'components/tsx-component';
import { $t } from 'services/i18n';
import { Inject } from 'services';
import { SceneCollectionsService } from 'services/scene-collections';
import styles from './ThemeSelector.m.less';

@Component({})
export default class ObsImport extends TsxComponent<{
  continue: () => void;
  setProcessing: (bool: boolean) => void;
}> {
  @Inject() sceneCollectionsService: SceneCollectionsService;

  @Prop() continue: () => void;
  @Prop() setProcessing: (bool: boolean) => void;

  installing = false;
  progress = 0;

  get themesMetadata() {
    return [
      {
        title: 'Borderline [Red Yellow] - by Nerd or Die',
        url: 'https://cdn.streamlabs.com/marketplace/overlays/7684923/ea91062/ea91062.overlay',
        thumbnail: 'borderline',
      },
      {
        title: 'Dark Matter by VBI',
        url: 'https://cdn.streamlabs.com/marketplace/overlays/7684923/3205db0/3205db0.overlay',
        thumbnail: 'darkmatter',
      },
      {
        title: 'Geometic Madness',
        url: 'https://cdn.streamlabs.com/marketplace/overlays/2116872/17f7cb5/17f7cb5.overlay',
        thumbnail: 'geometric',
      },
      {
        title: 'Nexus',
        url: 'https://cdn.streamlabs.com/marketplace/overlays/7684923/dd96270/dd96270.overlay',
        thumbnail: 'nexus',
      },
      {
        title: 'Relative Minds',
        url: 'https://cdn.streamlabs.com/marketplace/overlays/7684923/0d2e611/0d2e611.overlay',
        thumbnail: 'relativeminds',
      },
      {
        title: 'Facebook Gaming Pure Hexagons',
        url: 'https://cdn.streamlabs.com/marketplace/overlays/8062844/4a0582e/4a0582e.overlay',
        thumbnail: 'purehexagon',
      },
    ];
  }

  async installTheme(url: string, name: string) {
    this.installing = true;
    this.setProcessing(true);
    await this.sceneCollectionsService.installOverlay(
      url,
      name,
      progress => (this.progress = progress.percent),
    );
    this.installing = false;
    this.setProcessing(false);
    this.continue();
  }

  render(h: Function) {
    return (
      <OnboardingStep slot="2">
        <template slot="title">{$t('Add a Theme')}</template>
        <template slot="desc">
          {$t(
            'Not seeing a theme that catches your eye? Our theme library has hundreds of free choices available',
          )}
          {!this.installing ? (
            <div class={styles.container}>
              {this.themesMetadata.map(theme => (
                <div class={styles.cell} onClick={() => this.installTheme(theme.url, theme.title)}>
                  <img
                    class={styles.thumbnail}
                    src={require(`../../../../media/images/onboarding/${theme.thumbnail}.png`)}
                  />
                  <div class={styles.title}>{theme.title}</div>
                </div>
              ))}
            </div>
          ) : (
            <ProgressBar progressComplete={Math.floor(this.progress * 100)} />
          )}
        </template>
      </OnboardingStep>
    );
  }
}
