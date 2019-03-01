import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import VSelectPage from 'v-selectpage';
import { Inject } from 'util/injector';
import { $t, I18nService } from 'services/i18n';
import { prepareOptions, TTwitchTag, TTwitchTagWithLabel } from 'services/platforms/twitch/tags';

Vue.use(VSelectPage);

@Component({})
export default class TwitchTagsInput extends Vue {
  @Inject() i18nService: I18nService;

  @Prop() value: TTwitchTagWithLabel[];

  @Prop() tags: TTwitchTag[];

  @Prop() hasPermission: boolean;

  tagsLabel = $t('Tags');

  selectPlaceholder = $t('Select stream tags');

  tableColumns = [
    {
      title: $t('Tag'),
      data: 'name',
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
  currentTags = this.value ? this.value.map(tag => tag.tag_id).join(',') : null;

  get shouldDisable() {
    return this.value === null || !this.hasPermission;
  }

  get options() {
    return prepareOptions(
      this.i18nService.state.locale || this.i18nService.getFallbackLocale(),
      this.tags,
    );
  }

  onInput(tags: TTwitchTagWithLabel[]) {
    this.$emit('input', tags);
  }
}
