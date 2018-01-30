import Vue from 'vue';
import electron from 'electron';
import { Component } from 'vue-property-decorator';
import { CacheUploaderService } from 'services/cache-uploader';
import { Inject } from 'util/injector';
import BoolInput from 'components/shared/forms/BoolInput.vue';
import { CustomizationService } from 'services/customization';
import { IFormInput } from 'components/shared/forms/Input';
import { StreamlabelsService } from 'services/streamlabels';
import { OnboardingService } from 'services/onboarding';
import { WindowsService } from 'services/windows';
import { UserService } from 'services/user';
import { StreamingService } from 'services/streaming';

@Component({
  components: { BoolInput }
})
export default class ExtraSettings extends Vue {
  @Inject() cacheUploaderService: CacheUploaderService;
  @Inject() customizationService: CustomizationService;
  @Inject() streamlabelsService: StreamlabelsService;
  @Inject() onboardingService: OnboardingService;
  @Inject() windowsService: WindowsService;
  @Inject() userService: UserService;
  @Inject() streamingService: StreamingService;

  cacheUploading = false;

  get streamInfoUpdateModel(): IFormInput<boolean> {
    return {
      name: 'stream_info_udpate',
      description: 'Confirm stream title and game before going live',
      value: this.customizationService.state.updateStreamInfoOnLive
    };
  }

  setStreamInfoUpdate(model: IFormInput<boolean>) {
    this.customizationService.setUpdateStreamInfoOnLive(model.value);
  }

  showCacheDir() {
    electron.remote.shell.showItemInFolder(
      electron.remote.app.getPath('userData')
    );
  }

  deleteCacheDir() {
    if (
      confirm(
        'WARNING! You will lose all scenes, sources, and settings. This cannot be undone!'
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
        `Your cache directory has been successfully uploaded.  The file name ${file} has been copied to your clipboard.  Please paste it into discord and tag a developer.`
      );
      this.cacheUploading = false;
    });
  }

  restartStreamlabelsSession() {
    this.streamlabelsService.restartSession().then(result => {
      if (result) alert('Streamlabels session has been succesfully restarted!');
    });
  }

  runAutoOptimizer() {
    this.onboardingService.start({ isOptimize: true });
    this.windowsService.closeChildWindow();
  }

  get isTwitch() {
    return (
      this.userService.isLoggedIn() &&
      this.userService.platform.type === 'twitch'
    );
  }

  get isRecordingOrStreaming() {
    return (
      this.streamingService.isStreaming || this.streamingService.isRecording
    );
  }
}
