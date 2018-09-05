import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { metadata } from 'components/shared/inputs';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';
import { PlatformAppsService } from 'services/platform-apps';
import { Inject } from 'util/injector';

@Component({
  components: { VFormGroup, ValidatedForm }
})
export default class AppPlatformDeveloperSettings extends Vue {

  @Inject() platformAppsService: PlatformAppsService;

  appPathMetadata = metadata.file({
    title: 'Unpacked App Path',
    description: 'This is the path to your unpacked app.  ' +
      'It should be a folder containing a valid manifest.json',
    directory: true
  });

  appPathValue = this.currentlyLoadedUnpackedApp ?
    this.currentlyLoadedUnpackedApp.appPath : '';

  appTokenMetadata = metadata.text({
    title: 'App Token',
    description: 'This token allows you app to authenticate with the ' +
      'streamlabs API.  Visit dev-platform.streamlabs.com to create a developer account ' +
      'and get a test app token.'
  });

  appTokenValue = this.currentlyLoadedUnpackedApp ?
    this.currentlyLoadedUnpackedApp.appToken : '';

  get currentlyLoadedUnpackedApp() {
    if (this.platformAppsService.state.loadedApps.length === 0) return null;

    return this.platformAppsService.state.loadedApps[0];
  }

  loading = false;
  error = '';

  async loadApp() {
    // TODO Validation surfacing
    if (!this.appPathValue) return;
    if (!this.appTokenValue) return;

    if (this.currentlyLoadedUnpackedApp) {
      this.platformAppsService.unloadApps();
    }

    this.loading = true;

    try {
      await this.platformAppsService.installUnpackedApp(
        this.appPathValue,
        this.appTokenValue
      );
      this.loading = false;
    } catch (e) {
      this.loading = false;
      this.error = 'There was an error loading this app, please try again ' +
        'or contact the Streamlabs development team for assistance.';
    }
  }

  reloadApp() {
    this.loading = true;
    this.platformAppsService.reloadApp(this.currentlyLoadedUnpackedApp.id);

    // This prevents spamming the button
    setTimeout(() => this.loading = false, 2000);
  }

  unloadApp() {
    this.platformAppsService.unloadApps();
  }

}
