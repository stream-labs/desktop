import Vue from 'vue';
import { StreamingService } from '../services/streaming';
import { PerformanceService } from '../services/performance';
import { UserService } from '../services/user';
import { StreamInfoService } from '../services/stream-info';
import { SettingsService } from '../services/settings';
import { Inject } from '../util/injector';
import { $t } from 'services/i18n';
import { Component } from 'vue-property-decorator';
import { CustomizationService } from 'services/customization';

@Component({})
export default class PerformanceMetrics extends Vue {
  @Inject() streamingService: StreamingService;
  @Inject() performanceService: PerformanceService;
  @Inject() userService: UserService;
  @Inject() streamInfoService: StreamInfoService;
  @Inject() settingsService: SettingsService;
  @Inject() customizationService: CustomizationService;

  visitorTooltip = $t('common.numberOfVisitors');
  commentTooltip = $t('common.numberOfComments');

  get isLoggedIn() {
    return this.userService.isLoggedIn();
  }

  get isStreaming() {
    return this.streamingService.isStreaming;
  }

  get cpuPercent() {
    return this.performanceService.state.CPU.toFixed(1);
  }

  get outputResolution() {
    return this.settingsService.state.Video.Output;
  }

  get frameRate() {
    if (!this.customizationService.pollingPerformanceStatistics) return '--';
    return this.performanceService.state.frameRate.toFixed(2);
  }

  get targetFrameRate() {
    const Video = this.settingsService.state.Video;

    // FPSType and related values (FPSCommon, FPSInt, ...) are not guaranteed to be synchronized.
    // So we detect the current type from given values.
    if (Video.FPSCommon) {
      return Video.FPSCommon;
    }

    if (Video.FPSInt) {
      return Video.FPSInt.toString(10);
    }

    if (typeof Video.FPSNum === 'number' && typeof Video.FPSDen === 'number') {
      return (Video.FPSNum / Video.FPSDen).toFixed(2);
    }

    // Return a harmless value because it's not enough to throw an error.
    return '--';
  }

  get droppedFrames() {
    if (!this.customizationService.pollingPerformanceStatistics) return '--';
    return this.performanceService.state.numberDroppedFrames;
  }

  get percentDropped() {
    if (!this.customizationService.pollingPerformanceStatistics) return '--';
    return (this.performanceService.state.percentageDroppedFrames || 0).toFixed(
      1
    );
  }

  get bandwidth() {
    if (!this.customizationService.pollingPerformanceStatistics) return '--';
    return this.performanceService.state.bandwidth.toFixed(0);
  }

  get viewerCount() {
    return this.streamInfoService.state.viewerCount.toString();
  }

  get commentCount() {
    return this.streamInfoService.state.commentCount.toString();
  }
}
