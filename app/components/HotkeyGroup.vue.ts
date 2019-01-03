import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import Hotkey from './shared/Hotkey.vue';

@Component({
  props: {
    title: String,
    hotkeys: Array,
  },
  components: { Hotkey },
})
export default class HotkeyGroup extends Vue {
  collapsed = false;
}
