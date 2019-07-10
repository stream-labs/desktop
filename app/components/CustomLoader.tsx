import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Loading } from 'streamlabs-beaker';

@Component({})
export default class CustomLoader extends Vue {
  loadingStrings = [
    'Initiating doggo petting engine...',
    'Compiling food pic library...',
    'Callibrating RNG blame threshold...',
    'Dropping fire mixtape...',
    'Reticulating emoji splines...',
    'Waking up 24/7 support team...',
    'Asking the stream gods for perfect settings...',
    'Powering up the clouds...',
    'Constructing additional widgets...',
  ];

  render(h: Function) {
    return <Loading loadingStrs={this.loadingStrings} isRandom />;
  }
}
