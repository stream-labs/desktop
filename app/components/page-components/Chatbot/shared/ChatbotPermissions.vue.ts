import { Component, Prop, Watch } from 'vue-property-decorator';
import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { filter, map, cloneDeep } from 'lodash';
import { IPermissionCheckboxes } from 'services/chatbot';

@Component({})
export default class ChatbotAliases extends ChatbotBase {
  @Prop()
  value: number;

  paneMenuOpen: boolean = false;
  text: string = 'Everyone';

  checkboxes: IPermissionCheckboxes = {
    regular: { checked: true, string: 'Regulars' },
    subscriber: { checked: true, string: 'Subscribers' },
    moderator: { checked: true, string: 'Moderators' },
    streamer: { checked: true, string: 'Streamer' },
  };

  previousCheckBoxes: IPermissionCheckboxes = {};

  mounted() {
    this.updateChecks();
    console.log(this.value);
  }

  @Watch('value')
  valueWatcher(newValue: number) {
    this.updateChecks();
  }

  @Watch('checkboxes', { deep: true })
  checkBoxWatcher(newValue: IPermissionCheckboxes) {
    let value = 0;

    const itemsChecked = filter(newValue, type => type.checked).length;

    if (itemsChecked === 0) {
      this.$nextTick(() => {
        this.checkboxes.regular.checked = this.previousCheckBoxes.regular.checked;
        this.checkboxes.moderator.checked = this.previousCheckBoxes.moderator.checked;
        this.checkboxes.subscriber.checked = this.previousCheckBoxes.subscriber.checked;
        this.checkboxes.streamer.checked = this.previousCheckBoxes.streamer.checked;
      });

      return;
    }

    this.previousCheckBoxes = cloneDeep(newValue);

    value += newValue.subscriber.checked ? 2 : 0;
    value += newValue.regular.checked ? 4 : 0;
    value += newValue.moderator.checked ? 32 : 0;
    value += newValue.streamer.checked ? 64 : 0;

    if (value === 102) {
      value = 1; // It's for everyone
      this.text = 'Everyone';
    } else {
      const checked = filter(this.checkboxes, type => {
        return type.checked;
      });

      this.text = map(checked, type => type.string).join(', ');
    }

    this.$emit('input', value);
  }

  updateChecks() {
    if (this.value === 1) {
      this.checkboxes.regular.checked = true;
      this.checkboxes.subscriber.checked = true;
      this.checkboxes.moderator.checked = true;
      this.checkboxes.streamer.checked = true;
      this.text = 'Everyone';
    } else {
      this.checkboxes.subscriber.checked = (this.value & 2) === 2;
      this.checkboxes.regular.checked = (this.value & 4) === 4;
      this.checkboxes.moderator.checked = (this.value & 32) === 32;
      this.checkboxes.streamer.checked = (this.value & 64) === 64;

      const checked = filter(this.checkboxes, type => {
        return type.checked;
      });

      this.text = map(checked, type => type.string).join(', ');
    }
  }

  toggle(key: string, value: boolean) {
    this.checkboxes[key].checked = !value;
  }

  documentClick(e: MouseEvent) {
    const el = this.$refs.paneMenu;
    const target = e.target;

    // @ts-ignore
    if (el !== target && !el.contains(target)) {
      this.paneMenuOpen = false;
    }
  }

  created() {
    document.addEventListener('click', this.documentClick);
    window.addEventListener('resize', this.onResize);
  }

  destroyed() {
    document.removeEventListener('click', this.documentClick);
    window.removeEventListener('resize', this.onResize);
  }

  toggleDropDown() {
    this.paneMenuOpen = !this.paneMenuOpen;
    this.onResize();
  }

  onResize(event?: UIEvent) {
    // @ts-ignore
    const menu = this.$refs.menu as Vue;
    const paneMenu = this.$refs.paneMenu as Element;

    const rect = paneMenu.getBoundingClientRect();
    menu.style.width = `${rect.width}px`;
  }
}
