import TsxComponent, { createProps } from '../tsx-component';

const reactBuild = require('components-react');
const ReactDOM = require('react-dom');
const React = require('react');

import { Component } from 'vue-property-decorator';
import { ICardProps } from './react-component-props';

class WrapperProps<TComponentProps> {
  name?: string = null;
  componentProps: TComponentProps = null;
}

@Component({ props: createProps(WrapperProps) })
export default class ReactComponent<TComponentProps> extends TsxComponent<
  WrapperProps<TComponentProps>
> {
  $refs: {
    container: HTMLDivElement;
  };

  mounted() {
    const className = this.props.name;
    const componentClass = reactBuild.components[className];
    // ReactDOM.render(
    //   React.createElement(componentClass, this.props.componentProps, null),
    //   this.$refs.container,
    // );
    ReactDOM.render(
      React.createElement(componentClass, { ...this.props.componentProps, key: className }, null),
      this.$refs.container,
    );
  }

  beforeDestroy() {
    ReactDOM.unmountComponentAtNode(this.$refs.container);
  }

  render() {
    return <div ref="container"></div>;
  }
}

@Component({ props: { name: { default: 'ReactHelloWorld', componentProps: null } } })
export class ReactHelloWorld extends ReactComponent<ICardProps> {}
