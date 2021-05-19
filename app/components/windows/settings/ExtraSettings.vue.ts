import Vue from 'vue';
import electron from 'electron';
import { Component } from 'vue-property-decorator';
import { BoolInput } from 'components/shared/inputs/inputs';
import { CacheUploaderService } from 'services/cache-uploader';
import { Inject } from 'services/core/injector';
import { CustomizationService } from 'services/customization';
import { StreamlabelsService } from 'services/streamlabels/index';
import { OnboardingService } from 'services/onboarding';
import { WindowsService } from 'services/windows';
import { UserService } from 'services/user';
import { StreamingService } from 'services/streaming/index';
import { $t } from 'services/i18n/index';
import { AppService } from 'services/app/index';
import fs from 'fs';
import path from 'path';
import { ObsImporterService } from 'services/obs-importer';
import { StreamSettingsService } from 'services/settings/streaming';
import rimraf from 'rimraf';

@Component({
  components: { BoolInput },
})
export default class ExtraSettings extends Vue {
  @Inject() cacheUploaderService: CacheUploaderService;
  @Inject() customizationService: CustomizationService;
  @Inject() streamlabelsService: StreamlabelsService;
  @Inject() onboardingService: OnboardingService;
  @Inject() windowsService: WindowsService;
  @Inject() userService: UserService;
  @Inject() streamingService: StreamingService;
  @Inject() appService: AppService;
  @Inject() obsImporterService: ObsImporterService;
  @Inject() streamSettingsService: StreamSettingsService;

  cacheUploading = false;

  get streamInfoUpdate() {
    return this.customizationService.state.updateStreamInfoOnLive;
  }

  set streamInfoUpdate(value: boolean) {
    this.customizationService.setUpdateStreamInfoOnLive(value);
  }

  get protectedMode() {
    return this.streamSettingsService.state.protectedModeEnabled;
  }

  async showCacheDir() {
    await electron.remote.shell.openPath(this.appService.appDataDirectory);
  }

  deleteCacheDir() {
    if (
      confirm(
        $t(
          'WARNING! You will lose all stream and encoder settings. If you are logged in, your scenes and sources will be restored from the cloud. This cannot be undone.',
        ),
      )
    ) {
      electron.remote.app.relaunch({ args: ['--clearCacheDir'] });
      electron.remote.app.quit();
    }
  }

  uploadCacheDir() {
    this.cacheUploading = true;
    this.cacheUploaderService.uploadCache().then(file => {
      electron.remote.clipboard.writeText(file);
      alert(
        $t(
          'Your cache directory has been successfully uploaded.  ' +
            'The file name %{file} has been copied to your clipboard.',
          { file },
        ),
      );
      this.cacheUploading = false;
    });
  }

  restartStreamlabelsSession() {
    this.streamlabelsService.restartSession().then(result => {
      if (result) {
        electron.remote.dialog.showMessageBox({
          message: $t('Stream Labels session has been successfully restarted!'),
        });
      }
    });
  }

  runAutoOptimizer() {
    this.onboardingService.start({ isOptimize: true });
    this.windowsService.closeChildWindow();
  }

  configureDefaults() {
    this.onboardingService.start({ isHardware: true });
    this.windowsService.closeChildWindow();
  }

  importFromObs() {
    this.onboardingService.start({ isImport: true });
    this.windowsService.closeChildWindow();
  }

  get isLoggedIn() {
    return this.userService.isLoggedIn;
  }

  get isTwitch() {
    return this.isLoggedIn && this.userService.platform.type === 'twitch';
  }

  get isFacebook() {
    return this.isLoggedIn && this.userService.platform.type === 'facebook';
  }

  get isRecordingOrStreaming() {
    return this.streamingService.isStreaming || this.streamingService.isRecording;
  }

  // Avoid file IO by keeping track of file state in memory while
  // this component is mounted.
  disableHA: boolean = null;

  get disableHardwareAcceleration() {
    if (this.disableHA == null) {
      this.disableHA = fs.existsSync(this.disableHAFilePath);
    }

    return this.disableHA;
  }

  set disableHardwareAcceleration(val: boolean) {
    try {
      if (val) {
        // Touch the file
        fs.closeSync(fs.openSync(this.disableHAFilePath, 'w'));
        this.disableHA = true;
      } else {
        fs.unlinkSync(this.disableHAFilePath);
        this.disableHA = false;
      }
    } catch (e: unknown) {
      console.error('Error setting hardware acceleration', e);
    }
  }

  get disableHAFilePath() {
    return path.join(this.appService.appDataDirectory, 'HADisable');
  }

  enableCU: boolean = null;

  get enableCrashDumpUpload() {
    if (this.enableCU == null) {
      this.enableCU = fs.existsSync(this.enableCUFilePath);
    }

    return this.enableCU;
  }

  set enableCrashDumpUpload(val: boolean) {
    try {
      if (val) {
        fs.mkdirSync(this.enableCUFilePath);
        this.enableCU = true;
      } else {
        rimraf.sync(this.enableCUFilePath);
        this.enableCU = false;
      }
    } catch (e: unknown) {
      console.error('Error setting crash upload option', e);
    }
  }

  get enableCUFilePath() {
    return path.join(this.appService.appDataDirectory, 'CrashMemoryDump');
  }
}
