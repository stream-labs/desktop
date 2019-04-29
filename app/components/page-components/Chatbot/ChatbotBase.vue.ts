import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { CustomizationService } from 'services/customization';
import Tabs from 'components/Tabs.vue';
import DropdownMenu from 'components/shared/DropdownMenu.vue';
import { inputComponents } from 'components/widgets/inputs';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import {
  ChatbotApiService,
  ChatbotPermissionsEnums,
  ChatbotAutopermitEnums,
  ChatbotResponseTypes,
  ChatbotPunishments,
} from 'services/chatbot';
import pickBy from 'lodash/pickBy';
import { IListOption } from 'components/shared/inputs';

@Component({
  components: {
    ...inputComponents,
    VFormGroup,
    Tabs,
    DropdownMenu,
  },
})
export default class ChatbotBase extends Vue {
  @Inject() chatbotApiService: ChatbotApiService;
  @Inject() customizationService: CustomizationService;

  get isDarkTheme() {
    return this.customizationService.isDarkTheme;
  }

  get chatbotPermissionsEnums() {
    return ChatbotPermissionsEnums;
  }

  get chatbotPermissions() {
    const keys = Object.keys(ChatbotPermissionsEnums).filter(key => key !== 'None');

    const permissions = keys.reduce((a: IListOption<number>[], b: string) => {
      if (typeof ChatbotPermissionsEnums[b] === 'number') {
        a.push({
          title: b.split('_').join(' '),
          value: ChatbotPermissionsEnums[b],
        });
      }
      return a;
    }, []);
    return permissions;
  }

  get chatbotAutopermitOptions() {
    const permissions = Object.keys(ChatbotAutopermitEnums).reduce(
      (a: IListOption<number>[], b: string) => {
        if (typeof ChatbotAutopermitEnums[b] === 'number') {
          a.push({
            title: b.split('_').join(' '),
            value: ChatbotAutopermitEnums[b],
          });
        }
        return a;
      },
      [],
    );
    return permissions;
  }

  get chatbotResponseTypes() {
    return Object.keys(ChatbotResponseTypes).map(responseType => {
      return {
        value: ChatbotResponseTypes[responseType],
        title: responseType,
      };
    });
  }

  get chatbotPunishments() {
    return Object.keys(ChatbotPunishments).map(punishmentType => {
      return {
        value: ChatbotPunishments[punishmentType],
        title: punishmentType,
      };
    });
  }

  getPermission(level: number) {
    if (level === 1) {
      return 'Everyone';
    }

    const permissions = Object.keys(
      pickBy(ChatbotPermissionsEnums, (value, key) => {
        return (level & value) === value && value !== ChatbotPermissionsEnums.None;
      }),
    ).join(', ');

    return permissions;
  }
}
