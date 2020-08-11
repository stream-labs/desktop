import { Component, Watch } from 'vue-property-decorator';
import TsxComponent, { createProps } from 'components/tsx-component';
import { camelize } from 'humps';

class TranslateProps {
  message = '';
}

/**
 * Convert xml message from i18n dictionary to tsx component
 *
 * @example Usage with a Vue template
 * <pre><code>
 *
 *   <translate message="To continue please <my-link>click here </my-link>">
 *      <a slot="myLink" slot-scope="text" @click="onClickHandler" class="description-link">{{ text }}</a>
 *   </translate>
 *
 * </pre></code>
 */
@Component({ props: createProps(TranslateProps) })
export default class Translate extends TsxComponent<TranslateProps> {
  private xmlNodes: Node[] = [];

  created() {
    this.setup();
  }

  @Watch('props.message')
  setup() {
    this.xmlNodes = [];

    // use built-in xml parser to extract xml-nodes
    const xmlDoc = new DOMParser().parseFromString(
      `<root> ${this.props.message} </root>`,
      'text/xml',
    );
    const nodeList = xmlDoc.childNodes[0].childNodes;
    nodeList.forEach(node => this.xmlNodes.push(node));
  }

  render() {
    // convert each xml node to Vue node
    return <span>{this.xmlNodes.map(node => this.renderXmlNode(node))}</span>;
  }

  private renderXmlNode(node: Node) {
    // render simple text
    if (node.nodeName === '#text') {
      return node.textContent;
    }

    // render slots if found
    const slotName = camelize(node.nodeName);
    if (this.$scopedSlots[slotName]) {
      return this.$scopedSlots[slotName](node.textContent);
    } else {
      // render simple html tags like <a><b><i><strong>
      // attributes are not supported
      return this.$createElement(node.nodeName, node.textContent);
    }
  }
}
