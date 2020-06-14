This folder contains components for the Go-Live flow.
The main container-component GoLiveWindow makes transition between 3 states in the next direction:

```
GoLiveSettings -> GoLiveChecklist -> GoLiveSuccess
```

User may close the GoLive window after they applied new setting,
but it'll be shown again on `GoLiveChecklist` step if any errors persist