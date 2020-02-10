import cx from 'classnames';
import { Component } from 'vue-property-decorator';
import QRCode from '@xkeshi/vue-qrcode';
import TsxComponent from 'components/tsx-component';
import styles from './ShareStream.m.less';
import { $t } from 'services/i18n';
import { Inject } from 'services/core/injector';
import { FacebookService } from 'services/platforms/facebook';

interface IQRCodeData {
  addresses: string[];
  port: number;
  token: string;
  version: string;
}

@Component({})
export default class ShareStream extends TsxComponent {
  @Inject() facebookService: FacebookService;

  qrcodeIsVisible = false;

  qrcodeData: IQRCodeData = {
    token: '',
    port: 0,
    addresses: [],
    version: '',
  };

  mounted() {
    this.facebookService.sendPushNotif();
  }

  get qrcodeVal(): string {
    if (!this.qrcodeIsVisible) return 'nothing to show yet';
    const encodedData = encodeURIComponent(JSON.stringify(this.qrcodeData));
    return `https:/streamlabs.link/remotecontrol?data=${encodedData}`;
  }

  render() {
    return (
      <div>
        <div class={styles.ctaContainer}>
          <button class="button button--facebook">{$t('Share to Facebook')}</button>
          <button class="button button--twitter">{$t('Connect to Twitter')}</button>
          <QRCode
            value={this.qrcodeVal}
            options={{ size: 250 }}
            class={cx({ blur: !this.qrcodeIsVisible })}
          />
        </div>
        <button>{$t('Go Live')}</button>
      </div>
    );
  }
}
