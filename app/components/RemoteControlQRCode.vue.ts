import { remote } from 'electron';
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import qrcode from '@xkeshi/vue-qrcode';
import { Inject } from '../util/injector';
import { ITcpServerServiceApi } from 'services/tcp-server';
import { HostsService } from 'services/hosts';

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
  @Inject() private hostsService: HostsService;

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
      token: settings.token,
      port: settings.websockets.port,
      addresses,
      version: remote.process.env.SLOBS_VERSION,
    };
  }

  get qrcodeVal(): string {
    if (!this.qrcodeIsVisible) return 'nothing to show yet';
    const encodedData = encodeURIComponent(JSON.stringify(this.qrcodeData));
    return `https://${this.hostsService.streamlabs}/remotecontrol?data=${encodedData}`;
  }

  showQrcode() {
    this.tcpServerService.enableWebsoketsRemoteConnections();
    this.qrcodeIsVisible = true;
  }

  generateToken() {
    this.tcpServerService.generateToken();
  }
}
