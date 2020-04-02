import { BaseInput } from './BaseInput';
import { Component, Prop } from 'vue-property-decorator';
import { SelectPage } from 'v-selectpage';
import { Inject } from 'services/core/injector';
import { $t, I18nService } from 'services/i18n';
import { CustomizationService } from 'services/customization';
import { IGenericTagMetadata } from '.';

export interface ITag {
  value: string;
  description: string;
}

// TODO: Port TwitchTagsInput to use this
@Component({})
export default class GenericTagInput extends BaseInput<Array<ITag>, IGenericTagMetadata<string>> {
  @Inject() i18nService: I18nService;
  @Inject() customizationService: CustomizationService;

  @Prop() readonly value: Array<ITag>;

  @Prop({ default: () => ({}) })
  readonly metadata: IGenericTagMetadata<string>;

  @Prop() readonly title: string;

  mounted() {
    const search = document.getElementsByClassName('sp-search');
    const searchInput = document.getElementsByClassName('sp-search-input');
    const results = document.getElementsByClassName('sp-result-area');
    const cssClass = this.customizationService.currentTheme;
    Array.from(search).forEach(el => el.classList.add(cssClass));
    Array.from(searchInput).forEach(el => el.classList.add(cssClass));
    Array.from(results).forEach(el => el.classList.add(cssClass));
  }

  tableColumns = [
    {
      title: $t('Tag'),
      data: 'title',
    },
    {
      title: $t('Description'),
      data: 'description',
    },
  ];

  /*
   * VSelectPage doesn't accept an array as initial value, so we have to provide
   * it a string.
   */
  currentTags = this.value ? this.value.map(tag => tag.value).join(',') : null;

  get shouldDisable() {
    return this.value === null || this.metadata.noPermission;
  }

  handleInput(tags: Array<ITag>) {
    this.emitInput(tags);
  }

  render() {
    return (
      <div data-role="input" data-type="twitchTags" data-name={this.metadata.name}>
        {!this.metadata.noPermission && (
          <SelectPage
            data={this.metadata.options}
            multiple={true}
            key-field="value"
            show-field="title"
            pagination={false}
            title={this.metadata.title}
            placeholder={this.metadata.placeholder}
            vModel={this.currentTags}
            tb-columns={this.tableColumns}
            max-select-limit={5}
            onValues={(tags: Array<ITag>) => this.handleInput(tags)}
            width={398}
            language="en"
            disabled={this.shouldDisable}
          />
        )}
      </div>
    );
  }
}
