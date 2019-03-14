import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Loading } from 'streamlabs-beaker';
import { $t } from 'services/i18n';

@Component({})
export default class CustomLoader extends Vue {
  loadingStrings = [
    $t('Initiating doggo petting engine...'),
    $t('Compiling food pic library...'),
    $t('Callibrating RNG blame threshold...'),
    $t('Dropping fire mixtape...'),
    $t('Reticulating emoji splines...'),
    $t('Initializing sponsorship deals...'),
  ];

  render(h: Function) {
    return <Loading loadingStrs={this.loadingStrings} />;
  }
}
