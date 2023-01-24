import { useVuex } from 'components-react/hooks';
import { Services } from 'components-react/service-provider';
import FormFactory from 'components-react/shared/inputs/FormFactory';
import React from 'react';
import { $t } from 'services/i18n';
import { metadata } from '../../shared/inputs/metadata';

export default function SceneTransitions(p: { connectionId: string }) {
  const { TransitionsService, ScenesService, EditorCommandsService } = Services;

  const { connection, transitionOptions } = useVuex(() => ({
    connection: TransitionsService.state.connections.find(conn => conn.id === p.connectionId),
    transitionOptions: TransitionsService.state.transitions.map(transition => ({
      label: transition.name,
      value: transition.id,
    })),
  }));

  if (!connection) return <></>;

  const values = {
    fromSceneId: connection.fromSceneId,
    transitionId: connection.transitionId,
    toSceneId: connection.toSceneId,
  };

  const sceneOptions = [
    { label: $t('All'), value: 'ALL' },
    ...ScenesService.views.scenes.map(scene => ({ label: scene.name, value: scene.id })),
  ];

  const meta = {
    fromSceneId: metadata.list({ label: $t('Beginning Scene'), options: sceneOptions }),
    transitionId: metadata.list({ label: $t('Scene Transition'), options: transitionOptions }),
    toSceneId: metadata.list({ label: $t('Ending Scene'), options: sceneOptions }),
  };

  function handleInput(key: string) {
    return (value: string) =>
      EditorCommandsService.actions.executeCommand('EditConnectionCommand', p.connectionId, {
        [key]: value,
      });
  }

  return (
    <FormFactory
      values={values}
      metadata={meta}
      onChange={handleInput}
      formOptions={{ layout: 'vertical' }}
    />
  );
}
