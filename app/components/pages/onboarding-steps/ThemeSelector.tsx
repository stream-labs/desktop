import cx from 'classnames';
import { Component } from 'vue-property-decorator';
import { ProgressBar } from 'streamlabs-beaker';
import TsxComponent, { createProps } from 'components/tsx-component';
import { $t } from 'services/i18n';
import { Inject } from 'services';
import { SceneCollectionsService } from 'services/scene-collections';
import commonStyles from './Common.m.less';
import styles from './ThemeSelector.m.less';
import { throttleSetter } from 'lodash-decorators';

class ThemeSelectorProps {
  continue: () => void = () => {};
  setProcessing: (bool: boolean) => void = () => {};
}

@Component({ props: createProps(ThemeSelectorProps) })
export default class ObsImport extends TsxComponent<ThemeSelectorProps> {
  @Inject() sceneCollectionsService: SceneCollectionsService;

  installing = false;
  showDetail: string = null;
  progress = 0;

  get themesMetadata() {
    return [
      {
        title: 'Borderline [Red Yellow] - by Nerd or Die',
        url: 'https://cdn.streamlabs.com/marketplace/overlays/7684923/ea91062/ea91062.overlay',
        thumbnail: 'borderline',
        detail: {},
      },
      {
        title: 'Dark Matter by VBI',
        url: 'https://cdn.streamlabs.com/marketplace/overlays/7684923/3205db0/3205db0.overlay',
        thumbnail: 'darkmatter',
        detail: {},
      },
      {
        title: 'Geometic Madness',
        url: 'https://cdn.streamlabs.com/marketplace/overlays/2116872/17f7cb5/17f7cb5.overlay',
        thumbnail: 'geometric',
        detail: {},
      },
      {
        title: 'Nexus',
        url: 'https://cdn.streamlabs.com/marketplace/overlays/7684923/dd96270/dd96270.overlay',
        thumbnail: 'nexus',
        detail: {},
      },
      {
        title: 'Relative Minds',
        url: 'https://cdn.streamlabs.com/marketplace/overlays/7684923/0d2e611/0d2e611.overlay',
        thumbnail: 'relativeminds',
        detail: {},
      },
      {
        title: 'Facebook Gaming Pure Hexagons',
        url: 'https://cdn.streamlabs.com/marketplace/overlays/8062844/4a0582e/4a0582e.overlay',
        thumbnail: 'purehexagon',
        detail: {},
      },
    ];
  }

  get detailInfo() {
    const index = this.themesMetadata.findIndex(data => data.title === this.showDetail);
    if (index === -1) return null;
    return { index, ...this.themesMetadata[index] };
  }

  get filteredMetadata() {
    if (!this.detailInfo) return this.themesMetadata;
    if ([2, 5].includes(this.detailInfo.index)) {
      return [this.themesMetadata[0], this.themesMetadata[3]];
    } else {
      return [this.themesMetadata[2], this.themesMetadata[5]];
    }
  }

  focusTheme(title: string) {
    this.showDetail = title;
  }

  async installTheme(url: string, name: string) {
    this.installing = true;
    this.props.setProcessing(true);
    const sub = this.sceneCollectionsService.downloadProgress.subscribe(
      progress => (this.progress = progress.percent),
    );
    await this.sceneCollectionsService.installOverlay(url, name);
    sub.unsubscribe();
    this.installing = false;
    this.props.setProcessing(false);
    this.props.continue();
  }

  render() {
    return (
      <div>
        <h1 class={commonStyles.titleContainer}>{$t('Add a Theme')}</h1>
        <div>
          {!this.installing ? (
            <div class={styles.container}>
              {this.filteredMetadata.map(theme => (
                <div class={styles.cell} onClick={() => this.focusTheme(theme.title)}>
                  <img
                    class={styles.thumbnail}
                    src={require(`../../../../media/images/onboarding/${theme.thumbnail}.png`)}
                  />
                  <div class={styles.title}>{theme.title}</div>
                </div>
              ))}
              {this.showDetail && (
                <div
                  class={cx(
                    styles.detailPanel,
                    [2, 5].includes(this.detailInfo.index) ? styles.right : styles.left,
                  )}
                  onClick={() => this.focusTheme(null)}
                >
                  {/* <img /> */}
                </div>
              )}
            </div>
          ) : (
            <ProgressBar progressComplete={Math.floor(this.progress * 100)} />
          )}
        </div>
      </div>
    );
  }
}
