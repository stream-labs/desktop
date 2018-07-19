import { Service } from 'services/service';
import { UserService } from 'services/user';
import { Inject } from 'util/injector';
import { handleErrors, authorizedHeaders } from 'util/requests';
import { resolve } from 'url';

export class ChatbotApiService extends Service {
  @Inject() userService: UserService;


  cdn = 'https://chatbot-api.streamlabs.com/';

  apiEndpoint(route: String) {
    return `${this.cdn}${route}`;
  }

  logIn() {
    return new Promise((resolve, reject) => {
      const url = this.apiEndpoint('login');
      const headers = authorizedHeaders(this.userService.apiToken);
      headers.append('Content-Type', 'application/json');
      const request = new Request(url, { 
        headers,
        method: 'POST',
        body: JSON.stringify({})
      });

      fetch(request)
        .then(handleErrors)
        .then(response => response.json())
        .then(response => {
          debugger;
          resolve(response);
        })
        .catch(err => {
          reject(err);
        });
    })
  }
}
