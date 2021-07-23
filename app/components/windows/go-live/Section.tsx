import TsxComponent, { createProps } from 'components/tsx-component';
import { Component } from 'vue-property-decorator';
import styles from './GoLive.m.less';

class SectionProps {
  title?: string = '';
  isSimpleMode?: boolean = false;
}

/**
 * renders a section wrapper
 */
@Component({ props: createProps(SectionProps) })
export default class Section extends TsxComponent<SectionProps> {
  private render() {
    const slot = this.$slots.default;
    const title = this.props.title;

    // render header and section wrapper in advanced mode
    if (!this.props.isSimpleMode) {
      return (
        <div class={{ [styles.section]: true, [styles.sectionWithoutTitle]: !title }}>
          {title && <h2>{title}</h2>}
          <div>{slot}</div>
        </div>
      );
    }

    // render content only in simple mode
    return <div>{slot}</div>;
  }
}
