import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component } from 'vue-property-decorator';
import { IDefaultCommand } from 'services/chatbot';
import { $t } from 'services/i18n';
import CollapsibleSection from 'components/shared/CollapsibleSection.vue';
import { mapValues, pickBy } from 'lodash';

type TCommandSlug =
  | 'commands'
  | 'link-protection'
  | 'giveaway'
  | 'loyalty'
  | 'queue'
  | 'media-share'
  | 'heist'
  | 'poll'
  | 'betting'
  | 'misc'
  | 'gamble'
  | 'quotes';

@Component({
  components: {
    CollapsibleSection,
  },
})
export default class ChatbotDefaultCommands extends ChatbotBase {
  searchQuery = '';

  v1CommandSlugs: TCommandSlug[] = [
    'commands',
    'link-protection',
    'giveaway',
    'loyalty',
    'queue',
    'heist',
    'poll',
    'betting',
    'misc',
    'gamble',
    'media-share',
    'quotes',
  ];

  get commandSlugs() {
    return this.chatbotApiService.Commands.state.defaultCommandsResponse;
  }

  get filteredSlugs() {
    const filteredCommands = mapValues(this.commandSlugs, (section, slug) => {
      return pickBy(
        mapValues(section, (command, key) => {
          const found = command.command.toLowerCase().indexOf(this.searchQuery.toLowerCase()) > -1;
          return found && ['!skip', '!wrongvideo'].indexOf(command.command) === -1
            ? command
            : undefined;
        }),
        (x, y) => {
          return x !== undefined;
        },
      );
    });
    const remaining = pickBy(filteredCommands, (section, slug: TCommandSlug) => {
      return Object.keys(section).length !== 0 && this.v1CommandSlugs.indexOf(slug) > -1;
    });
    return remaining;
  }

  matchesQuery(name: string, command: IDefaultCommand) {
    return (
      name.toLowerCase().indexOf(this.searchQuery.toLowerCase()) > -1 ||
      command.command.toLowerCase().indexOf(this.searchQuery.toLowerCase()) > -1 ||
      command.description.toLowerCase().indexOf(this.searchQuery.toLowerCase()) > -1
    );
  }

  mounted() {
    this.chatbotApiService.Commands.fetchDefaultCommands();
  }

  onResetDefaultCommandsHandler() {
    if (confirm($t('Are you sure you want to reset default commands?'))) {
      this.chatbotApiService.Commands.resetDefaultCommands();
    }
  }

  onToggleEnableCommandHandler(slugName: string, commandName: string, isEnabled: boolean) {
    const updatedCommand = {
      ...this.commandSlugs[slugName][commandName],
      enabled: isEnabled,
    };
    this.chatbotApiService.Commands.updateDefaultCommand(slugName, commandName, updatedCommand);
  }

  onOpenCommandWindowHandler(slugName: string, commandName: string, command: IDefaultCommand) {
    this.chatbotApiService.Common.openDefaultCommandWindow({
      ...command,
      slugName,
      commandName,
    });
  }
}
