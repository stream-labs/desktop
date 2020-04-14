import { Component } from 'vue-property-decorator';
import Hotkey from 'components/shared/Hotkey.vue';
import { IHotkey } from 'services/hotkeys';
import cx from 'classnames';
import TsxComponent, { createProps } from 'components/tsx-component';

class HotkeyGroupProps {
  hotkeys: IHotkey[] = [];
  title: string = null;
}

@Component({ props: createProps(HotkeyGroupProps) })
export default class HotkeyGroup extends TsxComponent<HotkeyGroupProps> {
  collapsed = false;

  get header() {
    return this.props.title ? (
      <h2
        class="section-title section-title--dropdown"
        onClick={() => (this.collapsed = !this.collapsed)}
      >
        {this.collapsed ? <i class="fa fa-plus section-title__icon" /> : null}
        {!this.collapsed ? <i class="fa fa-minus section-title__icon" /> : null}
        {this.props.title}
      </h2>
    ) : null;
  }

  render() {
    return (
      <div class="section">
        {this.header}
        <transition name="expand">
          <div
            style={this.collapsed ? { display: 'none' } : null}
            class={cx({ 'section-content--opened': !!this.props.title }, 'section-content')}
          >
            {this.props.hotkeys.map(hotkey => (
              <div key={hotkey.actionName + hotkey.sceneId + hotkey.sceneItemId + hotkey.sourceId}>
                <Hotkey hotkey={hotkey} />
              </div>
            ))}
          </div>
        </transition>
      </div>
    );
  }
}
