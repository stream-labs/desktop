import React, { CSSProperties } from 'react';
import { ObsSettingsSection } from './ObsSettings';
import { $t } from '../../../services/i18n';
import QRCode from 'qrcode.react';
import { mutation } from '../../store';
import { useModule } from '../../hooks/useModule';
import { Services } from '../../service-provider';
import Form from '../../shared/inputs/Form';
import { TextInput } from '../../shared/inputs';
import { Button, Col, Row, Space } from 'antd';
import Utils from '../../../services/utils';

const QRCODE_SIZE = 300;

class RemoteControlModule {
  state = {
    qrcodeIsVisible: false,
    detailsIsVisible: false,
    qrCodeData: {
      addresses: [] as string[],
      port: 0,
      token: '',
      version: '',
    },
  };

  private updateNetworkInterval: number;

  init() {
    this.refreshQrcodeData();
    this.updateNetworkInterval = window.setInterval(() => this.refreshQrcodeData(), 1000);
  }

  destroy() {
    clearInterval(this.updateNetworkInterval);
  }

  get qrCodeValue() {
    if (!this.state.qrcodeIsVisible) return '';
    const encodedUser = encodeURIComponent(`user=${Services.UserService.widgetToken}`);
    const encodedData = encodeURIComponent(
      `&data=${encodeURIComponent(JSON.stringify(this.state.qrCodeData))}`,
    );
    return `https://streamlabs.page.link/?link=https://streamlabs.com/mobile-app?${encodedUser}${encodedData}&apn=com.streamlabs.slobsrc&isi=1476615877&ibi=com.streamlabs.slobsrc&utm_source=slobs`;
  }

  private get TcpServerService() {
    return Services.TcpServerService;
  }

  @mutation()
  showQrCode() {
    this.TcpServerService.enableWebsoketsRemoteConnections();
    this.state.qrcodeIsVisible = true;
  }

  @mutation()
  showDetails() {
    this.state.detailsIsVisible = true;
  }

  generateToken() {
    this.TcpServerService.actions.generateToken();
  }

  @mutation()
  private refreshQrcodeData() {
    const settings = this.TcpServerService.state;
    const addresses = this.TcpServerService.getIPAddresses()
      .filter(address => !address.internal)
      .map(address => address.address);

    this.state.qrCodeData = {
      addresses,
      token: settings.token,
      port: settings.websockets.port,
      version: Utils.env.SLOBS_VERSION,
    };
  }
}

export function RemoteControlSettings() {
  const {
    qrcodeIsVisible,
    detailsIsVisible,
    qrCodeData,
    qrCodeValue,
    showQrCode,
    showDetails,
    generateToken,
  } = useModule(RemoteControlModule).select();

  const colStyle: CSSProperties = {
    width: `${QRCODE_SIZE}px`,
    height: `${QRCODE_SIZE}px`,
    backgroundColor: 'white',
    fontSize: '20px',
    display: 'flex',
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: '16px',
  };

  return (
    <ObsSettingsSection>
      <div>
        {$t('You can now control Streamlabs OBS from your phone.')} <br />
        {$t('To begin, scan this QR code with your phone.')}
        <br />
        {$t(
          'This feature will only work with the most recent version of the Streamlabs mobile app.',
        )}
        <br />
        <br />
      </div>

      <Row justify="space-around" align="middle">
        <Col style={colStyle}>
          {qrcodeIsVisible && <QRCode value={qrCodeValue} size={QRCODE_SIZE} />}
          {!qrcodeIsVisible && (
            <a style={{ backgroundColor: 'black' }} onClick={showQrCode}>
              {$t("Don't show this code on stream. Click to reveal")}
            </a>
          )}
        </Col>
      </Row>

      {qrcodeIsVisible && (
        <div style={{ marginBottom: '16px' }}>
          <a onClick={showDetails}>{$t('Show details')}</a>
        </div>
      )}

      {qrcodeIsVisible && detailsIsVisible && (
        <Form>
          {/* TODO: use password input */}
          <TextInput
            label={$t('API token')}
            readOnly
            value={qrCodeData.token}
            addonAfter={<Button onClick={generateToken}>{$t('Generate new')}</Button>}
          />
          <TextInput label={$t('Port')} readOnly value={qrCodeData.port.toString(10)} />
          <TextInput label={$t('IP addresses')} readOnly value={qrCodeData.addresses.join(', ')} />
        </Form>
      )}
    </ObsSettingsSection>
  );
}

RemoteControlSettings.page = 'Remote Control';
