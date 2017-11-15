# API reference

Streamlabs-OBS allows remote management of the application via
an RPC-based API. The API is split into several different services.
You can access services' methods and properties by sending
[JSON-RPC](http://www.jsonrpc.org/specification) messages to the
named pipe `slobs`.

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

request
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

## Asynchronous Execution

Some service methods are asynchronous and return a Javascript promise.
This is exposed via the API by 

Some services' methods, for example `AppService.loadConfig()` return `Promise` which is also subscription that
causes only one event when task is finished.

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
By default if response returns resources with `"_type": "HELPER"` Streamlabs-OBS
will attach some data by calling `getModel()` method of resource.
To disable that use `compactMode` parameter in JSON-RPC request:


request
```
{
    "jsonrpc": "2.0",
    "id": 6,
    "method": "getSource",
    "params": {
        "resource": "SourcesService",
        "args": ["5c3cf84f797a"],
        "compactMode": true
    }
}
```

response
```
{
    "jsonrpc": "2.0",
    "id": 6,
    "result": {
        "_type": "HELPER",
        "resourceId": "Source[\"5c3cf84f797a\"]",
    }
}
```

# Caveats
You can send several json-rpc requests in one request sting.
In this case all requests have to be separated with new-line character `\n`