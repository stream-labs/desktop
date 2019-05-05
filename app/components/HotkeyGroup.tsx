import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import Hotkey, { IKeyedBinding } from './shared/Hotkey.vue';
import { IHotkey } from 'services/hotkeys';
import cx from 'classnames';
import { Subject } from 'rxjs';

@Component({})
export default class HotkeyGroup extends Vue {
  @Prop() hotkeys: IHotkey[];
  @Prop() title: string;
  @Prop() mouseKeyPressed: Subject<IKeyedBinding>;
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
    console.log('Rendering hot key group: ', this.title, this.mouseKeyPressed);
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
                <Hotkey hotkey={hotkey} mouseKeyPressed={this.mouseKeyPressed} />
              </div>
            ))}
          </div>
        </transition>
      </div>
    );
  }
}
