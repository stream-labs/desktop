import './App.css';
import { useEffect } from "react";
import { TAppServiceInstancess } from "../../app/app-services";
import { ApiClient, createApiClient } from "./api-client";
import GoLiveWindowV2 from './components/GoLiveWindow';


// const client = new ApiClient('http://192.168.1.220:59650/api', 'f9ebd973b12ab4228bb5cc856dd936aa1b644ded');
const client = new ApiClient('http://192.168.1.192:59650/api', 'f9ebd973b12ab4228bb5cc856dd936aa1b644ded');
const api = createApiClient<TAppServiceInstancess>(client);

async function fetchActiveScene() {
  const scenesServiceModel = await api.ScenesService.getModel();
  return scenesServiceModel.scenes[scenesServiceModel.activeSceneId];
}


async  function sayHello(): string {
  // const response = await trpc.hello.query({ name: 'tRPC' });
  // console.log(response); // { greeting: 'Hello tRPC' }
  // const service = null as StreamingServiceType | null;
  // service?.actions.prepopulateInfo();
  // api.services.StreamingService?.prepopulateInfo();
}

export default function App() {
  sayHello();
  return <>
    <GoLiveWindowV2 />
    <ActiveSceneComponent/>
  </>
}





function ActiveSceneComponent() {
  const { data, mutate } = api.ScenesService.getModel.useSWR();
  const scene = data?.scenes[data.activeSceneId];

  api.ScenesService.sceneSwitched.useSubscribe(() => mutate())

  // useEffect(() => {
  //   const subscription = api.ScenesService.sceneSwitched.subscribe((scene) => {
  //     mutate('activeScene');
  //   });

  //   return () => {
  //     subscription.unsubscribe();
  //   };
  // }, []);

  return (
    <div>
      <h1>{scene?.name}</h1>
    </div>
  );
}
