import cx from 'classnames';
import { Component } from 'vue-property-decorator';
import { ProgressBar } from 'streamlabs-beaker';
import TsxComponent, { createProps } from 'components/tsx-component';
import { $t } from 'services/i18n';
import { Inject } from 'services';
import { SceneCollectionsService } from 'services/scene-collections';
import commonStyles from './Common.m.less';
import styles from './ThemeSelector.m.less';
import { OnboardingService } from 'services/onboarding';

class ThemeSelectorProps {
  continue: () => void = () => {};
  setProcessing: (bool: boolean) => void = () => {};
}

@Component({ props: createProps(ThemeSelectorProps) })
export default class ObsImport extends TsxComponent<ThemeSelectorProps> {
  @Inject() sceneCollectionsService: SceneCollectionsService;
  @Inject() onboardingService: OnboardingService;

  installing = false;
  showDetail: string = null;
  progress = 0;
  // Bad typing until we get typechecked APIs
  themesMetadata: any[] = [];

  async mounted() {
    this.themesMetadata = await this.onboardingService.fetchThemes();
  }

  get filteredMetadata() {
    if (!this.showDetail) return this.themesMetadata;
    if ([2, 5].includes(this.detailIndex)) {
      return [this.themesMetadata[0], this.themesMetadata[3]];
    } else {
      return [this.themesMetadata[2], this.themesMetadata[5]];
    }
  }

  get detailIndex() {
    return this.themesMetadata.findIndex(theme => theme.data.id === this.showDetail);
  }

  thumbnail(theme: any) {
    if (!theme) return '';
    return Object.values(theme.custom_images).find((img: string) =>
      /\.png$|\.jpg$|\.jpeg$/.test(img),
    );
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
                <div class={styles.cell} onClick={() => this.focusTheme(theme.data.id)}>
                  <img class={styles.thumbnail} src={this.thumbnail(theme.data)} />
                  <div class={styles.title}>{theme.data.name}</div>
                </div>
              ))}
              {this.showDetail && (
                <div
                  class={cx(
                    styles.detailPanel,
                    [2, 5].includes(this.detailIndex) ? styles.right : styles.left,
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
