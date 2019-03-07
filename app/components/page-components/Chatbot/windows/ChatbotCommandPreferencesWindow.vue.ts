import { Component, Prop } from 'vue-property-decorator';
import ChatbotWindowsBase from 'components/page-components/Chatbot/windows/ChatbotWindowsBase.vue';
import cloneDeep from 'lodash/cloneDeep';
import { $t } from 'services/i18n';
import { metadata as metadataHelper } from 'components/widgets/inputs';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';

import { ICommandMessagesData } from 'services/chatbot';

import { EInputType } from 'components/shared/inputs/index';

@Component({
  components: { ValidatedForm },
})
export default class ChatbotCommandPreferencesWindow extends ChatbotWindowsBase {
  $refs: {
    form: ValidatedForm;
  };

  settings: ICommandMessagesData = {
    cooldownMessage: null,
    costMessage: null,
    displayCooldown: false,
    displayCost: false,
    displayPermission: false,
    permissionmessage: null,
  };

  // metadata
  get metaData() {
    return {
      cost: metadataHelper.text({
        type: EInputType.text,
        required: true,
        max: 450,
        placeholder: $t('Cost Message'),
      }),
      permission: metadataHelper.text({
        type: EInputType.text,
        required: true,
        max: 450,
        placeholder: $t('Permission Message'),
      }),
      cooldown: metadataHelper.text({
        type: EInputType.text,
        required: true,
        max: 450,
        placeholder: $t('Cooldown Message'),
      }),
    };
  }

  get commandPreferences() {
    return this.chatbotApiService.Commands.state.commandPreferencesResponse;
  }

  mounted() {
    this.settings = cloneDeep(this.commandPreferences.settings.messages);
  }

  async onSaveHandler() {
    if (await this.$refs.form.validateAndGetErrorsCount()) return;

    const newPreferences = cloneDeep(this.commandPreferences);
    newPreferences.settings.messages = this.settings;

    this.chatbotApiService.Commands.updateCommandPreferences(newPreferences);
  }
}
