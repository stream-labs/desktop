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
}

@Component({
  components: { qrcode }
})
export default class RemoteControlQRCodeVue extends Vue {

  qrcodeIsVisible = false;
  detailsIsVisible = false;

  @Inject() private tcpServerService: ITcpServerServiceApi;
  @Inject() private hostsService: HostsService;

  get qrcodeData(): IQRCodeData {
    const settings = this.tcpServerService.state;
    const addresses = this.tcpServerService.getIPAddresses()
      .filter(address => !address.internal)
      .map(address => address.address);


    return {
      token: settings.token,
      port: settings.websockets.port,
      addresses
    };
  }

  get qrcodeVal(): string {
    if (!this.qrcodeIsVisible) return 'nothing to show yet';
    const encodedData = encodeURIComponent(JSON.stringify(this.qrcodeData));
    return `http://${this.hostsService.streamlabs}/api/v1/remotecontrol?data=${encodedData}`;
  }

  showQrcode() {
    this.tcpServerService.enableWebsoketsRemoteConnections();
    this.qrcodeIsVisible = true;
  }

  generateToken() {
    this.tcpServerService.generateToken();
  }
}
