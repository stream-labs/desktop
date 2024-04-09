import { mutation } from './core/stateful-service';
import { PersistentStatefulService } from './core/persistent-stateful-service';
import { SourcesService, ISourceApi } from './sources';
import { TObsValue } from 'components/obs/inputs/ObsInput';
import { RtvcEventLog } from 'services/usage-statistics';

// for source properties
export type SourcePropKey =
  | 'device'
  | 'latency'
  | 'input_gain'
  | 'output_gain'
  | 'pitch_shift'
  | 'pitch_shift_mode'
  | 'pitch_snap'
  | 'primary_voice'
  | 'secondary_voice'
  | 'amount';

export const PresetValues = [
  {
    index: 'preset/0',
    name: '琴詠ニア',
    pitchShift: 0,
    primaryVoice: 100,
    secondaryVoice: -1,
    amount: 0,
    label: 'near',
    description: '滑らかで無機質な声',
  },
  {
    index: 'preset/1',
    name: 'ずんだもん',
    pitchShift: 0,
    primaryVoice: 101,
    secondaryVoice: -1,
    amount: 0,
    label: 'zundamon',
    description: '子供っぽい明るい声',
  },
  {
    index: 'preset/2',
    name: '春日部つむぎ',
    pitchShift: 0,
    primaryVoice: 102,
    secondaryVoice: -1,
    amount: 0,
    label: 'tsumugi',
    description: '元気な明るい声',
  },
];

// RtvcStateService保持用
interface ManualParam {
  name: string;
  pitchShift: number;
  amount: number;
  primaryVoice: number;
  secondaryVoice: number;
}

interface PresetParam {
  pitchShift: number;
}

export interface StateParam {
  currentIndex: string;
  manuals: ManualParam[];
  presets: PresetParam[];
  scenes: { [id: string]: string };
}

export interface CommonParam {
  name: string;
  label: string;
  description: string;

  pitchShift: number;
  amount: number;
  primaryVoice: number;
  secondaryVoice: number;
}

interface IRtvcState {
  value: any;
}

interface RtvcActiveLog {
  used: boolean;
  latency: number;
  param: {
    [name: string]:
      | { pitchShift: number }
      | {
          name: string;
          pitchShift: number;
          amount: number;
          primaryVoice: number;
          secondaryVoice: number;
        };
  };
}

export class RtvcStateService extends PersistentStatefulService<IRtvcState> {
  setState(v: StateParam) {
    this.SET_STATE(v);
  }

  @mutation()
  private SET_STATE(v: any): void {
    this.state = { value: v };
  }

  // --- source properties

  setSourceProperties(source: ISourceApi, values: { key: SourcePropKey; value: TObsValue }[]) {
    const props = source.getPropertiesFormData();

    for (const v of values) {
      if (v.key === 'latency') this.eventLog.latency = v.value as number;
      const prop = props.find(a => a.name === v.key);
      if (!prop || prop.value === v.value) continue; // no need change
      prop.value = v.value;
    }

    source.setPropertiesFormData(props);
  }

  setSourcePropertiesByCommonParam(source: ISourceApi, p: CommonParam) {
    this.setSourceProperties(source, [
      { key: 'pitch_shift', value: p.pitchShift },
      { key: 'amount', value: p.amount },
      { key: 'primary_voice', value: p.primaryVoice },
      { key: 'secondary_voice', value: p.secondaryVoice },
    ]);
  }

  // -- state params

  getState(): StateParam {
    const r = { ...this.state.value } as StateParam;

    if (!r.presets) r.presets = [];
    while (r.presets.length < PresetValues.length) r.presets.push({ pitchShift: 0 });

    // default values
    if (!r.manuals)
      r.manuals = [
        { name: 'オリジナル1', pitchShift: 0, amount: 0, primaryVoice: 0, secondaryVoice: -1 },
        { name: 'オリジナル2', pitchShift: 0, amount: 0, primaryVoice: 0, secondaryVoice: -1 },
        { name: 'オリジナル3', pitchShift: 0, amount: 0, primaryVoice: 0, secondaryVoice: -1 },
      ];

    if (!r.scenes) r.scenes = {};
    if (!r.currentIndex || typeof r.currentIndex !== 'string') r.currentIndex = 'preset/0';

    return r;
  }

  indexToNum(state: StateParam, index: string): { isManual: boolean; idx: number } {
    const def = { isManual: false, idx: 0 };

    if (!index || typeof index !== 'string') return def;
    const s = index.split('/');
    if (s.length !== 2) return def;
    const num = Number(s[1]);
    if (s[0] === 'manual' && num >= 0 && num < state.manuals.length)
      return { isManual: true, idx: num };
    if (s[0] === 'preset' && num >= 0 && num < PresetValues.length)
      return { isManual: false, idx: num };

    return def;
  }

  stateToCommonParam(state: StateParam, index: string): CommonParam {
    const p = this.indexToNum(state, index);
    if (p.isManual) {
      const v = state.manuals[p.idx];
      return {
        name: v.name,
        label: '',
        description: '',
        pitchShift: v.pitchShift,
        amount: v.amount,
        primaryVoice: v.primaryVoice,
        secondaryVoice: v.secondaryVoice,
      };
    }

    const v = PresetValues[p.idx];
    const m = state.presets[p.idx];

    return {
      name: v.name,
      label: v.label,
      description: v.description,
      pitchShift: m.pitchShift,
      amount: v.amount,
      primaryVoice: v.primaryVoice,
      secondaryVoice: v.secondaryVoice,
    };
  }

  // -- scene : in accordance with scene,change index

  didChangeScene(sceneId: string, sourceService: SourcesService) {
    const sl = sourceService.getSourcesByType('nair-rtvc-source');
    if (!sl || !sl.length) return;
    const source = sl[0];

    const state = this.getState();
    if (!state.scenes || !state.scenes[sceneId]) return;
    const idx = state.scenes[sceneId];
    if (state.currentIndex === idx) return; // no change
    const p = this.stateToCommonParam(state, idx);

    this.setSourcePropertiesByCommonParam(source, p);
    state.currentIndex = idx;
    this.setState(state);

    this.modifyEventLog();
  }

  didRemoveScene(sceneId: string) {
    const state = this.getState();
    if (!state.scenes || !state.scenes[sceneId]) return;
    delete state.scenes[sceneId];
    this.setState(state);
  }

  // -- for action log

  eventLog: RtvcEventLog = { used: false, latency: 0, param: {} };
  isSouceActive = false;

  modifyEventLog() {
    if (!this.isSouceActive) return;

    this.eventLog.used = true;

    const state = this.getState();
    const index = state.currentIndex;
    const { isManual, idx } = this.indexToNum(state, index);
    if (isManual) {
      const p = state.manuals[idx];
      this.eventLog.param[`manual${idx}`] = {
        name: p.name,
        pitch_shift: p.pitchShift,
        amount: p.amount,
        primary_voice: p.primaryVoice,
        secondary_voice: p.secondaryVoice,
      };
    } else {
      const p = state.presets[idx];
      this.eventLog.param[`preset${idx}`] = { pitch_shift: p.pitchShift };
    }
  }

  didAddSource(source: ISourceApi) {
    const props = source.getPropertiesFormData();
    const p = props.find(a => a.name === 'latency');
    if (p) this.eventLog.latency = p.value as number;
    this.isSouceActive = true;
    this.modifyEventLog();
  }

  didRemoveSource(source: ISourceApi) {
    this.isSouceActive = false;
  }

  startStreaming() {
    this.eventLog.used = this.isSouceActive;
    this.eventLog.param = {}; // once reset
    this.modifyEventLog();
  }

  stopStreaming() {}
}
