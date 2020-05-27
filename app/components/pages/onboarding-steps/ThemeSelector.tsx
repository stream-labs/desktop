import cx from 'classnames';
import { Component } from 'vue-property-decorator';
import TsxComponent, { createProps } from 'components/tsx-component';
import SmoothProgressBar from 'components/shared/SmoothProgressBar';
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
export default class ThemeSelector extends TsxComponent<ThemeSelectorProps> {
  @Inject() sceneCollectionsService: SceneCollectionsService;
  @Inject() onboardingService: OnboardingService;

  installing = false;
  showDetail: string = null;
  bigPreview: string = null;
  progress = 0;
  // Bad typing until we get typechecked APIs
  themesMetadata: Array<any> = [];

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

  get detailTheme() {
    return this.themesMetadata[this.detailIndex];
  }

  preview(src: string, className: string) {
    const isVideo = /\.mp4$/.test(src);
    return isVideo ? (
      <video
        autoplay
        muted
        loop
        src={src}
        class={className}
        onClick={(e: MouseEvent) => this.focusPreview(e, src)}
      />
    ) : (
      <img src={src} class={className} onClick={(e: MouseEvent) => this.focusPreview(e, src)} />
    );
  }

  focusPreview(event: MouseEvent, src: string) {
    event.stopPropagation();
    this.bigPreview = src;
  }

  thumbnail(theme: any) {
    return this.previewImages(theme).find((img: string) => /\.png$|\.jpg$|\.jpeg$/.test(img));
  }

  focusTheme(theme: any) {
    if (!theme) {
      this.showDetail = null;
      this.bigPreview = null;
    } else {
      this.showDetail = theme.data.id;
      this.bigPreview = this.previewImages(theme)[0];
    }
  }

  previewImages(theme: any): Array<string> {
    if (!theme?.data) return [];
    return (Object.values(theme.data.custom_images) as Array<string>).slice(0, 3);
  }

  async installTheme(event: MouseEvent) {
    event.stopPropagation();
    const url = this.onboardingService.themeUrl(this.detailTheme.data.id);
    this.installing = true;
    this.props.setProcessing(true);
    const sub = this.sceneCollectionsService.downloadProgress.subscribe(
      progress => (this.progress = progress.percent),
    );
    await this.sceneCollectionsService.installOverlay(url, this.detailTheme.data.name);
    sub.unsubscribe();
    this.installing = false;
    this.props.setProcessing(false);
    this.props.continue();
  }

  render() {
    return (
      <div style="width: 100%;">
        <h1 class={commonStyles.titleContainer}>{$t('Add a Theme')}</h1>
        <div>
          {!this.installing ? (
            <div class={styles.container}>
              {this.filteredMetadata.map(theme => (
                <div class={styles.cell} onClick={() => this.focusTheme(theme)}>
                  <img class={styles.thumbnail} src={this.thumbnail(theme)} />
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
                  <div class={styles.detailHeader}>
                    <h1>{this.detailTheme.data.name}</h1>
                    <button
                      class={cx('button button--action', commonStyles.onboardingButton)}
                      onClick={(e: MouseEvent) => this.installTheme(e)}
                    >
                      {$t('Install')}
                    </button>
                    <i class="icon-close" />
                  </div>
                  <div class={styles.previewGrid}>
                    {this.preview(this.bigPreview, styles.bigPreview)}
                    {this.previewImages(this.detailTheme).map((src: string) =>
                      this.preview(
                        src,
                        cx(styles.preview, { [styles.active]: src === this.bigPreview }),
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <SmoothProgressBar
              value={this.progress}
              timeLimit={60 * 1000}
              class={styles.progressBar}
            />
          )}
        </div>
      </div>
    );
  }
}
