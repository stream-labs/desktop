import { Component } from 'vue-property-decorator';
import TsxComponent, { createProps } from 'components/tsx-component';
import { $t } from 'services/i18n';
import { Inject } from 'services';
import { MacPermissionsService, IPermissionsStatus } from 'services/mac-permissions';
import { Subscription } from 'rxjs';
import commonStyles from './Common.m.less';

class MacPermissionsProps {
  continue: () => void = () => {};
}

@Component({ props: createProps(MacPermissionsProps) })
export default class MacPermissions extends TsxComponent<MacPermissionsProps> {
  @Inject() macPermissionsService: MacPermissionsService;

  permissions: IPermissionsStatus = { micPermission: false, webcamPermission: false };

  permissionSub: Subscription;

  created() {
    this.permissions = this.macPermissionsService.getPermissionsStatus();
    this.permissionSub = this.macPermissionsService.permissionsUpdated.subscribe(perms => {
      this.permissions = perms;
    });
    this.macPermissionsService.requestPermissions();
  }

  destroyed() {
    this.permissionSub.unsubscribe();
  }

  render() {
    return (
      <div style={{ width: '650px', margin: '100px auto' }}>
        <h1 class={commonStyles.titleContainer}>{$t('Grant Permissions')}</h1>
        <div>
          {$t(
            'Streamlabs needs additional permissions. Grant permissions in the pop-up dialogs to continue.',
          )}
        </div>
        <div style={{ fontSize: '16px', marginTop: '16px' }}>
          <div>
            {$t('Microphone')}
            {this.permissions.micPermission && (
              <i class="fa fa-check" style={{ marginLeft: '8px', color: '#31C3A2' }} />
            )}
          </div>
          <div>
            {$t('Webcam')}
            {this.permissions.webcamPermission && (
              <i class="fa fa-check" style={{ marginLeft: '8px', color: '#31C3A2' }} />
            )}
          </div>
        </div>
        <button
          class="button button--action"
          style={{ float: 'right' }}
          onClick={() => this.props.continue()}
          disabled={!this.permissions.webcamPermission || !this.permissions.micPermission}
        >
          {$t('Continue')}
        </button>
      </div>
    );
  }
}
