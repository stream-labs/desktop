import './App.css';
import { Row, Card } from 'antd';
import GoLiveWindowV2 from '../../app/components-react/windows/go-live-v2/GoLiveWindow';
import { StreamingServiceType } from '../../app/services/streaming';
import { api } from './api-client.ts';
// import { trpc } from './trpc-client.tsx';

async  function sayHello(): string {
  // const response = await trpc.hello.query({ name: 'tRPC' });
  // console.log(response); // { greeting: 'Hello tRPC' }
  // const service = null as StreamingServiceType | null;
  // service?.actions.prepopulateInfo();
  api.services.StreamingService?.prepopulateInfo();
}

export default function App() {
  sayHello();
  return <>
    <GoLiveWindowV2 /></>
}
