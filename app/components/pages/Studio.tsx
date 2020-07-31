import TsxComponent from 'components/tsx-component';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { LayoutService, ELayoutElement, IVec2Array } from 'services/layout';

@Component({})
export default class Studio extends TsxComponent {
  @Inject() private layoutService: LayoutService;

  totalWidthHandler(slots: IVec2Array, isColumns: boolean) {
    if (isColumns) {
      this.$emit('totalWidth', this.layoutService.views.calculateColumnTotal(slots));
    } else {
      this.$emit('totalWidth', this.layoutService.views.calculateMinimum('x', slots));
    }
  }

  render() {
    const Layout = this.layoutService.views.component;
    return (
      <Layout
        class="editor-page"
        onTotalWidth={(slots: IVec2Array, isColumns: boolean) =>
          this.totalWidthHandler(slots, isColumns)
        }
      >
        {this.layoutService.views.elementsToRender.map((widget: ELayoutElement) => {
          const Element = this.layoutService.views.elementComponent(widget);
          return (
            <Element slot={this.layoutService.views.currentTab.slottedElements[widget].slot} />
          );
        })}
      </Layout>
    );
  }
}
