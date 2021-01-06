import TsxComponent, { createProps } from '../tsx-component';
import { Component, Watch } from 'vue-property-decorator';

class Props {
  title = '';
}

@Component({ props: createProps(Props) })
export default class VueTestComponent extends TsxComponent<Props> {
  render() {
    return <div>{this.props.title}</div>;
  }
}
