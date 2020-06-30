import { Component, Watch, Prop } from 'vue-property-decorator';
import { $t } from 'services/i18n';
import TsxComponent from 'components/tsx-component';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { IListOption, metadata } from 'components/shared/inputs';
import { createProps } from '../tsx-component';
import { BoolInput, ListInput } from '../shared/inputs/inputs';
import ValidatedForm from '../shared/inputs/ValidatedForm';
import { getPlatformService, TPlatform } from '../../services/platforms';
import { IGoLiveSettings, IStreamSettings, StreamingService } from '../../services/streaming';
import { SyncWithValue } from '../../services/app/app-decorators';
import { Debounce } from 'lodash-decorators';
import { IPlatformCommonFields, IPlatformFlags } from '../../services/streaming/streaming-api';
import { Inject } from '../../services/core';
import GameSelector from '../windows/go-live/GameSelector';
import { pick } from 'lodash';

class Props {
  platform?: TPlatform | null = null;
  value?: IStreamSettings = null;
}

type TCustomFieldName = 'title' | 'description';

@Component({ props: createProps(Props) })
export default class CommonPlatformFields extends TsxComponent<Props> {
  @Inject() private streamingService: StreamingService;
  @SyncWithValue()
  private settings: IStreamSettings = null;
  private get view() {
    return this.streamingService.views;
  }
  private commonFields: { title: string; description: string } = null;

  created() {
    this.commonFields = pick(
      this.props.platform
        ? this.settings.destinations[this.props.platform]
        : this.view.getCommonFields(this.settings),
      ['title', 'description'],
    ) as { title: string; description: string };
  }

  private get enabledPlatforms(): TPlatform[] {
    const platforms = Object.keys(this.settings.destinations) as TPlatform[];
    return platforms.filter(platform => this.settings.destinations[platform].enabled);
  }

  /**
   * Returns platform settings in a single-platform mode
   **/
  private get platformSettings() {
    return this.settings.destinations[this.props.platform];
  }

  /**
   * Returns platforms that don't have `useCustomFields = true` flag
   **/
  private get targetPlatforms(): TPlatform[] {
    if (this.props.platform) return [this.props.platform];
    return this.enabledPlatforms.filter(
      platform => !this.settings.destinations[platform].useCustomFields,
    );
  }

  private updateCommonField(fieldName: TCustomFieldName, value: string) {
    this.commonFields[fieldName] = value;
    this.targetPlatforms.forEach(platform => {
      this.settings.destinations[platform][fieldName] = value;
    });
  }

  private toggleUseCustom(useCustomFields: boolean) {
    const platform = this.props.platform;

    // if we disabled customFileds we should return common fields values for this platform
    if (!useCustomFields) {
      const commonFields = this.view.getCommonFields(this.settings);
      // TODO: figure out how to resolve types
      // @ts-ignore
      this.settings.destinations[platform] = {
        ...this.settings.destinations[platform],
        useCustomFields,
        title: commonFields.title,
      };
      if (this.view.supports('description', platform)) {
        this.settings.destinations[platform]['description'] = commonFields.description;
      }
      return;
    }
    this.settings.destinations[platform].useCustomFields = useCustomFields;
  }

  private render() {
    const isSinglePlatformMode = !!this.props.platform;
    const disabled = this.targetPlatforms.length === 0;
    const hasCustomCheckbox = isSinglePlatformMode && this.settings.advancedMode;
    const fieldsAreVisible = !hasCustomCheckbox || this.platformSettings.useCustomFields;
    const view = this.streamingService.views;
    const hasDescription = isSinglePlatformMode
      ? view.supports('description', this.props.platform)
      : view.supports('description');
    const hasGame = view.supports('game');
    const fields = isSinglePlatformMode
      ? this.settings.destinations[this.props.platform]
      : this.commonFields;

    // find out the best title for common fields
    let title = '';
    if (hasDescription && hasGame) {
      title = $t('Use different title, game and description');
    } else if (hasDescription) {
      title = $t('Use different title and description');
    } else if (hasGame) {
      title = $t('Use different title and game');
    } else {
      title = $t('Use different title');
    }

    return (
      <ValidatedForm>
        {/*USE CUSTOM CHECKBOX*/}
        {hasCustomCheckbox && (
          <HFormGroup>
            <BoolInput
              value={this.platformSettings.useCustomFields}
              onInput={(enabled: boolean) => this.toggleUseCustom(enabled)}
              title={title}
            />
          </HFormGroup>
        )}

        <transition name="slidedown">
          {fieldsAreVisible && (
            <div>
              {/*TITLE*/}
              <HFormGroup
                value={fields.title}
                onInput={(val: string) => this.updateCommonField('title', val)}
                metadata={metadata.text({
                  title: $t('Title'),
                  required: true,
                  fullWidth: true,
                  disabled,
                })}
              />

              {/*DESCRIPTION*/}
              {hasDescription && (
                <HFormGroup
                  value={fields['description']}
                  onInput={(val: string) => this.updateCommonField('description', val)}
                  metadata={metadata.textArea({
                    title: $t('Description'),
                    fullWidth: true,
                    disabled,
                  })}
                />
              )}

              {/*GAME*/}
              {hasGame && (
                <HFormGroup title={$t('Game')}>
                  {/*<ListInput*/}
                  {/*  handleSearchChange={val => this.onGameSearchHandler(val)}*/}
                  {/*  vModel={this.settings.game}*/}
                  {/*  metadata={this.gameMetadata}*/}
                  {/*/>*/}
                  <GameSelector vModel={this.settings} platform={this.props.platform} />
                </HFormGroup>
              )}
            </div>
          )}
        </transition>
      </ValidatedForm>
    );
  }
}
