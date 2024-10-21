//import styles from '../../../app/windows/go-live/GoLive.m.less';
import { Button, Col, Input, Row, Form } from 'antd';
import React, { useEffect, useState } from 'react';
import { Controller, initStore, useController } from '../store/Controller';
// import Form from '../../shared/inputs/Form';

import { ApiClient, createApiClient } from '../api-client';
import { TAppServiceInstancess } from '../../../app/app-services';
const TextArea = Input.TextArea;

const client = new ApiClient('http://192.168.1.192:59650/api', 'f9ebd973b12ab4228bb5cc856dd936aa1b644ded');
const api = createApiClient<TAppServiceInstancess>(client);

class GoLiveController extends Controller {
  store = initStore({ lifecycle: 'waitForNewSettings', settings: { platforms: [] } });
  init() {
    console.log('GoLiveController mounted');

    api.StreamingService.prepopulateInfo();
    const store = this.store;
    // store.setState(s => {
    //     return { ...s, lifecycle: 'prepopulate' };
    // });

    setTimeout(() => {
            store.setState(s => {
                return { ...s, lifecycle: 'prepopulate' };
              });
     }, 2000);

    api.StreamingService.streamInfoChanged.subscribe(changes => {

    //     setTimeout(() => {
    //         store.setState(s => {
    //             return { ...s, lifecycle: 'waitForNewSettings' };
    //           });
    //  }, 2000);

        // setTimeout(() => {
        //     console.log('stream info changed', changes.state.info);
        //     //   store.setState(s => {
        //     //     return { ...s, lifecycle: 'waitForNewSettings' };
        //     //   });
            
        //     store.setState(s => {
        //         const ch = JSON.parse(JSON.stringify({...changes.state.info}));
        //         console.log('ch', ch);
        //         Object.assign(s,  { lifecycle: 'waitForNewSettings' });
        //         // return { ...s, ...changes.state.info };
        //         // return { ...s};
        //         // return { ...s, ...changes.state.info };
        //       });
        // }, 1000);
        
 
    })


    // const streamingService = Services.StreamingService;
    //
    // // subscribe to stream info changes
    // this.subscriptions.push(
    //   streamingService.streamInfoChanged.subscribe(changes => {
    //     console.log('stream info changed', changes);
    //     this.store.setState(s => {
    //       return { ...s, ...changes.state.info };
    //     });
    //   }),
    // );
    //
    // // fetch initial stream info
    // new Promise<void>(resolve => {
    //   setTimeout(() => {
    //     console.log('prepopulating info');
    //     streamingService.actions.prepopulateInfo();
    //     resolve();
    //   }, 2000);
    // });
    // streamingService.actions.prepopulateInfo();
  }
}

export default function GoLiveWindowV2() {
    console.log('RENDER GoLiveWindowV2');
  const { store, destroy } = useController(GoLiveController);
  // useEffect(() => {
  //   return destroy;
  // });

  const lifecycle = store.useState(s => s.lifecycle);

  // const { lifecycle, form } = useGoLiveSettingsRoot().extend(module => ({
  //   destroy() {
  //     // clear failed checks and warnings on window close
  //     if (module.checklist.startVideoTransmission !== 'done') {
  //       Services.StreamingService.actions.resetInfo();
  //     }
  //   },
  // }));

  const shouldShowSettings = ['empty', 'prepopulate', 'waitForNewSettings'].includes(lifecycle);
  const shouldShowChecklist = ['runChecklist', 'live'].includes(lifecycle);

  return (
    <div>   
      {/* layout="vertical"
      name="editStreamForm"
    > */}
      {/* STEP 1 - FILL OUT THE SETTINGS FORM */}
      {shouldShowSettings && <GoLiveSettings key={'settings'} />}

      {/* STEP 2 - RUN THE CHECKLIST */}
      {shouldShowChecklist && <GoLiveChecklist key={'checklist'} />}
    </div>
  );
}

function ModalFooter() {
  return <Button>Confirm & Go Live</Button>;
}

function GoLiveSettings() {
    return <></>;
//   const { store } = useController(GoLiveController);
//   const lyfecycle = store.useState(s => s.lifecycle);
//   const isLoading = lyfecycle === 'prepopulate' || lyfecycle === 'empty';
//   console.log('isLoading', isLoading);
//   return (
//     <div>
//       <Row gutter={[16, 16]}>
//         {isLoading && <Col span={24}>Loading...</Col>}

//         {!isLoading && (
//           <>
//             <Col span={12}>
//               <GeneralSettings />
//             </Col>
//             <Col span={12}>
//               <Destinations />
//             </Col>
//           </>
//         )}
//       </Row>
//     </div>
//   );
}

function GeneralSettings() {
  const hasDescription = true;
  const descriptionIsRequired = true;
  const [description, setDescription] = useState('');

  return (
    <>
      General Settings

      <Form.Item label="Title" required={true}>
        <Input />
      </Form.Item>

      {/*DESCRIPTION*/}
      {hasDescription && (
        // <TextAreaInput
        //   value={description}
        //   onChange={val => setDescription(val)}
        //   name="description"
        //   label="'Description"
        //   required={descriptionIsRequired}
        // />
        <Form.Item label="Description" required={descriptionIsRequired}>
          <TextArea rows={4} />
        </Form.Item>
      )}
    </>
  );
}

function Destinations() {
  const { store } = useController(GoLiveController);
  const platforms = store.useState(s => s.settings!.platforms);
  return (
    <div>
      Destinations
      <pre>{JSON.stringify(platforms, null, 2)}</pre>
    </div>
  );
}

function GoLiveChecklist() {
  return <div>Go Live Checklist </div>;
}
