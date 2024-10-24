import './App.css';
import { useEffect } from "react";
import { TAppServiceInstancess } from "../../app/app-services";
import { ApiClient, createApiClient } from "./api-client";
import GoLiveWindowV2 from '@/features/live/GoLiveWindow';
import TodosApp from '@/features/todos/Todos.tsx';
import { api } from './api/api.ts';
import { ConfigProvider, theme } from 'antd';


// const client = new ApiClient('http://192.168.1.220:59650/api', 'f9ebd973b12ab4228bb5cc856dd936aa1b644ded');


async function fetchActiveScene() {
  const scenesServiceModel = await api.ScenesService.getModel();
  return scenesServiceModel.scenes[scenesServiceModel.activeSceneId];
}




export default function App() {
  return (
  <>
      <ConfigProvider
    theme={{
      // 1. Use dark algorithm
      algorithm: theme.darkAlgorithm,

      // 2. Combine dark algorithm and compact algorithm
      // algorithm: [theme.darkAlgorithm, theme.compactAlgorithm],
    }}
    >
          <GoLiveWindowV2 />
    {/* <TodosApp/> */}
    <ActiveSceneComponent/>
  </ConfigProvider>
  </>);

}





function ActiveSceneComponent() {
  const scene = {name: 'test'};
  // const { data, mutate } = api.ScenesService.getModel.useSWR();
  // const scene = data?.scenes[data.activeSceneId];
  //
  // api.ScenesService.sceneSwitched.useSubscribe(() => mutate())


  return (
    <div>
      <h1>{scene?.name}</h1>
    </div>
  );
}
