import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Loading } from 'streamlabs-beaker';

@Component({})
export default class CustomLoader extends Vue {
  loadingStrings = [
    'Initiating doggo petting engine...',
    'Compiling food pic library...',
    'Calibrating RNG blame threshold...',
    'Dropping fire mixtape...',
    'Reticulating emoji splines...',
    'Waking up 24/7 support team...',
    'Asking the stream gods for perfect settings...',
    'Powering up the clouds...',
    'Constructing additional widgets...',
    "Remembering all your chatters' names...",
    'Executing good vibes protocol...',
    'Submitting mod thank-you notes...',
    'Expanding audience reach with multistream...',
    'Crafting perfect VOD with selective recording...',
    'Calculating multistream hype multiplier coefficient...',
  ];

  render() {
    return <Loading loadingStrs={this.loadingStrings} isRandom />;
  }
}
