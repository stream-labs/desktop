import { Component, Watch } from 'vue-property-decorator';
import { $t } from 'services/i18n';
import TsxComponent from 'components/tsx-component';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { IListOption, metadata } from 'components/shared/inputs';
import { createProps } from '../tsx-component';
import { BoolInput, ListInput } from '../shared/inputs/inputs';
import cloneDeep from 'lodash/cloneDeep';
import styles from './StreamTitleAndDescription.m.less';
import ValidatedForm from '../shared/inputs/ValidatedForm';
import { getPlatformService, TPlatform } from '../../services/platforms';
import { IGoLiveSettings } from '../../services/streaming';
import { SyncWithValue } from '../../services/app/app-decorators';
import { Debounce } from 'lodash-decorators';

class ComponentProps {
  hasCustomCheckbox?: boolean = false;
  platforms: TPlatform[] = [];
  value?: IComponentValue = {
    title: '',
    description: '',
    customEnabled: false,
  };
}

interface IComponentValue {
  title: string;
  description: string;
  customEnabled?: boolean;
}

@Component({ props: createProps(ComponentProps) })
export default class CommonPlatformFields extends TsxComponent<ComponentProps> {
  @SyncWithValue()
  private settings: IGoLiveSettings['commonFields'];

  searchingGames = false;
  private gameOptions: IListOption<string>[] = null;

  created() {
    this.gameOptions = this.settings.game
      ? [{ value: this.settings.game, title: this.settings.game }]
      : [];
  }

  private get gameMetadata() {
    return metadata.list({
      title: $t('Game'),
      placeholder: $t('Start typing to search'),
      options: this.gameOptions,
      loading: this.searchingGames,
      internalSearch: false,
      allowEmpty: true,
      noResult: $t('No matching game(s) found.'),
      required: true,
    });
  }

  @Debounce(500)
  async onGameSearchHandler(searchString: string) {
    if (searchString !== '') {
      this.searchingGames = true;
      const service = getPlatformService('twitch');

      this.gameOptions = [];

      return service.searchGames(searchString).then(games => {
        this.searchingGames = false;
        if (games && games.length) {
          games.forEach(game => {
            this.gameOptions.push({
              title: game.name,
              value: game.name,
            });
          });
        }
      });
    }
  }

  render() {
    const fieldsAreVisible =
      !this.props.hasCustomCheckbox ||
      (this.props.hasCustomCheckbox && this.props.value.customEnabled);
    const platforms = this.props.platforms;
    const hasDescription = platforms.includes('facebook') || platforms.includes('youtube');
    const hasGame = platforms.includes('twitch') || platforms.includes('facebook');

    // find out the best checkbox title
    let title = '';
    if (hasDescription) {
      title = $t('Use custom title and description');
    } else if (hasGame) {
      title = $t('Use custom title and game');
    } else {
      title = $t('Use custom title');
    }

    return (
      <ValidatedForm>
        {/*USE CUSTOM CHECKBOX*/}
        {this.props.hasCustomCheckbox && (
          <HFormGroup>
            <BoolInput vModel={this.value.customEnabled} title={title} />
          </HFormGroup>
        )}

        <transition name="slidedown">
          {fieldsAreVisible && (
            <div>
              {/*TITLE*/}
              <HFormGroup
                vModel={this.settings.title}
                metadata={metadata.text({ title: $t('Title'), required: true, fullWidth: true })}
              />

              {/*DESCRIPTION*/}
              {hasDescription && (
                <HFormGroup
                  vModel={this.settings.description}
                  metadata={metadata.textArea({
                    title: $t('Description'),
                    fullWidth: true,
                  })}
                />
              )}

              {/*GAME*/}
              {hasGame && (
                <HFormGroup title={this.gameMetadata.title}>
                  <ListInput
                    handleSearchChange={val => this.onGameSearchHandler(val)}
                    vModel={this.settings.game}
                    metadata={this.gameMetadata}
                  />
                </HFormGroup>
              )}
            </div>
          )}
        </transition>
      </ValidatedForm>
    );
  }
}
