import { Component, Prop } from 'vue-property-decorator';
import TsxComponent from 'components/tsx-component';
import styles from './OverlayPlaceholder.m.less';

@Component({})
export default class OverlayPlaceholder extends TsxComponent<{}> {
  @Prop() title: string;

  render() {
    return (
      <div class={styles.container}>
        <div class={styles.outline}>
          <h1 class={styles.title}>{this.title}</h1>
        </div>
      </div>
    );
  }
}
