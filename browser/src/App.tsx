import './App.css';
import { Suspense } from "react";
import { ApiClient, createApiClient } from "./api-client";
import { GoLiveWindow } from '@/features/live/GoLiveWindow';
import TodosApp from '@/features/todos/Todos.tsx';
import { api } from './api/api.ts';
import { ConfigProvider, theme } from 'antd';
import { Provider } from 'jotai';


// const client = new ApiClient('http://192.168.1.220:59650/api', 'f9ebd973b12ab4228bb5cc856dd936aa1b644ded');


async function fetchActiveScene() {
  const scenesServiceModel = await api.ScenesService.getModel();
  return scenesServiceModel.scenes[scenesServiceModel.activeSceneId];
}




export default function App() {
  return (
  <>
      <ConfigProvider
    theme={{ algorithm: theme.darkAlgorithm }}>
      <Provider>
        <Suspense fallback={<span> App is loading...</span>}>
            <GoLiveWindow />
          </Suspense>
      </Provider>

    {/* <TodosApp/> */}
    {/* <ActiveSceneComponent/> */}
  </ConfigProvider>
  </>);

}





// function ActiveSceneComponent() {
//   const { data, mutate } = api.ScenesService.getModel.useSWR();
//   const scene = data?.scenes[data.activeSceneId];

//   api.ScenesService.sceneSwitched.useSubscribe(() => mutate())


//   return (
//     <div>
//       <h1>{scene?.name}</h1>
//     </div>
//   );
// }
