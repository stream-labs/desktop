import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { ChatbotApiService, ChatbotCommonService } from 'services/chatbot/chatbot';
import { CustomizationService } from 'services/customization';
import { Inject } from 'util/injector';
import Tabs from 'components/Tabs.vue';
import DropdownMenu from 'components/shared/DropdownMenu.vue';
import { inputComponents } from 'components/widgets/inputs';
import FormWrapper from 'components/shared/inputs/FormWrapper.vue';

import {
  ChatbotPermissionsEnums,
  ChatbotAutopermitEnums,
  ChatbotResponseTypes,
  ChatbotPunishments,
} from 'services/chatbot/chatbot-interfaces';

import { IListOption } from 'components/shared/inputs'

@Component({
  components: {
    ...inputComponents,
    FormWrapper,
    Tabs,
    DropdownMenu,
  }
})
export default class ChatbotBase extends Vue {
  @Inject() chatbotApiService: ChatbotApiService;
  @Inject() chatbotCommonService: ChatbotCommonService;
  @Inject() customizationService: CustomizationService;

  mounted() {
    // pre-load them to switch between 2 windows
    this.chatbotApiService.fetchDefaultCommands();
    this.chatbotApiService.fetchLinkProtection();
  }

  get nightTheme() {
    return this.customizationService.nightMode;
  }

  get chatbotPermissionsEnums() {
    return ChatbotPermissionsEnums;
  }

  get chatbotPermissions() {
    let permissions = Object.keys(ChatbotPermissionsEnums).reduce(
      (a: IListOption<number>[], b: string) => {
        if (typeof ChatbotPermissionsEnums[b] === 'number') {
          a.push({
            title: b.split('_').join(' '),
            value: ChatbotPermissionsEnums[b]
          });
        }
        return a;
      },
      []
    );
    return permissions;
  }

  get chatbotAutopermitOptions() {
    let permissions = Object.keys(ChatbotAutopermitEnums).reduce(
      (a: IListOption<number>[], b: string) => {
        if (typeof ChatbotAutopermitEnums[b] === 'number') {
          a.push({
            title: b.split('_').join(' '),
            value: ChatbotAutopermitEnums[b]
          });
        }
        return a;
      },
      []
    );
    return permissions;
  }


  get chatbotResponseTypes() {
    return Object.keys(ChatbotResponseTypes).map(responseType => {
      return {
        value: ChatbotResponseTypes[responseType],
        title: responseType
      };
    });
  }

  get chatbotPunishments() {
    return Object.keys(ChatbotPunishments).map(punishmentType => {
      return {
        value: ChatbotPunishments[punishmentType],
        title: punishmentType
      };
    });
  }
}
