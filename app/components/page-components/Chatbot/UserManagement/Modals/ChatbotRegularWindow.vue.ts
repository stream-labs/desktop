import { Component } from 'vue-property-decorator';
import ChatbotWindowsBase from '../../windows/ChatbotWindowsBase.vue';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';
import { formMetadata, metadata } from 'components/shared/inputs';
import { $t } from 'services/i18n';
import { IManagedUser, IChatbotErrorResponse } from 'services/chatbot';
import cloneDeep from 'lodash/cloneDeep';

@Component({ components: { ValidatedForm } })
export default class RegularModal extends ChatbotWindowsBase {
  $refs: {
    form: ValidatedForm;
  };

  newRegular: IManagedUser = {
    id: null,
    platform: 'Twitch',
    user: null,
  };

  get metaData() {
    return formMetadata({
      user: metadata.text({
        required: true,
        max: 100,
        title: this.newRegular.platform === 'Youtube' ? $t('Channel Id') : $t('Name'),
        placeholder: this.newRegular.platform === 'Youtube' ? $t('Channel Id') : $t('Name'),
        tooltip:
          this.newRegular.platform === 'Youtube'
            ? $t('A Youtube Channel Id looks like: UCNL8jaJ9hId96P13QmQXNtA')
            : undefined,
      }),
      platform: metadata.list({
        required: true,
        title: $t('Platform'),
        options: [
          { title: 'Twitch', value: 'Twitch' },
          { title: 'Mixer', value: 'Mixer' },
          { title: 'Youtube', value: 'Youtube' },
        ],
      }),
    });
  }

  mounted() {
    // if editing existing custom command
    if (this.isEdit) {
      this.newRegular = cloneDeep(this.regularToUpdate);
    }
  }

  get isEdit() {
    return this.regularToUpdate && this.regularToUpdate.id;
  }

  get regularToUpdate() {
    return this.chatbotApiService.Common.state.regularToUpdate;
  }

  async onSaveHandler() {
    if (await this.$refs.form.validateAndGetErrorsCount()) return;

    if (this.isEdit) {
      await this.chatbotApiService.UserManagement.updateRegular(
        this.regularToUpdate.id,
        this.newRegular,
      ).catch(this.onErrorHandler);
    } else {
      await this.chatbotApiService.UserManagement.createRegular(this.newRegular).catch(
        this.onErrorHandler,
      );
    }
  }

  onErrorHandler(errorResponse: IChatbotErrorResponse) {
    if (errorResponse.error && errorResponse.error === 'Duplicate') {
      alert($t('This user is already a regular.'));
    }
  }
}
