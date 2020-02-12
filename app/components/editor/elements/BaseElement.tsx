import { Component, Watch } from 'vue-property-decorator';
import TsxComponent from 'components/tsx-component';
import { $t } from 'services/i18n';
import styles from './BaseElement.m.less';

@Component({})
export default class BaseElement extends TsxComponent {
  mins = { x: 0, y: 0 };
  interval: number;
  belowMins = false;
  height = 0;
  width = 0;

  mounted() {
    this.calcBelowMins();
    window.setInterval(() => {
      this.height = this.$el.getBoundingClientRect().height;
      this.width = this.$el.getBoundingClientRect().width;
    }, 500);
  }

  destroyed() {
    if (this.interval) clearInterval(this.interval);
  }

  get belowMinWarning() {
    return (
      <div class={styles.container}>
        <span class={styles.empty}>{$t('This element is too small to be displayed')}</span>
      </div>
    );
  }

  get element() {
    return <div />;
  }

  @Watch('height')
  @Watch('width')
  calcBelowMins() {
    if (!this.$el) return;
    // 20px added to account for size of the resize bars and padding
    this.belowMins = this.height + 20 < this.mins.y || this.width + 20 < this.mins.x;
  }

  renderElement() {
    return this.belowMins ? this.belowMinWarning : this.element;
  }
}
