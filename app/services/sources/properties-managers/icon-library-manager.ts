import { DefaultManager, IDefaultManagerSettings } from './default-manager';

interface IIconLibraryManagerSettings extends IDefaultManagerSettings {
  folder: string;
  activeIcon: string;
}
export class IconLibraryManager extends DefaultManager {
  settings: IIconLibraryManagerSettings;

  applySettings(settings: Dictionary<any>) {
    if (settings.activeIcon !== this.obsSource.settings.file) {
      this.obsSource.update({
        file: settings.activeIcon,
      });

      // If we don't do this, media backup will think the file
      // is corrupted and restore it from the cloud.
      this.handleSettingsChange({ file: settings.activeIcon });
    }

    super.applySettings({ ...this.settings, ...settings });
  }
}
