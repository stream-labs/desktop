import React, { useEffect, useMemo, useRef } from 'react';
import fs from 'fs';
import * as remote from '@electron/remote';
import cx from 'classnames';
import Animation from 'rc-animate';
import { $t } from 'services/i18n';
import { getPlatformService } from 'services/platforms';
import ResizeBar from 'components-react/root/ResizeBar';
import TitleBar from 'components-react/shared/TitleBar';
import ModalWrapper from 'components-react/shared/modals/ModalWrapper';
import { Services } from 'components-react/service-provider';
import { WindowsService } from 'app-services';
import { initStore, useController } from 'components-react/hooks/zustand';
import { useVuex } from 'components-react/hooks';
import antdThemes from 'styles/antd/index';
import styles from './Main.m.less';
import SideNav from 'components-react/sidebar/SideNav';
import LiveDock from 'components-react/root/LiveDock';
import StudioFooter from 'components-react/root/StudioFooter';
import Loader from 'components-react/pages/Loader';

const MainCtx = React.createContext<MainController | null>(null);

class MainController {
  private customizationService = Services.CustomizationService;
  private navigationService = Services.NavigationService;
  private appService = Services.AppService;
  private userService = Services.UserService;
  private windowsService = Services.WindowsService;
  private scenesService = Services.ScenesService;
  private platformAppsService = Services.PlatformAppsService;
  private editorCommandsService = Services.EditorCommandsService;

  // $refs: {
  //   mainMiddle: HTMLDivElement;
  // };

  private modalOptions: IModalOptions = {
    renderFn: null,
  };

  setModalOptions(opts: IModalOptions) {
    this.modalOptions = opts;
  }

  store = initStore({
    compactView: false,
    windowWidth: 0,
    hasLiveDock: true,
    minDockWidth: 290,
    maxDockWidth: 290,
    minEditorWidth: 500,
  });

  get uiReady() {
    // return this.$store.state.bulkLoadFinished && this.$store.state.i18nReady;
    return false;
  }

  get dockWidth() {
    return this.customizationService.state.livedockSize;
  }

  get title() {
    return this.windowsService.state.main.title;
  }

  get page() {
    return this.navigationService.state.currentPage;
  }

  get params() {
    return this.navigationService.state.params;
  }

  get theme() {
    // if (this.$store.state.bulkLoadFinished) {
    //   return this.customizationService.currentTheme;
    // }

    // return loadedTheme() || 'night-theme';
    return '';
  }

  get applicationLoading() {
    return this.appService.state.loading;
  }

  get showLoadingSpinner() {
    return (
      this.appService.state.loading && this.page !== 'Onboarding' && this.page !== 'BrowseOverlays'
    );
  }

  get isLoggedIn() {
    return this.userService.isLoggedIn;
  }

  get renderDock() {
    return (
      this.isLoggedIn &&
      !this.isOnboarding &&
      this.store.hasLiveDock &&
      getPlatformService(this.userService.platform?.type)?.liveDockEnabled &&
      !this.showLoadingSpinner
    );
  }

  get liveDockSize() {
    return this.customizationService.state.livedockSize;
  }

  get isDockCollapsed() {
    return this.customizationService.state.livedockCollapsed;
  }

  get leftDock() {
    return this.customizationService.state.leftDock;
  }

  get isOnboarding() {
    return this.navigationService.state.currentPage === 'Onboarding';
  }

  get platformApps() {
    return this.platformAppsService.enabledApps;
  }

  get errorAlert() {
    return this.appService.state.errorAlert;
  }

  get mainResponsiveClasses() {
    const classes = [];

    if (this.store.compactView) {
      classes.push('main-middle--compact');
    }

    return classes.join(' ');
  }

  async isDirectory(path: string) {
    return new Promise<boolean>((resolve, reject) => {
      fs.lstat(path, (err, stats) => {
        if (err) {
          reject(err);
        }
        resolve(stats.isDirectory());
      });
    });
  }

  async onDropHandler(event: DragEvent) {
    if (this.page !== 'Studio') return;

    const fileList = event.dataTransfer?.files;

    if (!fileList || fileList.length < 1) return;

    const files: string[] = [];
    let fi = fileList.length;
    while (fi--) files.push(fileList.item(fi).path);

    const isDirectory = await this.isDirectory(files[0]).catch(err => {
      console.error('Error checking if drop is directory', err);
      return false;
    });

    if (files.length > 1 || isDirectory) {
      remote.dialog
        .showMessageBox(remote.getCurrentWindow(), {
          title: 'Streamlabs Desktop',
          message: $t('Are you sure you want to import multiple files?'),
          type: 'warning',
          buttons: [$t('Cancel'), $t('OK')],
        })
        .then(({ response }) => {
          if (!response) return;
          this.executeFileDrop(files);
        });
    } else {
      this.executeFileDrop(files);
    }
  }

  executeFileDrop(files: string[]) {
    this.editorCommandsService.actions.executeCommand(
      'AddFilesCommand',
      this.scenesService.views.activeSceneId,
      files,
    );
  }

  // updateLiveDockContraints() {
  //   const appRect = this.$root.$el.getBoundingClientRect();
  //   this.maxDockWidth = Math.min(appRect.width - this.minEditorWidth, appRect.width / 2);
  //   this.minDockWidth = Math.min(290, this.maxDockWidth);
  // }

  // windowSizeHandler() {
  //   if (!this.windowsService.state.main.hideStyleBlockers) {
  //     this.onResizeStartHandler();
  //   }
  //   this.windowWidth = window.innerWidth;

  //   clearTimeout(this.windowResizeTimeout);

  //   this.hasLiveDock = this.windowWidth >= 1070;
  //   if (this.page === 'Studio') {
  //     this.hasLiveDock = this.windowWidth >= this.minEditorWidth + 100;
  //   }
  //   this.windowResizeTimeout = window.setTimeout(() => {
  //     this.windowsService.actions.updateStyleBlockers('main', false);
  //     this.updateLiveDockContraints();
  //     this.updateWidth();
  //   }, 200);
  // }

  handleResize() {
    // this.compactView = this.$refs.mainMiddle.clientWidth < 1200;
  }

  handleEditorWidth(width: number) {
    this.store.setState(s => (s.minEditorWidth = width));
  }

  onResizeStartHandler() {
    this.windowsService.actions.updateStyleBlockers('main', true);
  }

  onResizeStopHandler(offset: number) {
    this.setLiveDockWidth(this.customizationService.state.livedockSize + offset);
    this.windowsService.actions.updateStyleBlockers('main', false);
  }

  setLiveDockWidth(width: number) {
    this.customizationService.actions.setSettings({
      livedockSize: this.validateWidth(width),
    });
  }

  validateWidth(width: number): number {
    let constrainedWidth = Math.max(this.store.minDockWidth, width);
    constrainedWidth = Math.min(this.store.maxDockWidth, width);
    return constrainedWidth;
  }

  updateLiveDockWidth() {
    if (this.liveDockSize !== this.validateWidth(this.liveDockSize)) {
      this.setLiveDockWidth(this.liveDockSize);
    }
  }

  resetWidth() {
    // const appRect = this.$root.$el.getBoundingClientRect();
    // const defaultWidth = appRect.width * 0.28;
    // this.setWidth(defaultWidth);
  }
}

export default function MainWithContext() {
  const controller = useMemo(() => new MainController(), []);
  return (
    <MainCtx.Provider value={controller}>
      <Main />
    </MainCtx.Provider>
  );
}

function Main() {
  const ctrl = useController(MainCtx);
  const { theme, uiReady, dockWidth, showLoadingSpinner } = useVuex(() => ({
    theme: ctrl.theme,
    uiReady: ctrl.uiReady,
    dockWidth: ctrl.dockWidth,
    showLoadingSpinner: ctrl.showLoadingSpinner,
  }));

  useEffect(() => {
    window.addEventListener('resize', () => ctrl.windowSizeHandler);
    const modalChangedSub = WindowsService.modalChanged.subscribe(modalOptions => {
      ctrl.setModalOptions(modalOptions);
    });

    return () => {
      window.removeEventListener('resize', () => ctrl.windowSizeHandler);
      modalChangedSub.unsubscribe();
    };
  }, []);

  const oldTheme = useRef<string | null>(null);
  useEffect(() => {
    if (!theme) return;
    if (oldTheme.current && oldTheme.current !== theme) antdThemes[oldTheme.current].unuse();
    antdThemes[theme].use();
    oldTheme.current = theme;
  }, [theme]);

  useEffect(() => {
    if (dockWidth < 1) {
      // migrate from old percentage value to the pixel value
      ctrl.resetWidth();
    }
    ctrl.handleResize();
  }, [uiReady]);

  if (!uiReady) return <div className={cx(styles.main, theme)} />;

  return (
    <div className={cx(styles.main, theme)} id="mainWrapper" onDrop="onDropHandler">
      <TitleBar windowId="main" className={cx({ [styles.titlebarError]: errorAlert })} />
      <div
        className={cx(styles.mainContents, {
          [styles.mainContentsRight]: renderDock && leftDock && hasLiveDock,
          [styles.mainContentsLeft]: renderDock && !leftDock && hasLiveDock,
          [styles.mainContentsOnboarding]: page === 'Onboarding',
        })}
      >
        {page !== 'Onboarding' && !showLoadingSpinner && (
          <SideNav locked={applicationLoading} className={styles.sidenav} />
        )}
        {renderDock && leftDock && (
          <div className={styles.liveDockWrapper}>
            <LiveDock onLeft />
            {!isDockCollapsed && (
              <ResizeBar
                className={cx(styles.liveDockResizeBar, styles.liveDockResizeBarLeft)}
                position="right"
                onResizeStart={ctrl.onResizeStartHandler}
                onResizeStop={ctrl.onResizeStopHandler}
                max={maxDockWidth}
                min={minDockWidth}
                value={liveDockSize}
              />
            )}
          </div>
        )}

        <div className={cx(styles.mainMiddle, mainResponsiveClasses)} ref="mainMiddle">
          {/* <resize-observer @notify="handleResize" /> */}
          {/* <component
            class="main-page-container"
            v-if="!showLoadingSpinner"
            :is="page"
            :params="params"
            :component-props="{ onTotalWidth: width => handleEditorWidth(width), params }"
            @totalWidth="width => handleEditorWidth(width)"
            style="grid-row: 1 / span 1"
          /> */}
          {!applicationLoading && page !== 'Onboarding' && <StudioFooter />}
        </div>

        {renderDock && !leftDock && (
          <div className={styles.liveDockWrapper}>
            {!isDockCollapsed && (
              <ResizeBar
                className={styles.liveDockResizeBar}
                position="left"
                onResizeStart={ctrl.onResizeStartHandler}
                onResizeStop={ctrl.onResizeStopHandler}
                max={maxDockWidth}
                min={minDockWidth}
                value={liveDockSize}
              />
            )}
            <LiveDock />
          </div>
        )}
      </div>
      <ModalWrapper renderFn={ctrl.modalOptions.renderFn} />
      <Animation transitionName="antd-fade">
        {(!uiReady || showLoadingSpinner) && (
          <div className={cx(styles.mainLoading, { [styles.initialLoading]: !uiReady })}>
            <Loader />
          </div>
        )}
      </Animation>
    </div>
  );
}
