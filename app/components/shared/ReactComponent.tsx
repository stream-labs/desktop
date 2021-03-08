import TsxComponent, { createProps } from '../tsx-component';

const reactBuild = require('components-react');
const ReactDOM = require('react-dom');
const React = require('react');

import { Component } from 'vue-property-decorator';

class WrapperProps<TComponentProps> {
  name?: string = null;
  componentProps: TComponentProps = null;
  wrapperStyles?: Dictionary<string> = null;
}

/**
 * Wraps React component into a Vue component
 */
@Component({ props: createProps(WrapperProps) })
class ReactComponent<TComponentProps = {}> extends TsxComponent<WrapperProps<TComponentProps>> {
  $refs: {
    container: HTMLDivElement;
  };

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

  render() {
    return <div ref="container" style={this.props.wrapperStyles}></div>;
  }
}

@Component({
  props: {
    name: { default: 'NameFolder' },
    wrapperStyles: { default: () => ({ height: '100%' }) },
  },
})
export class NameFolder extends ReactComponent {}

@Component({
  props: {
    name: { default: 'NewsBanner' },
  },
})
export class NewsBanner extends ReactComponent {}
@Component({
  props: {
    name: { default: 'TitleBar' },
    componentProps: { default: () => ({ windowId: '' }) },
  },
})
export class TitleBar extends ReactComponent {}
@Component({
  props: {
    name: { default: 'Chat' },
    componentProps: { default: () => ({ restream: false }) },
    wrapperStyles: {
      default: () => ({ height: '100%', display: 'flex', flexDirection: 'column' }),
    },
  },
})
export class Chat extends ReactComponent {}
