import TsxComponent, { createProps } from '../tsx-component';
import isEqual from 'lodash/isEqual';

const reactBuild = require('components-react');
const ReactDOM = require('react-dom');
const React = require('react');

import { Component, Prop, Watch } from 'vue-property-decorator';

class WrapperProps<TComponentProps> {
  name?: string = null;
  componentProps?: TComponentProps = null;
  wrapperStyles?: Dictionary<string> = null;
  // Hack to allow custom layout components to size properly
  mins?: IVec2 = null;
}

/**
 * Wraps React component into a Vue component
 */
@Component({ props: createProps(WrapperProps) })
export default class ReactComponent<TComponentProps = {}> extends TsxComponent<
  WrapperProps<TComponentProps>
> {
  $refs: {
    container: HTMLDivElement;
  };

  @Prop() mins: IVec2;

  mounted() {
    const className = this.props.name;
    const componentClass = reactBuild.components[className];
    ReactDOM.render(
      React.createElement(componentClass, { ...this.props.componentProps, key: className }, null),
      this.$refs.container,
    );
  }

  beforeDestroy() {
    ReactDOM.unmountComponentAtNode(this.$refs.container);
  }

  @Watch('componentProps', { deep: true })
  refreshReactComponent(componentProps: TComponentProps, oldComponentProps: TComponentProps) {
    const serializedProps = JSON.parse(JSON.stringify(componentProps));
    const serializedOldProps = JSON.parse(JSON.stringify(oldComponentProps));
    if (isEqual(serializedProps, serializedOldProps)) return;
    ReactDOM.unmountComponentAtNode(this.$refs.container);
    const className = this.props.name;
    const componentClass = reactBuild.components[className];
    ReactDOM.render(
      React.createElement(componentClass, { ...this.props.componentProps, key: className }, null),
      this.$refs.container,
    );
  }

  render() {
    return <div class="react" ref="container" style={this.props.wrapperStyles}></div>;
  }
}
