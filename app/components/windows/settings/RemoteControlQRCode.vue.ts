import * as remote from '@electron/remote';
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import qrcode from '@xkeshi/vue-qrcode';
import { Inject } from 'services/core/injector';
import { ITcpServerServiceApi } from 'services/api/tcp-server/index';
import { UserService } from 'services/user';
import Utils from '../../../services/utils';

interface IQRCodeData {
  addresses: string[];
  port: number;
  token: string;
  version: string;
}

@Component({
  components: { qrcode },
})
export default class RemoteControlQRCodeVue extends Vue {
  qrcodeIsVisible = false;
  detailsIsVisible = false;
  private updateNetworkInterval = 0;

  @Inject() private tcpServerService: ITcpServerServiceApi;
  @Inject() private userService: UserService;

  qrcodeData: IQRCodeData = {
    token: '',
    port: 0,
    addresses: [],
    version: '',
  };

  mounted() {
    this.updateQrcodeData();
    this.updateNetworkInterval = window.setInterval(() => this.updateQrcodeData(), 1000);
  }

  beforeDestroy() {
    clearInterval(this.updateNetworkInterval);
  }

  updateQrcodeData() {
    const settings = this.tcpServerService.state;
    const addresses = this.tcpServerService
      .getIPAddresses()
      .filter(address => !address.internal)
      .map(address => address.address);

    this.qrcodeData = {
      addresses,
      token: settings.token,
      port: settings.websockets.port,
      version: Utils.env.SLOBS_VERSION,
    };
  }

  get qrcodeVal(): string {
    if (!this.qrcodeIsVisible) return 'nothing to show yet';
    const encodedData = encodeURIComponent(
      `data=${encodeURIComponent(JSON.stringify(this.qrcodeData))}`,
    );
    return `https://streamlabs.page.link/?link=https://streamlabs.com/mobile-app?${encodedData}&apn=com.streamlabs.slobsrc&isi=1476615877&ibi=com.streamlabs.slobsrc&utm_source=slobs`;
  }

  showQrcode() {
    this.tcpServerService.enableWebsoketsRemoteConnections();
    this.qrcodeIsVisible = true;
  }

  generateToken() {
    this.tcpServerService.generateToken();
  }
}
