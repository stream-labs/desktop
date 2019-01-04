import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import RemoteControlQRCode from 'components/RemoteControlQRCode.vue';

@Component({
  components: { RemoteControlQRCode },
})
export default class RemoteControlSettings extends Vue {}
