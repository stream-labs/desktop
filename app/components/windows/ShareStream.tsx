import cx from 'classnames';
import { shell, remote, clipboard } from 'electron';
import { Component } from 'vue-property-decorator';
import sample from 'lodash/sample';
import QRCode from '@xkeshi/vue-qrcode';
import TsxComponent from 'components/tsx-component';
import styles from './ShareStream.m.less';
import { $t } from 'services/i18n';
import { Inject } from 'services/core/injector';
import { FacebookService } from 'services/platforms/facebook';
import { UserService } from 'services/user';
import { TwitterService } from 'services/integrations/twitter';
import { ITcpServerServiceApi } from 'services/api/tcp-server/index';

interface IQRCodeData {
  addresses: string[];
  port: number;
  token: string;
  version: string;
  user: string;
}

const testimonialData = () => [
  {
    quote: $t('I got my first group of viewers by messaging ALL my friends and family'),
    author: 'Islandgrown',
    img: require('../../../media/images/testimonials/islandgrown.png'),
  },
];

@Component({})
export default class ShareStream extends TsxComponent<{ sharePageUrl: string }> {
  @Inject() facebookService: FacebookService;
  @Inject() userService: UserService;
  @Inject() twitterService: TwitterService;
  @Inject() private tcpServerService: ITcpServerServiceApi;

  sharedToFacebook = false;
  qrcodeIsVisible = false;
  updateNetworkInterval: number;

  qrcodeData: IQRCodeData = {
    token: '',
    port: 0,
    addresses: [],
    version: '',
    user: this.userService.widgetToken,
  };

  mounted() {
    this.facebookService.sendPushNotif();
    this.updateQrcodeData();
    this.updateNetworkInterval = window.setInterval(() => this.updateQrcodeData(), 1000);
    this.qrcodeIsVisible = this.tcpServerService.websocketRemoteConnectionEnabled;
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
      version: remote.process.env.SLOBS_VERSION,
      user: this.userService.widgetToken,
    };
  }

  linkTwitter() {
    this.twitterService.openLinkTwitterDialog();
  }

  get linkedToTwitter() {
    return this.twitterService.state.linked;
  }

  get qrcodeVal(): string {
    if (!this.qrcodeIsVisible) return 'nothing to show yet';
    const encodedData = encodeURIComponent(JSON.stringify(this.qrcodeData));
    return `https:/streamlabs.link/remotecontrol?data=${encodedData}`;
  }

  shareToFacebook() {
    const base = 'https://www.facebook.com/dialog/share?';
    const id = '806726706158427';
    shell.openExternal(`${base}app_id=${id}&href=${this.props.sharePageUrl}`);
    this.sharedToFacebook = true;
  }

  showQrcode() {
    this.tcpServerService.enableWebsoketsRemoteConnections();
    this.qrcodeIsVisible = true;
  }

  clickQRCode() {
    if (this.qrcodeIsVisible) {
      this.handleCopy(this.qrcodeVal);
    } else {
      this.showQrcode();
    }
  }

  async handleCopy(href: string) {
    try {
      await clipboard.writeText(href);
      this.$toasted.show($t('URL Copied'), {
        duration: 1000,
        position: 'bottom-center',
        className: 'toast-success',
      });
    } catch (e) {
      this.$toasted.show($t('Failed to copy URL'), {
        duration: 1000,
        position: 'bottom-center',
        className: 'toast-alert',
      });
    }
  }

  get quoteArea() {
    const quote = sample(testimonialData());
    return (
      <div class={styles.quoteContainer}>
        <QuoteMarks />
        <span class={styles.quote}>{quote.quote}</span>
        <span class={styles.author}>{quote.author}</span>
        <img
          class={styles.quoteBg}
          src={require('../../../media/images/testimonials/background.png')}
        />
        <img class={styles.authorImg} src={quote.img} />
      </div>
    );
  }

  get cta() {
    return (
      <div class={styles.ctaContainer}>
        <div class={styles.shareButtons}>
          <button class="button button--facebook" onClick={() => this.shareToFacebook()}>
            {this.sharedToFacebook ? $t('Shared') : $t('Share to Facebook')}
          </button>
          <button class="button button--twitter" onClick={() => this.linkTwitter()}>
            {this.linkedToTwitter ? $t('Connected') : $t('Connect to Twitter')}
          </button>
        </div>
        <div style="width: 150px">
          <span class={styles.deckCta}>
            {$t('Get the free Streamlabs Deck App and grow your viewership')}
          </span>
          <img class={styles.deckArrow} src={require('../../../media/images/chalk-arrow.png')} />
        </div>
        <div class={styles.fader} onClick={() => this.clickQRCode()}>
          <QRCode
            value={this.qrcodeVal}
            options={{ size: 100 }}
            class={cx({ [styles.blur]: !this.qrcodeIsVisible })}
          />
          {!this.qrcodeIsVisible && <span>{$t('Click to show')}</span>}
        </div>
      </div>
    );
  }

  render() {
    return (
      <div class={styles.container}>
        {this.quoteArea}
        {this.cta}
        <button
          class={cx(
            styles.goLiveButton,
            'button',
            this.sharedToFacebook && this.linkedToTwitter ? 'button--action' : 'button--default',
          )}
        >
          {$t('Go Live')}
        </button>
      </div>
    );
  }
}

@Component({})
class QuoteMarks extends TsxComponent {
  render() {
    return (
      <svg
        width="54"
        height="48"
        viewBox="0 0 54 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0.0114811 34.4711C0.0114811 41.5706 5.76645 47.3256 12.8659 47.3256C19.9654 47.3256 25.7204 41.5706 25.7204 34.4711C25.7204 27.3715 19.9654 21.6167 12.8659 21.6167C11.4068 21.6167 10.0102 21.871 8.70271 22.3193C11.5955 5.72835 24.5332 -4.97091 12.54 3.83479C-0.758696 13.5993 -0.00276173 34.0782 0.0121189 34.4535C0.0121189 34.4594 0.0114811 34.4646 0.0114811 34.4711Z"
          fill="#09161D"
        />
        <path
          d="M28.2908 34.4711C28.2908 41.5706 34.0458 47.3256 41.1453 47.3256C48.2448 47.3256 53.9998 41.5706 53.9998 34.4711C53.9998 27.3715 48.2447 21.6167 41.1452 21.6167C39.686 21.6167 38.2895 21.871 36.982 22.3193C39.8748 5.72835 52.8125 -4.97091 40.8193 3.83479C27.5206 13.5993 28.2765 34.0782 28.2914 34.4535C28.2914 34.4594 28.2908 34.4646 28.2908 34.4711Z"
          fill="#09161D"
        />
      </svg>
    );
  }
}
