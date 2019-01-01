import Vue from 'vue';
import { PersistentStatefulService } from '../persistent-stateful-service';
import { Inject } from 'util/injector';
import { mutation } from '../stateful-service';
import { ChatbotCommonService } from './chatbot-common';
import { ChatbotBaseApiService } from './chatbot-base';
import { IImporterStatusResponse } from './chatbot-interfaces';

// state
interface IChatbotImporterApiServiceState {
  statusResponse: IImporterStatusResponse;
}

export class ChatbotImporterApiService extends PersistentStatefulService<
  IChatbotImporterApiServiceState
> {
  @Inject() chatbotCommonService: ChatbotCommonService;
  @Inject() chatbotBaseApiService: ChatbotBaseApiService;

  //
  //  Get
  //
  fetchImporterStatus() {
    return this.chatbotBaseApiService
      .api('GET', 'importer/status', {})
      .then(response => {
        console.log(response);
        this.SET_IMPORTER_STATUS(response);
      });
  }

  //
  // Update
  //
  importExtension() {
    return this.chatbotBaseApiService
      .api('POST', 'importer/extension', {})
      .then(() => {
        this.fetchImporterStatus();
      });
  }

  importStreamElements(
    jwt: string = '',
    loyalty: boolean = false,
    commands: boolean = false,
    timers: boolean = false
  ) {
    return this.chatbotBaseApiService
      .api('POST', 'importer/streamelements', {
        jwt,
        loyalty,
        commands,
        timers
      })
      .then(() => {
        this.fetchImporterStatus();
      });
  }

  @mutation()
  private SET_IMPORTER_STATUS(response: IImporterStatusResponse) {
    Vue.set(this.state, 'statusResponse', response);
  }
}
