import TsxComponent, { createProps } from '../tsx-component';
import { Component, Watch } from 'vue-property-decorator';
import uuid from 'uuid';

interface IComponentIfo {
  id: string;
  componentClass: any;
  props: any;
}

@Component({})
export default class VueRenderAreaForReact extends TsxComponent {
  private components: Record<string, IComponentIfo>;

  createComponent(componentClass: Function, props: any): string {
    const id = uuid();
    this.$set(this.components, id, { id, componentClass, props });
    return id;
  }
  destroyComponent(id: string) {
    this.$delete(this.components, id);
  }

  mounted() {
    window['vueRenderAreaForReact'] = this;
  }

  render(createElement: Function) {
    return (
      <div class="vue-render-area">
        {Object.keys(VueRenderAreaForReact).map(id => (
          <div key={id}>{this.renderComponent(createElement, id)}</div>
        ))}
      </div>
    );
  }

  renderComponent(createElement: Function, id: string) {
    const compInfo = this.components[id];
    const ComponentClass = compInfo.componentClass;
    const props = compInfo.props;
    return createElement(ComponentClass, { props, key: id });
  }
}
