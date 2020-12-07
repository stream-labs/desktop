import { Component, Watch } from 'vue-property-decorator';
import TsxComponent from 'components/tsx-component';
import { $t } from 'services/i18n';
import styles from './BaseElement.m.less';
import Scrollable from 'components/shared/Scrollable';

@Component({})
export default class BaseElement extends TsxComponent {
  mins = { x: 0, y: 0 };
  interval: number;
  belowMins = false;
  height = 0;
  width = 0;

  mounted() {
    this.setDimensions();
    window.setInterval(() => this.setDimensions(), 500);
  }

  setDimensions() {
    if (!this.$el?.getBoundingClientRect) return;
    this.height = this.$el.getBoundingClientRect().height;
    this.width = this.$el.getBoundingClientRect().width;
  }

  destroyed() {
    if (this.interval) clearInterval(this.interval);
  }

  get belowMinWarning() {
    return (
      <Scrollable className={styles.container}>
        <span class={styles.empty}>{$t('This element is too small to be displayed')}</span>
      </Scrollable>
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
    this.belowMins = this.height + 26 < this.mins.y || this.width + 26 < this.mins.x;
  }

  renderElement() {
    return this.belowMins ? this.belowMinWarning : this.element;
  }
}
