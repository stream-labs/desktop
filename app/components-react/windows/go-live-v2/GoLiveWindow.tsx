import styles from '../go-live/GoLive.m.less';
import { Button, Col, Input, Row, Form } from 'antd';
import React, { useEffect, useState } from 'react';
import { ApiClient, createApiClient } from '../../../../browser/src/api-client';
// import Form from '../../shared/inputs/Form';

import { initStore, useController, Controller } from '../../../../browser/src/store/Controller';
import { IStreamInfo } from '../../../services/streaming/streaming-api';
import { TAppServiceInstancess } from 'app-services';
const TextArea = Input.TextArea;

const client = new ApiClient('http://192.168.1.220:59650/api', 'f9ebd973b12ab4228bb5cc856dd936aa1b644ded');
const api = createApiClient<TAppServiceInstancess>(client);

class GoLiveController extends Controller {
  store = initStore({ lifecycle: 'waitForNewSettings', settings: { platforms: [] } });
  onMount() {
    console.log('GoLiveController mounted');

    api.StreamingService.prepopulateInfo();
    api.StreamingService.streamInfoChanged.subscribe(changes => {
        this.store.setState(s => {
          return { ...s, ...changes.state.info };
        });
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
    <Form
      layout="vertical"
      name="editStreamForm"
    >
      {/* STEP 1 - FILL OUT THE SETTINGS FORM */}
      {shouldShowSettings && <GoLiveSettings key={'settings'} />}

      {/* STEP 2 - RUN THE CHECKLIST */}
      {shouldShowChecklist && <GoLiveChecklist key={'checklist'} />}
    </Form>
  );
}

function ModalFooter() {
  return <Button>Confirm & Go Live</Button>;
}

function GoLiveSettings() {
  const { store } = useController(GoLiveController);
  const lyfecycle = store.useState(s => s.lifecycle);
  const isLoading = lyfecycle === 'prepopulate' || lyfecycle === 'empty';
  console.log('isLoading', isLoading);
  return (
    <div>
      <Row gutter={[16, 16]}>
        {isLoading && <Col span={24}>Loading...</Col>}

        {!isLoading && (
          <>
            <Col span={12}>
              <GeneralSettings />
            </Col>
            <Col span={12}>
              <Destinations />
            </Col>
          </>
        )}
      </Row>
    </div>
  );
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
