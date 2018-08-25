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
      'streamlabs API.  Visit <TBD> to create a developer account ' +
      'and get a test app token.'
  });

  appTokenValue = this.currentlyLoadedUnpackedApp ?
    this.currentlyLoadedUnpackedApp.appToken : '';

  get currentlyLoadedUnpackedApp() {
    if (this.platformAppsService.state.loadedApps.length === 0) return null;

    return this.platformAppsService.state.loadedApps[0];
  }

  async loadApp() {
    // TODO Validation surfacing
    if (!this.appPathValue) return;
    if (!this.appTokenValue) return;

    if (this.currentlyLoadedUnpackedApp) {
      this.platformAppsService.unloadApps();
    }

    await this.platformAppsService.installUnpackedApp(
      this.appPathValue,
      this.appTokenValue
    );
  }

  reloadApp() {
    this.platformAppsService.reloadApp(this.currentlyLoadedUnpackedApp.manifest.id);
  }

  unloadApp() {
    this.platformAppsService.unloadApps();
  }

}
