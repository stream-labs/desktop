import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import Hotkey from './shared/Hotkey.vue';
import { IHotkey } from 'services/hotkeys';
import cx from 'classnames';

@Component({
  props: {
    title: String,
    hotkeys: Array,
  },
})
export default class HotkeyGroup extends Vue {
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
            {this.hotkeys.map((hotkey: IHotkey) => (
              <div key={hotkey.resourceId}>
                <Hotkey hotkey={hotkey} />
              </div>
            ))}
          </div>
        </transition>
      </div>
    );
  }
}
