import ChatbotBase from 'components/page-components/Chatbot/ChatbotBase.vue';
import { Component } from 'vue-property-decorator';
import { Accordion, Badge } from 'streamlabs-beaker';
import mapValues from 'lodash/mapValues';
import pickBy from 'lodash/pickBy';
@Component({
  components: { Accordion, Badge },
})
export default class ChatbotCommandVariables extends ChatbotBase {
  searchQuery = '';

  get filteredVariables() {
    const grouped = {};
    const arr = this.chatbotApiService.Commands.state.commandVariablesResponse as any[];

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
        mapValues(section, (variable: any) => {
          const found =
            slug.toLowerCase().indexOf(this.searchQuery.toLowerCase()) > -1 ||
            variable.variable.toLowerCase().indexOf(this.searchQuery.toLowerCase()) > -1 ||
            variable.example.toLowerCase().indexOf(this.searchQuery.toLowerCase()) > -1 ||
            variable.result.toLowerCase().indexOf(this.searchQuery.toLowerCase()) > -1;
          return found ? variable : undefined;
        }),
        (x, y) => {
          return x !== undefined;
        },
      );
    });

    const remaining = pickBy(filteredVariables, (section, slug) => {
      return Object.keys(section).length !== 0;
    });

    console.log(remaining);

    return remaining;
  }

  mounted() {
    //
    // get list of user's custom commands
    //
    this.chatbotApiService.Commands.fetchCommandVariables();
  }
}
