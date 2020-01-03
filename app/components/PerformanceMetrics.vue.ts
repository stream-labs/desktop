import Vue from 'vue';
import { StreamingService } from '../services/streaming';
import { PerformanceService } from '../services/performance';
import { Inject } from '../services/core/injector';
import { Component, Prop } from 'vue-property-decorator';
import { CustomizationService } from 'app-services';
import TsxComponent from 'components/tsx-component';
import cloneDeep from 'lodash/cloneDeep';
import { $t } from 'services/i18n';

type TPerformanceMetricsMode = 'full' | 'limited';

@Component({})
export default class PerformanceMetrics extends TsxComponent<{
  mode: TPerformanceMetricsMode;
}> {
  @Prop() mode: TPerformanceMetricsMode;
  @Inject() streamingService: StreamingService;
  @Inject() performanceService: PerformanceService;
  @Inject() customizationService: CustomizationService;

  get pinnedStats() {
    return this.customizationService.state.pinnedStatistics;
  }

  get cpuPercent() {
    return this.performanceService.state.CPU.toFixed(1);
  }

  get frameRate() {
    return this.performanceService.state.frameRate.toFixed(2);
  }

  get droppedFrames() {
    return this.performanceService.state.numberDroppedFrames;
  }

  get percentDropped() {
    return (this.performanceService.state.percentageDroppedFrames || 0).toFixed(1);
  }

  get bandwidth() {
    return this.performanceService.state.bandwidth.toFixed(0);
  }

  get showCPU() {
    return this.mode === 'full' || this.customizationService.state.pinnedStatistics.cpu;
  }

  get showFPS() {
    return this.mode === 'full' || this.customizationService.state.pinnedStatistics.fps;
  }

  get showDroppedFrames() {
    return this.mode === 'full' || this.customizationService.state.pinnedStatistics.droppedFrames;
  }

  get showBandwidth() {
    return this.mode === 'full' || this.customizationService.state.pinnedStatistics.bandwidth;
  }

  pinTooltip(stat: string) {
    return this.mode === 'full'
      ? $t('Click to add %{stat} info to your footer', { stat: $t(`${stat}`) })
      : '';
  }

  updatePinnedStats(key: string, value: boolean) {
    if (this.mode === 'limited') return;
    const newStats = cloneDeep(this.pinnedStats);
    newStats[key] = value;
    this.customizationService.setPinnedStatistics(newStats);
  }

  classForStat(stat: string) {
    if (this.mode === 'limited') return '';
    return `clickable ${this.pinnedStats[stat] ? 'active' : ''}`;
  }
}
