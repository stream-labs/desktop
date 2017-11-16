# API reference

Streamlabs-OBS allows remote management of the application via
an RPC-based API. The API is split into several different services.
You can access services' methods and properties by sending
[JSON-RPC](http://www.jsonrpc.org/specification) messages to the
named pipe `slobs`.

Individual JSON-RPC requests should be separated by a single newline
character `\n`.  You should ensure that your JSON message does not
contain any newline characters.

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
            "x": 0,
            "y": 25.955074875208084,
            "scaleX": 1.2462070119820023,
            "scaleY": 1.2462070119820023,
            "visible": true,
            "rotation": 0,
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
        "resourceId": "ScenesService.sceneSwitched"
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
        "resourceId": "5c3cf84f797a"
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
