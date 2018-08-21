import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component } from 'vue-property-decorator';
import { IDefaultCommand } from 'services/chatbot/chatbot-interfaces';


@Component({})
export default class ChatbotDefaultCommands extends ChatbotBase {

  searchQuery = '';

  visible: {
    commands: boolean;
    'link-protection': boolean;
    giveaway: boolean;
  } = {
    commands: true,
    'link-protection': true,
    giveaway: true
  }

  toggleVisible(tab: 'commands' | 'link-protection' | 'giveaway') {
    this.visible[tab] = !this.visible[tab];
  }

  get commandSlugs() {
    return this.chatbotApiService.state.defaultCommandsResponse;
  }

  matchesQuery(name: string, command: IDefaultCommand) {
    return (
      name.toLowerCase().indexOf(this.searchQuery.toLowerCase()) > -1 ||
      command.command.toLowerCase().indexOf(this.searchQuery.toLowerCase()) > -1 ||
      command.description.toLowerCase().indexOf(this.searchQuery.toLowerCase()) > -1
    )
  }

  mounted() {
    this.chatbotApiService.fetchDefaultCommands();
  }

  onResetDefaultCommands() {
    this.chatbotApiService.resetDefaultCommands();
  }

  toggleEnableCommand(slugName: string, commandName: string, isEnabled: boolean) {
    const updatedCommand = {
      ...this.commandSlugs[slugName][commandName],
      enabled: isEnabled
    };
    this.chatbotApiService.updateDefaultCommand(slugName, commandName, updatedCommand);
  }

  openCommandWindow(slugName: string, commandName: string, command: IDefaultCommand) {
    this.chatbotCommonService.openDefaultCommandWindow({
      ...command,
      slugName,
      commandName
    });
  }
}
