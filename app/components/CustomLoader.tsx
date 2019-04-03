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
    $t('Waking up 24/7 support team...'),
    $t('Asking the stream gods for perfect settings...'),
    $t('Powering up the clouds...'),
    $t('Constructing additional widgets...'),
  ];

  render(h: Function) {
    return <Loading loadingStrs={this.loadingStrings} isRandom />;
  }
}
