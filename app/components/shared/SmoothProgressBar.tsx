import { Component, Watch } from 'vue-property-decorator';
import TsxComponent, { createProps } from 'components/tsx-component';
import { ProgressBar } from 'streamlabs-beaker';
import styles from './SmoothProgressBar.m.less';

class SmoothProgressBarProps {
  value: number = 0;
  timeLimit: number = 0;
}

/**
 * A progress bar that infinitely moves until it reach the timeLimit
 * It also accepts changing the progress value via props
 * Can be useful to indicate any limited by time progress
 */
@Component({ components: { ProgressBar }, props: createProps(SmoothProgressBarProps) })
export default class SmoothProgressBar extends TsxComponent<SmoothProgressBarProps> {
  private localProgress = 0;
  private autoincrementInterval = 0;

  @Watch('value')
  onProgressChange() {
    this.localProgress = this.props.value;
  }

  created() {
    const incrementPeriod = 300;
    const incrementVal = incrementPeriod / this.props.timeLimit;
    this.autoincrementInterval = window.setInterval(() => {
      this.localProgress = Math.min(1, this.localProgress + incrementVal);
    }, incrementPeriod);
  }

  destroyed() {
    clearInterval(this.autoincrementInterval);
  }

  render() {
    return (
      <ProgressBar
        class={styles['smooth-progress-bar']}
        progressComplete={this.localProgress * 100}
      />
    );
  }
}
