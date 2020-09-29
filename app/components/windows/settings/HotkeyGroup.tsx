import { Component } from 'vue-property-decorator';
import Hotkey from 'components/shared/Hotkey.vue';
import { IHotkey } from 'services/hotkeys';
import cx from 'classnames';
import TsxComponent, { createProps } from 'components/tsx-component';

class HotkeyGroupProps {
  hotkeys: IHotkey[] = [];
  title: string = null;
  isSearch: boolean = false;
}

@Component({ props: createProps(HotkeyGroupProps) })
export default class HotkeyGroup extends TsxComponent<HotkeyGroupProps> {
  collapsed = true;

  mounted() {
    console.log(this.props);
  }

  get header() {
    return this.props.title ? (
      <h2
        class="section-title section-title--dropdown"
        onClick={() => (this.collapsed = !this.collapsed)}
      >
        {this.isCollapsible && this.collapsed ? <i class="fa fa-plus section-title__icon" /> : null}
        {this.isCollapsible && !this.collapsed ? (
          <i class="fa fa-minus section-title__icon" />
        ) : null}
        {this.props.title}
      </h2>
    ) : null;
  }

  get isCollapsible() {
    return this.props.title && !this.props.isSearch;
  }

  render() {
    return (
      <div class="section">
        {this.header}
        <transition name="expand">
          {(!this.isCollapsible || !this.collapsed) && (
            <div
              // style={this.collapsed ? { display: 'none' } : null}
              class={cx({ 'section-content--opened': !!this.props.title }, 'section-content')}
            >
              {this.props.hotkeys.map(hotkey => (
                <div
                  key={hotkey.actionName + hotkey.sceneId + hotkey.sceneItemId + hotkey.sourceId}
                >
                  <Hotkey hotkey={hotkey} />
                </div>
              ))}
            </div>
          )}
        </transition>
      </div>
    );
  }
}
