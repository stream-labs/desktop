import { Component } from 'vue-property-decorator';
import { $t } from 'services/i18n';
import TsxComponent, { createProps, required } from 'components/tsx-component';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { metadata } from 'components/shared/inputs';
import { BoolInput } from 'components/shared/inputs/inputs';
import ValidatedForm from 'components/shared/inputs/ValidatedForm';
import { TPlatform } from 'services/platforms';
import { IStreamSettings, StreamingService } from 'services/streaming';
import { SyncWithValue } from 'services/app/app-decorators';
import { Inject } from 'services/core';
import { pick } from 'lodash';
import { assertIsDefined } from 'util/properties-type-guards';

class Props {
  /**
   * if provided then change props only for the provided platform
   */
  platform?: TPlatform = undefined;
  value?: IStreamSettings = undefined;
}

type TCustomFieldName = 'title' | 'description';

/**
 * Component for modifying common platform fields such as "Title", "Description" and "Game"
 * if "props.platform" is provided it changes props for a single platform
 * otherwise it changes props for all enabled platforms
 */
@Component({ props: createProps(Props) })
export default class CommonPlatformFields extends TsxComponent<Props> {
  @Inject() private streamingService: StreamingService;
  @SyncWithValue()
  private settings: IStreamSettings;
  private get view() {
    return this.streamingService.views;
  }
  private commonFields: { title: string; description: string } = required();

  created() {
    this.commonFields = pick(
      this.props.platform
        ? this.settings.platforms[this.props.platform]
        : this.view.getCommonFields(this.settings.platforms),
      ['title', 'description'],
    ) as { title: string; description: string };
  }

  mounted() {
    // set common fields fore each target platform
    Object.keys(this.commonFields).forEach((fieldName: 'title' | 'description') =>
      this.updateCommonField(fieldName, this.commonFields[fieldName]),
    );
  }

  private get enabledPlatforms(): TPlatform[] {
    const platforms = Object.keys(this.settings.platforms) as TPlatform[];
    return platforms.filter(platform => this.settings.platforms[platform].enabled);
  }

  /**
   * Returns platform settings for a single-platform mode
   **/
  private get platformSettings() {
    if (!this.props.platform) return null;
    return this.settings.platforms[this.props.platform];
  }

  /**
   * Returns platforms that we should apply settings to
   **/
  private get targetPlatforms(): TPlatform[] {
    // component in the single platform mode
    // just return "props.platform"
    if (this.props.platform) return [this.props.platform];

    // component in the simple multiplatform mode
    // return all enabled platforms
    if (!this.settings.advancedMode) {
      return this.enabledPlatforms;
    }

    // component in the advanced multiplatform mode
    // return platforms with "useCustomFields=false"
    return this.enabledPlatforms.filter(
      platform => !this.settings.platforms[platform].useCustomFields,
    );
  }

  /**
   * Update a selected field for all target platforms
   **/
  private updateCommonField(fieldName: TCustomFieldName, value: string) {
    this.commonFields[fieldName] = value;
    this.targetPlatforms.forEach(platform => {
      this.settings.platforms[platform][fieldName] = value;
    });
  }

  /**
   * Toggle the "Use different title... " checkbox
   **/
  private toggleUseCustom(useCustomFields: boolean) {
    // this method is applicable only for a single platform component's mode
    const platform = this.props.platform;
    assertIsDefined(platform);

    // if we disabled customFields for a platform
    // than we should return common fields values for this platform
    if (!useCustomFields) {
      const commonFields = this.view.getCommonFields(this.settings.platforms);
      // TODO: figure out how to resolve types
      // @ts-ignore
      this.settings.platforms[platform] = {
        ...this.settings.platforms[platform],
        useCustomFields,
        title: commonFields.title,
      };
      if (this.view.supports('description', [platform])) {
        this.settings.platforms[platform]['description'] = commonFields.description;
      }
      return;
    }
    this.settings.platforms[platform].useCustomFields = useCustomFields;
  }

  private render() {
    const isSinglePlatformMode = !!this.props.platform;
    const disabled = this.targetPlatforms.length === 0;
    const hasCustomCheckbox =
      isSinglePlatformMode && this.settings.advancedMode && this.enabledPlatforms.length > 1;
    const fieldsAreVisible = !hasCustomCheckbox || this.platformSettings?.useCustomFields;
    const view = this.streamingService.views;
    const hasDescription = isSinglePlatformMode
      ? view.supports('description', [this.props.platform as TPlatform])
      : view.supports('description');
    const hasGame = view.supports('game', this.targetPlatforms);
    const fields = isSinglePlatformMode
      ? this.settings.platforms[this.props.platform as TPlatform]
      : this.commonFields;
    const platform = this.props.platform;
    const fbSettings = this.settings.platforms.facebook;
    // description is required for facebook
    const descriptionIsRequired =
      platform === 'facebook' || (!platform && fbSettings.enabled && !fbSettings.useCustomFields);

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
      <ValidatedForm name="common-settings">
        {/*USE CUSTOM CHECKBOX*/}
        {hasCustomCheckbox && (
          <HFormGroup>
            <BoolInput
              value={this.platformSettings?.useCustomFields}
              onInput={(enabled: boolean) => this.toggleUseCustom(enabled)}
              metadata={{ title, name: 'customEnabled' }}
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
                  name: 'title',
                  required: true,
                  fullWidth: true,
                  max: this.props.platform === 'twitch' ? 140 : 120,
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
                    name: 'description',
                    fullWidth: true,
                    required: descriptionIsRequired,
                    disabled,
                  })}
                />
              )}
            </div>
          )}
        </transition>
      </ValidatedForm>
    );
  }
}
