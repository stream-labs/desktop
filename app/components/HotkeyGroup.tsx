import { Component, Prop } from 'vue-property-decorator';
import Hotkey from './shared/Hotkey.vue';
import { IHotkey } from 'services/hotkeys';
import cx from 'classnames';
import TsxComponent from './tsx-component';

@Component({
  props: {
    title: String,
    hotkeys: Array,
  },
})
export default class HotkeyGroup extends TsxComponent<{ hotkeys: IHotkey[]; title?: string }> {
  @Prop() hotkeys: IHotkey[];
  @Prop() title: string;
  collapsed = false;

  header(h: Function) {
    return this.title ? (
      <h2
        class="section-title section-title--dropdown"
        onClick={() => (this.collapsed = !this.collapsed)}
      >
        {this.collapsed ? <i class="fa fa-plus section-title__icon" /> : null}
        {!this.collapsed ? <i class="fa fa-minus section-title__icon" /> : null}
        {this.title}
      </h2>
    ) : null;
  }

  render(h: Function) {
    return (
      <div class="section">
        {this.header(h)}
        <transition name="expand">
          <div
            style={this.collapsed ? { display: 'none' } : null}
            class={cx({ 'section-content--opened': !!this.title }, 'section-content')}
          >
            {this.hotkeys.map(hotkey => (
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
