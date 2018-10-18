# API reference

Streamlabs-OBS allows remote management of the application via
an RPC-based API. The API is split into several different services.
You can access services' methods and properties by sending
[JSON-RPC](http://www.jsonrpc.org/specification) messages to the
named pipe `slobs`.

Individual JSON-RPC requests should be separated by a single newline
character `LF` ( ASCII code 10).  You should ensure that your JSON message does not
contain any newline characters. Use `\n` as replacement for new lines in JSON. 

# Examples


## Get a list of scenes


### Request
```
{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getScenes",
    "params": {
        "resource": "ScenesService"
    }
}
```



### Response
```
{
    "jsonrpc": "2.0",
    "id": 1,
    "result": [
       {
            "_type": "HELPER",
            "resourceId": "Scene[\"3efd436e5546\"]",
            "id": "3efd436e5546",
            "name": "My super scene",
            "activeItemIds": []
        },
       {
            "_type": "HELPER",
            "resourceId": "Scene[\"6b615869aba3\"]",
            "id": "6b615869aba3",
            "name": "NewScene",
            "activeItemIds": []
        }
    ]
}
```

The property `"_type": "HELPER"` means that you can fetch some
additional information by calling methods on this object. To do
that, just include the `resourceId` from the response to `resource`
in the new request.

## Get items in a scene

### Request
```
{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "getItems",
    "params": {
        "resource": "Scene[\"3efd436e5546\"]",
        "args": []
    }
}
```

### Response
```
{
    "jsonrpc": "2.0",
    "id": 2,
    "result": [
       {
            "_type": "HELPER",
            "resourceId": "SceneItem[\"3efd436e5546\"]",
            "sceneItemId": "68b413a288c8",
            "sourceId": "5687af55058c",
            "obsSceneItemId": 1,
            "transform": {
                "position": { "x": 0, "y": 25 },
                "scale": { "x": 1, "y": 1 },
                "rotation": 0
            },
            "visible": true,
            "locked": false
        }
    ]
}
```

## Event subscriptions

Subscribe to the `sceneSwitched` event:

### Request
```
{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "sceneSwitched",
    "params": {
        "resource": "ScenesService",
        "args": []
    }
}
```

### Response
```
{
    "jsonrpc": "2.0",
    "id": 4,
    "result": {
        "_type": "SUBSCRIPTION",
        "resourceId": "ScenesService.sceneSwitched",
        "emitter": "STREAM"
    }
}
```

After subscribing, you will receive events when the user
switches between scenes:

### Event
```
{
    "jsonrpc": "2.0",
    "result": {
        "_type": "EVENT",
        "emitter": "STREAM",
        "resourceId": "ScenesService.sceneSwitched",
        "data": {
            "id": "5c3cf84f797a",
            "name": "NewScene (1)",
            "activeItemIds": []
        }
    }
}
```

Use `resourceId` to unsubscribe:

### Request
```
{
    "jsonrpc": "2.0",
    "id": 5,
    "method": "unsubscribe",
    "params": {
        "resource": "ScenesService.sceneSwitched",
    }
}
```

## Asynchronous Task Execution

Some service methods are asynchronous and return a Javascript promise.
This is exposed via the API by returning a subscription that will
fire a single event.  You can think of the subscription response as
the acknowledgement of your request, and the event as a notification
of completion with a result.

Although fundamentally all requests sent over the socket are asynchronous,
a function that returns a promise is a good indication that your
application consuming the API should probably not block waiting for a
response.  Functions that return a promise do not guarantee fast
execution.

### Request
```
{
    "jsonrpc": "2.0",
    "id": 5,
    "method": "loadConfig",
    "params": {
        "resource": "AppService",
        "args": ["MyScenes"]
    }
}
```

### Response
```
{
    "jsonrpc": "2.0",
    "id": 5,
    "result": {
        "_type": "SUBSCRIPTION",
        "resourceId": "5c3cf84f797a",
        "emitter": "PROMISE"
    }
}
```

### Event
```
{
    "jsonrpc": "2.0",
    "result": {
        "_type": "EVENT",
        "emitter": "PROMISE",
        "resourceId": "5c3cf84f797a",
        "data": {},
        "isRejected": false
    }
}
```

## Reducing response body
By default if the response returns resources with `"_type": "HELPER"`,
Streamlabs-OBS will attach some data by calling `getModel()` method of resource.
To disable that behavior, use the `compactMode` parameter in JSON-RPC request:


### Request
```
{
    "jsonrpc": "2.0",
    "id": 6,
    "method": "getSources",
    "params": {
        "resource": "SourcesService",
        "args": [],
        "compactMode": true
    }
}
```

### Response
```
{
    "jsonrpc": "2.0",
    "id": 6,
    "result": [
        {
            "_type": "HELPER",
            "resourceId": "Source[\"5c3cf84f797a\"]",
        },
        {
            "_type": "HELPER",
            "resourceId": "Source[\"5c3cf84f797b\"]",
        },
        {
            "_type": "HELPER",
            "resourceId": "Source[\"5c3cf84f797c\"]",
        },
    }
}
```

# Remote connections
Streamlabs OBS allows remote connection via websokets protocol powered by [Sockjs](https://github.com/sockjs).
To enable remote connections run Streamlabs OBS with `--adv-settings` parameter, go to `Settings->API`,
enable Websokets and check `Allow Remote Connections`.
Use API token from this window to authorize you connection:


### Request
```
{
    "jsonrpc": "2.0",
    "id": 8,
    "method": "auth",
    "params": {
        "resource": "TcpServerService",
        "args": ["your_secret_token_here"]
    }
}
```

Local connections to '127.0.0.1' don't require authorization.



# FAQ

## What is the difference between Sources and SceneItems?

One thing to keep in mind in OBS is that sources and scene items are different things.
A source exists outside the context of a scene. Muted is a property of a source. 
A scene item is essentially an instance of a source in a scene. 
The same underlying source can be in multiple scenes as a sceneitem. 
Visibility is an attribute on a scene item. 
So the same source can be visible in one scene and invisible in another for example.

## How to mute a source ?

First get the list of audio sources for the current scene

### Request
```
{
    "jsonrpc": "2.0",
    "id": 7,
    "method": "getSourcesForCurrentScene",
    "params": {
        "resource": "AudioService"
    }
}
```


### Response
```
{
    "jsonrpc": "2.0",
    "id": 7,
    "result": [
       {
            "_type": "HELPER",
            "resourceId": "AudioSource[\"wasapi_output_capture_30c2879c\"]",
            "sourceId": "wasapi_output_capture_30c2879c",
            "muted": false,
            "name": "DesktopAudioDevice1",
            "type": "wasapi_output_capture",
            "id": "wasapi_output_capture_30c2879c-989e-4230-a293-c2e47941197a"
        },
       {
            "_type": "HELPER",
            "resourceId": "AudioSource[\"wasapi_input_capture_d497319b\"]",
            "sourceId": "wasapi_input_capture_d497319b",
            "muted": false,
            "name": "AuxAudioDevice1",
            "type": "wasapi_input_capture",
            "id": "wasapi_input_capture_d497319b"
        }
    ]
}
```

Usually the AudioSource with the name AuxAudioDevice1 is the microphone.
To mute it you have to call `IAudioSourceApi.setMuted(true)`.
Use `resourceId` as the reference to `IAudioSourceApi` instance: 

### Request
```
{
    "jsonrpc": "2.0",
    "id": 7,
    "method": "setMuted",
    "params": {
        "resource": "AudioSource[\"wasapi_input_capture_d497319b\"]",
        "args": [true]
    }
}
```

## How to hide/show a scene item?

First get the active scene
### Request
```
{
    "jsonrpc": "2.0",
    "id": 8,
    "method": "activeScene",
    "params": {
        "resource": "ScenesService"
    }
}
```

### Response
```
{
    "jsonrpc": "2.0",
    "id": 8,
    "result": {
        "_type": "HELPER",
        "resourceId": "Scene[\"scene_02da7db7\"]",
        "id": "scene_02da7db7",
        "name": "Scene",
        "items": [
           {
                "sceneItemId": "b18ee2b0",
                "sourceId": "color_source_61221191",
                "transform": {
                    "position": { "x": 0, "y": 25},
                    "scale": { "x": 1, "y": 1},
                    "rotation": 0
                },
                "visible": true
            },
           {
                "sceneItemId": "fffadcdd",
                "sourceId": "image_source_21071a85",
                "transform": {
                    "position": { "x": 0, "y": 25 },
                    "scale": { "x": 1, "y": 1 },
                    "rotation": 0
                },
                "visible": true
            }
        ]
    }
}
```

Lets hide the first scene item via `ISceneItemApi.setVisibility(false)` method.
To do that you need a `resourceId` for this scene item.
Use `ISceneApi.getSceneItem(sceneItemId)`.

### Request
```
{
    "jsonrpc": "2.0",
    "id": 9,
    "method": "getItem",
    "params": {
        "resource": "Scene[\"scene_02da7db7\"]",
        "args": ["b18ee2b0"]
    }
}
```

### Response
```
{
    "jsonrpc": "2.0",
    "id": 9,
    "result": {
        "_type": "HELPER",
        "resourceId": "SceneItem[\"scene_02da7db7\",\"b18ee2b0-6ff7\",\"color_source_61221191\"]",
        "sceneItemId": "b18ee2b0",
        "sourceId": "color_source_61221191",
        "transform": {
            "position" : { "x": 0, "y": 25 },
            "scale": { "x": 1, "y": 1 },
            "rotation": 0
        },
        "visible": true
    }
}
```

Now you have a `resourceId` for the `ISceneItemApi` instance and can use its methods including setVisibility.
### Request
```
{
    "jsonrpc": "2.0",
    "id": 10,
    "method": "setVisibility",
    "params": {
        "resource": "SceneItem[\"scene_02da7db7\",\"b18ee2b0-6ff7\",\"color_source_61221191\"]",
        "args": [false]
    }
}
```

# How to switch a scene collection?

Use `SceneCollectionsService.collections` to find the id of the collection you want to load

### Request
```
{
    "jsonrpc": "2.0",
    "id": 11,
    "method": "collections",
    "params": {
        "resource": "SceneCollectionsService",
        "args": []
    }
}
```

Use `SceneCollectionsService.load` to load it

### Request
```
{
    "jsonrpc": "2.0",
    "id": 12,
    "method": "load",
    "params": {
        "resource": "SceneCollectionsService",
        "args": ["d3165bf4-2690-426a-80a1-f3421658e04e"]
    }
}
```