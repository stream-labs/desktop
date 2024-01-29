import { StatefulService, mutation } from './core/stateful-service';
import { PersistentStatefulService } from './core/persistent-stateful-service';
import { SourcesService } from './sources';

export interface IRtvcState {
  value: any;
}

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
  //仮値 css での宣言値で
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

export class RtvcStateService extends PersistentStatefulService<IRtvcState> {
  setState(v: StateParam) {
    this.SET_STATE(v);
  }

  @mutation()
  private SET_STATE(v: any): void {
    this.state = { value: v };
  }

  getState(): StateParam {
    let r = this.state.value as StateParam;
    if (!r) r = {} as StateParam;

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

  // -- params

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

  getParams(state: StateParam, index: string) {
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

  // -- scene

  changeScene(sceneId: string, sourceService: SourcesService) {
    const v = this.getState();
    if (!v.scenes || !v.scenes[sceneId]) return;
    const idx = v.scenes[sceneId];
    if (v.currentIndex === idx) return; // no change
    const p = this.getParams(v, idx);

    const sl = sourceService.getSourcesByType('nair-rtvc-source');
    if (!sl || !sl.length) return;
    const source = sl[0];

    const props = source.getPropertiesFormData();

    const setProp = (key: any, value: any) => {
      const prop = props.find(a => a.name === key);
      if (!prop || prop.value === value) return; // no need change
      prop.value = value;
    };

    setProp('pitch_shift', p.pitchShift);
    setProp('amount', p.amount);
    setProp('primary_voice', p.primaryVoice);
    setProp('secondary_voice', p.secondaryVoice);

    source.setPropertiesFormData(props);
    v.currentIndex = idx;
    this.setState(v);
  }

  removeScene(sceneId: string) {
    const v = this.getState();
    if (!v.scenes || !v.scenes[sceneId]) return;
    delete v.scenes[sceneId];
    this.setState(v);
  }
}
