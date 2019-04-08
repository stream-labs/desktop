import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component } from 'vue-property-decorator';
import { Accordion, Badge } from 'streamlabs-beaker';
import mapValues from 'lodash/mapValues';
import pickBy from 'lodash/pickBy';
import { ICommandVariable } from 'services/chatbot';

@Component({
  components: { Accordion, Badge },
})
export default class ChatbotCommandVariables extends ChatbotBase {
  searchQuery = '';

  get filteredVariables() {
    const grouped = {};
    const arr = this.chatbotApiService.Commands.state.commandVariablesResponse;

    for (const variable of arr) {
      for (const tag of variable.tags) {
        if (!grouped[tag]) {
          grouped[tag] = [];
          grouped[tag].push(variable);
        } else {
          grouped[tag].push(variable);
        }
      }
    }

    const filteredVariables = mapValues(grouped, (section, slug) => {
      return pickBy(
        mapValues(section, (variable: ICommandVariable) => {
          const found = [slug, variable.variable, variable.example, variable.result]
            .map(str => str.toLowerCase())
            .find(str => str.includes(this.searchQuery.toLowerCase()));
          return found ? variable : undefined;
        }),
        (variable: ICommandVariable) => {
          return variable !== undefined;
        },
      );
    });

    const remaining = pickBy(filteredVariables, section => {
      return Object.keys(section).length !== 0;
    });

    return remaining;
  }

  mounted() {
    //
    // get list of user's custom commands
    //
    this.chatbotApiService.Commands.fetchCommandVariables();
  }
}
