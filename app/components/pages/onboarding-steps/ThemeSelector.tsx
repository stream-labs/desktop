import { Component } from 'vue-property-decorator';
import { OnboardingStep } from 'streamlabs-beaker';
import TsxComponent from 'components/tsx-component';
import { $t } from 'services/i18n';
import { Inject } from 'services';
import { SceneCollectionsService } from 'services/scene-collections';

@Component({})
export default class ObsImport extends TsxComponent<{}> {
  @Inject() sceneCollectionsService: SceneCollectionsService;

  get themesMetadata() {
    return [
      {
        title: 'Borderline [Red Yellow] - by Nerd or Die',
        url: 'https://cdn.streamlabs.com/marketplace/overlays/7684923/ea91062/ea91062.overlay',
        image: '',
      },
      {
        title: 'Dark Matter by VBI',
        url: 'https://cdn.streamlabs.com/marketplace/overlays/7684923/3205db0/3205db0.overlay',
        image: '',
      },
      {
        title: 'Geometic Madness',
        url: 'https://cdn.streamlabs.com/marketplace/overlays/2116872/17f7cb5/17f7cb5.overlay',
        image: '',
      },
      {
        title: 'Nexus',
        url: 'https://cdn.streamlabs.com/marketplace/overlays/7684923/dd96270/dd96270.overlay',
        image: '',
      },
      {
        title: 'Relative Minds',
        url: 'https://cdn.streamlabs.com/marketplace/overlays/7684923/0d2e611/0d2e611.overlay',
        image: '',
      },
      {
        title: 'Facebook Gaming Pure Hexagons',
        url: 'https://cdn.streamlabs.com/marketplace/overlays/8062844/4a0582e/4a0582e.overlay',
        image: '',
      },
    ];
  }

  installTheme(url: string, name: string) {
    () => this.sceneCollectionsService.installOverlay(url, name);
  }

  render(h: Function) {
    return (
      <OnboardingStep slot="2">
        <template slot="title">{$t('Add a Theme')}</template>
        <template slot="desc">
          {$t(
            'Not seeing a theme that catches your eye? Our theme library has hundreds of free choices available',
          )}
          <div>
            {this.themesMetadata.map(theme => (
              <div onClick={this.installTheme(theme.url, theme.title)}>
                <img src={theme.image} />
                <div>{theme.title}</div>
              </div>
            ))}
          </div>
        </template>
      </OnboardingStep>
    );
  }
}
