import React, { ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import fs from 'fs';
import * as remote from '@electron/remote';
import cx from 'classnames';
import Animation from 'rc-animate';
import { $t } from 'services/i18n';
import { initStore, useController } from 'components-react/hooks/zustand';
import { useVuex } from 'components-react/hooks';
import * as appPages from 'components-react/pages';
import TitleBar from 'components-react/shared/TitleBar';
import ModalWrapper from 'components-react/shared/modals/ModalWrapper';
import { Services } from 'components-react/service-provider';
import { WindowsService } from 'app-services';
import SideNav from 'components-react/sidebar/SideNav';
import LiveDock from 'components-react/root/LiveDock';
import StudioFooter from 'components-react/root/StudioFooter';
import Loader from 'components-react/pages/Loader';
import antdThemes from 'styles/antd/index';
import { getPlatformService } from 'services/platforms';
import { IModalOptions } from 'services/windows';
import { TApplicationTheme } from 'services/customization';
import styles from './Main.m.less';
import { StatefulService } from 'services';
import { useRealmObject } from 'components-react/hooks/realm';

const MainCtx = React.createContext<MainController | null>(null);

const loadedTheme = (): TApplicationTheme | undefined => {
  const customizationState = localStorage.getItem('PersistentStatefulService-CustomizationService');
  if (customizationState) {
    return JSON.parse(customizationState)?.theme;
  }
};

class MainController {
  private customizationService = Services.CustomizationService;
  private navigationService = Services.NavigationService;
  private appService = Services.AppService;
  private userService = Services.UserService;
  private windowsService = Services.WindowsService;
  private scenesService = Services.ScenesService;
  private platformAppsService = Services.PlatformAppsService;
  private editorCommandsService = Services.EditorCommandsService;

  modalOptions: IModalOptions = {
    renderFn: null,
  };

  setModalOptions(opts: Partial<IModalOptions>) {
    this.modalOptions = { ...this.modalOptions, ...opts };
  }

  windowResizeTimeout: number | null = null;

  store = initStore({
    compactView: false,
    hasLiveDock: true,
    minDockWidth: 290,
    maxDockWidth: 290,
    minEditorWidth: 500,
  });

  get title() {
    return this.windowsService.state.main.title;
  }

  get page() {
    return this.navigationService.state.currentPage;
  }

  get params() {
    return this.navigationService.state.params;
  }

  get hideStyleBlockers() {
    return this.windowsService.state.main.hideStyleBlockers;
  }

  theme(bulkLoadFinished: boolean): TApplicationTheme {
    if (bulkLoadFinished) {
      return this.customizationService.currentTheme;
    }

    return loadedTheme() || 'night-theme';
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

  async onDropHandler(event: React.DragEvent) {
    if (this.page !== 'Studio') return;

    const fileList = event.dataTransfer?.files;

    if (!fileList || fileList.length < 1) return;

    const files: string[] = [];
    let fi = fileList.length;
    while (fi--) files.push(fileList.item(fi)!.path);

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

  handleEditorWidth(width: number) {
    this.store.setState(s => {
      s.minEditorWidth = width;
    });
  }

  updateLiveDockWidth() {
    if (this.liveDockSize !== this.validateWidth(this.liveDockSize)) {
      this.setLiveDockWidth(this.liveDockSize);
    }
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

  updateStyleBlockers(val: boolean) {
    this.windowsService.actions.updateStyleBlockers('main', val);
  }
}

export default function MainWithContext(): ReactElement<{}> {
  const controller = useMemo(() => new MainController(), []);
  return (
    <MainCtx.Provider value={controller}>
      <Main />
    </MainCtx.Provider>
  );
}

function Main() {
  const ctrl = useController(MainCtx);

  const mainWindowEl = useRef<HTMLDivElement | null>(null);
  const mainMiddleEl = useRef<HTMLDivElement | null>(null);

  const [bulkLoadFinished, setBulkLoadFinished] = useState(false);
  const [i18nReady, seti18nReady] = useState(false);

  const uiReady = bulkLoadFinished && i18nReady;

  const {
    theme,
    showLoadingSpinner,
    errorAlert,
    hasLiveDock,
    renderDock,
    leftDock,
    applicationLoading,
    page,
    maxDockWidth,
    minDockWidth,
    hideStyleBlockers,
    compactView,
  } = useVuex(
    () => ({
      theme: ctrl.theme(bulkLoadFinished),
      showLoadingSpinner: ctrl.showLoadingSpinner,
      errorAlert: ctrl.errorAlert,
      renderDock: ctrl.renderDock,
      leftDock: ctrl.leftDock,
      hasLiveDock: ctrl.store.hasLiveDock,
      applicationLoading: ctrl.applicationLoading,
      page: ctrl.page,
      maxDockWidth: ctrl.store.maxDockWidth,
      minDockWidth: ctrl.store.minDockWidth,
      hideStyleBlockers: ctrl.hideStyleBlockers,
      compactView: ctrl.store.compactView,
    }),
    true,
  );

  const dockWidth = useRealmObject(Services.CustomizationService.state).livedockSize;

  useEffect(() => {
    const unsubscribe = StatefulService.store.subscribe((_, state) => {
      if (state.bulkLoadFinished) setBulkLoadFinished(true);
      if (state.i18nReady) seti18nReady(true);
    });

    return unsubscribe;
  }, []);

  function windowSizeHandler() {
    if (!hideStyleBlockers) {
      ctrl.updateStyleBlockers(true);
    }
    const windowWidth = window.innerWidth;

    if (ctrl.windowResizeTimeout) clearTimeout(ctrl.windowResizeTimeout);

    ctrl.store.setState(s => {
      s.hasLiveDock =
        ctrl.page === 'Studio' ? windowWidth >= s.minEditorWidth + 100 : windowWidth >= 1070;
    });
    ctrl.windowResizeTimeout = window.setTimeout(() => {
      ctrl.updateStyleBlockers(false);
      const appRect = mainWindowEl.current?.getBoundingClientRect();
      if (!appRect) return;
      ctrl.store.setState(s => {
        s.maxDockWidth = Math.min(appRect.width - s.minEditorWidth, appRect.width / 2);
        s.minDockWidth = Math.min(290, s.maxDockWidth);
      });
      ctrl.updateLiveDockWidth();
    }, 200);
  }

  useEffect(() => {
    window.addEventListener('resize', windowSizeHandler);
    const modalChangedSub = WindowsService.modalChanged.subscribe(modalOptions => {
      ctrl.setModalOptions(modalOptions);
    });

    return () => {
      window.removeEventListener('resize', windowSizeHandler);
      modalChangedSub.unsubscribe();
    };
  }, [hideStyleBlockers]);

  const oldTheme = useRef<TApplicationTheme | null>(null);
  useEffect(() => {
    if (!theme) return;
    if (oldTheme.current && oldTheme.current !== theme) antdThemes[oldTheme.current].unuse();
    antdThemes[theme].use();
    oldTheme.current = theme;
  }, [theme]);

  useEffect(() => {
    if (dockWidth < 1 && mainWindowEl.current) {
      // migrate from old percentage value to the pixel value
      const appRect = mainWindowEl.current.getBoundingClientRect();
      const defaultWidth = appRect.width * 0.28;
      ctrl.setLiveDockWidth(defaultWidth);
    }
  }, [uiReady]);

  useEffect(() => {
    ctrl.store.setState(s => {
      s.compactView = !!mainMiddleEl.current && mainMiddleEl.current.clientWidth < 1200;
    });
  }, [uiReady, hideStyleBlockers]);

  if (!uiReady) return <div className={cx(styles.main, theme)} />;

  const Component: React.FunctionComponent<{
    className?: string;
    params: any;
    onTotalWidth: (width: number) => void;
  }> = (appPages as Dictionary<React.FunctionComponent>)[page];

  return (
    <div
      className={cx(styles.main, theme, 'react')}
      id="mainWrapper"
      ref={mainWindowEl}
      onDrop={(ev: React.DragEvent) => ctrl.onDropHandler(ev)}
    >
      <TitleBar windowId="main" className={cx({ [styles.titlebarError]: errorAlert })} />
      <div
        className={cx(styles.mainContents, {
          [styles.mainContentsRight]: renderDock && leftDock && hasLiveDock,
          [styles.mainContentsLeft]: renderDock && !leftDock && hasLiveDock,
          [styles.mainContentsOnboarding]: page === 'Onboarding',
        })}
      >
        {page !== 'Onboarding' && !showLoadingSpinner && (
          <div className={styles.sideNavContainer}>
            <SideNav />
          </div>
        )}
        {renderDock && leftDock && (
          <LiveDock
            onLeft
            setLiveDockWidth={(width: number) => ctrl.setLiveDockWidth(width)}
            minDockWidth={minDockWidth}
            maxDockWidth={maxDockWidth}
          />
        )}

        <div
          className={cx(styles.mainMiddle, { [styles.mainMiddleCompact]: compactView })}
          ref={mainMiddleEl}
        >
          {!showLoadingSpinner && (
            <div
              className={styles.mainPageContainer}
              style={{ gridRow: '1 / span 1', minWidth: 0, minHeight: 0 }}
            >
              <Component
                params={ctrl.params}
                onTotalWidth={(width: number) => ctrl.handleEditorWidth(width)}
              />
            </div>
          )}
          {!applicationLoading && page !== 'Onboarding' && (
            <div style={{ display: 'flex', minWidth: '0px', gridRow: '2 / span 1' }}>
              <StudioFooter />
            </div>
          )}
        </div>

        {renderDock && !leftDock && (
          <LiveDock
            setLiveDockWidth={(width: number) => ctrl.setLiveDockWidth(width)}
            minDockWidth={minDockWidth}
            maxDockWidth={maxDockWidth}
          />
        )}
      </div>
      <ModalWrapper renderFn={ctrl.modalOptions.renderFn} />
      <Animation transitionName="ant-fade">
        {(!uiReady || showLoadingSpinner) && (
          <div className={cx(styles.mainLoading, { [styles.initialLoading]: !uiReady })}>
            <Loader />
          </div>
        )}
      </Animation>
    </div>
  );
}
