import { StatefulService } from 'services/stateful-service';

interface IStreamingServiceState {

}

enum EOBSOutputType {
  Streaming = 'streaming',
  Recording = 'recording'
}

enum EOBSOutputSignal {
  Starting = 'starting',
  Start = 'start',
  Stopping = 'stopping',
  Stop = 'stop'
}

enum EStreamingState {
  Offline = 'offline',
  Starting = 'starting',
  Live = 'live',
  Ending = 'ending'
}

export class StreamingService extends StatefulService<IStreamingServiceState> {

}
