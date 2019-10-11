import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import cx from 'classnames';
import GenericForm from 'components/obs/inputs/GenericForm';
import { $t } from 'services/i18n';
import { TObsFormData } from 'components/obs/inputs/ObsInput';
import { ISettingsSubCategory, SettingsService } from 'services/settings';
import TsxComponent from 'components/tsx-component';
import { StreamSettingsService } from '../../../services/settings/streaming';
import GenericFormGroups from '../../obs/inputs/GenericFormGroups.vue';
import { UserService } from 'services/user';
import styles from './StreamSettings.m.less';

@Component({ components: { GenericFormGroups } })
export default class StreamSettings extends TsxComponent {
  @Inject() private streamSettingsService: StreamSettingsService;
  @Inject() private userService: UserService;
  private obsSettings = this.streamSettingsService.getObsStreamSettings();

  saveObsSettings(obsSettings: ISettingsSubCategory[]) {
    this.streamSettingsService.setObsStreamSettings(obsSettings);
    this.obsSettings = this.streamSettingsService.getObsStreamSettings();
  }

  get protectedModeEnabled(): boolean {
    return this.streamSettingsService.protectedModeEnabled;
  }

  get userName() {
    return this.userService.state.auth.platform.username;
  }

  get platform() {
    return this.userService.state.auth.platform.type;
  }

  get platformName() {
    return this.platform.charAt(0).toUpperCase() + this.platform.slice(1);
  }

  get iconForPlatform() {
    return {
      twitch: 'fab fa-twitch',
      youtube: 'fab fa-youtube',
      mixer: 'fas fa-times',
      facebook: 'fab fa-facebook',
    }[this.platform];
  }

  render() {
    return (
      <div>
        <div class="section flex">
          <div class="margin-right--20">
            <i class={cx(styles['platform-icon'], this.iconForPlatform)} />
          </div>
          <div>
            Streaming to {this.platformName} <br/>
            account: {this.userName}
          </div>
        </div>
        <div>
          <a> Stream to custom ingest</a>
        </div>

        <div class="section section--warning">
          <b>Warning: </b>
          Streaming to a custom injest is advanced functionality.
          Some features at Streamlabs OBS may stop working as expected
          <br /><br />
          <button class="button button--warn">{ $t('Use recommended settings') }</button>
        </div>
        <GenericFormGroups value={this.obsSettings} onInput={this.saveObsSettings} />
      </div>
    );
  }
}
