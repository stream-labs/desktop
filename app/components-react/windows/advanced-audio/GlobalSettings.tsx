import React, { useState, useRef, useMemo } from 'react';
import { Provider } from 'react-redux';
import {
  SliderInput,
  BoolButtonInput,
  ListInput,
  SwitchInput,
  NumberInput,
} from 'components-react/shared/inputs';
import Form from 'components-react/shared/inputs/Form';
import { TObsValue, IObsListInput, TObsFormData } from 'components/obs/inputs/ObsInput';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { AudioSource } from 'services/audio';
import { Source } from 'services/sources';
import { $t } from 'services/i18n';
import Utils from 'services/utils';
import styles from './AdvancedAudio.m.less';
import { ObsSettings } from '../../windows/settings/ObsSettings';
import { store } from '../../store';

export default function GlobalSettings() {
  return (
    <Provider store={store}>
      <ObsSettings page="Audio" />
    </Provider>
  );
}
