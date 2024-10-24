Using typescript create api client for streamlabs desktop app that is possible to use in the React component below.

```tsx

function fetchActiveScene() {
  return api.ScenesService.getActiveScene();
}

function ActiveSceneComponent() {
  const query = useQuery({ queryKey: ['activeScene'], queryFn:  fetchActiveScene })
  const scene = query.data;

  
  useEffect(() => {
    const subscription = api.ScenesService.sceneSwitched(scene => {
      queryClient.invalidateQueries({ queryKey: ['activeScene'] });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  return (
    <div>
      <h1>{scene?.name}</h1>
    </div>
  );
}

```

All API types for services are already defined in the type TAppServices, there are no need to create new types for each service.
```ts
export type TAppServices = {
  ScenesService: SecenesService;
  StreamingsService: StreamingsService;
  // ...
}
```

So do not create a new object for each service in the api-client.
Instead create a dynamic Proxy object that will send the correct json-rpc request to the streamlabs desktop app. And use TAppServices to resolve types
Use rxjs for subscriptions


This is documentation for StreamlabsDesktop API:
https://stream-labs.github.io/streamlabs-desktop-api-docs/docs/index.html

For a reference this is an example of Vue component that communicates with the streamlabs desktop app

```js
const PORT = 59650;
  let app = new Vue({
    el: '#app',
    data: {
      connectionStatus: 'disconnected',
      token: '',
      url: `http://127.0.0.1:${PORT}/api`, //`http://${location.hostname}:${PORT}/api`,
      scenes: [],
      audioSources: [],
      sceneItems: [],
      nextRequestId: 1,
      requests: {},
      subscriptions: {},
      socket: null,
      page: 'scenes',
      requestString: '',
      topPanelIsVisible: true
    },

    mounted() {
      this.resetRequestString();
    },

    methods: {
      connect() {
        if (this.connectionStatus !== 'disconnected') return;
        this.connectionStatus = 'pending';
        this.socket = new SockJS(this.url);

        this.socket.onopen = () => {
          console.log('open');
          // send token for auth
          this.request('TcpServerService', 'auth', this.token).then(() => {
            this.onConnectionHandler();
          }).catch(e => {
            alert(e.message);
          })
        };

        this.socket.onmessage = (e) => {
          this.onMessageHandler(e.data);
          this.logMessage(e.data.toString(), 'response');
        };


        this.socket.onclose = (e) => {
          this.connectionStatus = 'disconnected';
          alert('disconnected: ' + e.reason);
          console.log('close', e);
        };
      },


      onConnectionHandler() {
        this.connectionStatus = 'connected';

        this.request('ScenesService', 'getScenes').then(scenes => {
          scenes.forEach(scene => this.addScene(scene));
        });

        this.request('ScenesService', 'activeSceneId').then(id => {
          const scene = this.scenes.find(scene => scene.id === id);
          scene.isActive = true;
          this.onSceneSwitchedHandler(scene);
        });

        this.subscribe('ScenesService', 'sceneSwitched', activeScene => {
          this.onSceneSwitchedHandler(activeScene);
        });

        this.subscribe('ScenesService', 'sceneAdded', scene => {
          this.addScene(scene);
        });

        this.subscribe('ScenesService', 'sceneRemoved', scene => {
          this.removeScene(scene.id);
        });

        this.subscribe('SourcesService', 'sourceUpdated', source => {
          this.onSourceUpdatedHandler(source);
        });

        this.subscribe('ScenesService', 'itemAdded', scenItem => {
          this.onSceneItemAdded(scenItem);
      });

        this.subscribe('ScenesService', 'itemUpdated', scenItem => {
          this.onSceneItemUpdateHandler(scenItem);
        });
      },


      request(resourceId, methodName, ...args) {
        let id = this.nextRequestId++;
        let requestBody = {
          jsonrpc: '2.0',
          id,
          method: methodName,
          params: { resource: resourceId, args }
        };

        return this.sendMessage(requestBody);
      },


      sendMessage(message) {
        let requestBody = message;
        if (typeof message === 'string') {
          try {
            requestBody = JSON.parse(message);
          } catch (e) {
            alert('Invalid JSON');
            return;
          }
        }

        if (!requestBody.id) {
          alert('id is required');
          return;
        }

        this.logMessage(requestBody, 'request');

        return new Promise((resolve, reject) => {
          this.requests[requestBody.id] = {
            body: requestBody,
            resolve,
            reject,
            completed: false
          };
          this.socket.send(JSON.stringify(requestBody));
        });
      },


      onMessageHandler(data) {
        let message = JSON.parse(data);
        let request = this.requests[message.id];

        if (request) {
          if (message.error) {
            request.reject(message.error);
          } else {
            request.resolve(message.result);
          }
          delete this.requests[message.id];
        }

        const result = message.result;
        if (!result) return;

        if (result._type === 'EVENT' && result.emitter === 'STREAM') {
          this.subscriptions[message.result.resourceId](result.data);
        }

      },


      subscribe(resourceId, channelName, cb) {
        this.request(resourceId, channelName).then(subscriptionInfo => {
          this.subscriptions[subscriptionInfo.resourceId] = cb;
        });
      },


      addScene(scene) {
        this.scenes.push({...scene, isActive: false });
      },

      removeScene(sceneId) {
        this.scenes.splice(this.scenes.findIndex(scene => scene.id == sceneId), 1);
      },

      switchScene(sceneId) {
        this.request('ScenesService', 'makeSceneActive', sceneId);
      },

      setMuted(sourceId, isMuted) {
        this.request('SourcesService', 'setMuted', sourceId, isMuted);
      },

      toggleSceneItem(sceneItem) {
        this.request(sceneItem.resourceId, 'setVisibility', !sceneItem.visible);
      },

      onSceneSwitchedHandler(activeSceneModel) {
        let activeScene = null;
        this.scenes.forEach(scene => {
          scene.isActive = scene.id === activeSceneModel.id;
          if (scene.isActive) activeScene = scene;
        });
        this.request('AudioService', 'getSourcesForCurrentScene').then(sources => this.audioSources = sources);
        this.request(activeScene.resourceId, 'getItems').then(items => this.sceneItems = items);
      },


      onSourceUpdatedHandler(sourceModel) {
        let source = this.audioSources.find(source => source.sourceId === sourceModel.sourceId);
        source.muted = sourceModel.muted;
      },

      onSceneItemUpdateHandler(sceneItemModel) {
        let sceneItem = this.sceneItems.find(sceneItem => sceneItem.sceneItemId === sceneItemModel.sceneItemId);
        Object.assign(sceneItem, sceneItemModel);
      },

      onSceneItemAdded(sceneItemModel) {
        this.sceneItems.push(sceneItemModel);
      },

      resetRequestString() {
        this.requestString = JSON.stringify({
          jsonrpc: '2.0',
          id: this.nextRequestId++,
          method: 'getSources',
          params: { resource: 'SourcesService', args: [] }
        }, null, 2);
      },


      logMessage(data, type) {
        let jsonObj = (typeof data === 'string') ? JSON.parse(data) : data;
        console.log(type, jsonObj);
        const $messages = this.$refs.messages;
        const $message = document.createElement(`div`);
        $message.className = `message ${type}`;
        $message.appendChild(renderjson(jsonObj));
        $messages.appendChild($message);
        // open the first node
        $message.querySelector('.disclosure').dispatchEvent(new Event('click'));
        $messages.scrollTop = Number.MAX_SAFE_INTEGER;
      },

      clearLog() {
        this.$refs.messages.innerHTML = '';
      }

    }
  })
```