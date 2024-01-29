import { StatefulService, mutation } from './core/stateful-service';
import { PersistentStatefulService } from './core/persistent-stateful-service';
import { SourcesService } from './sources';

export interface IRtvcState {
  value: any;
}

// RtvcStateService保持用
export interface ManualParam {
  name: string;
  pitchShift: number;
  amount: number;
  primaryVoice: number;
  secondaryVoice: number;
}

export interface PresetParam {
  pitchShift: number;
}

interface SceneParam {
  index: string;
  pitchShift: number;
  amount: number;
  primaryVoice: number;
  secondaryVoice: number;
}

export interface StateParam {
  currentIndex: string;
  manuals: ManualParam[];
  presets: PresetParam[];
  scenes: { [id: string]: SceneParam };
}

export class RtvcStateService extends PersistentStatefulService<IRtvcState> {
  setValue(v: StateParam) {
    this.SET_STATE(v);
  }

  getValue(): StateParam {
    const r = this.state.value;
    if (!r) return {} as StateParam;
    return r;
  }

  @mutation()
  private SET_STATE(v: any): void {
    this.state = { value: v };
  }

  changeScene(sceneId: string, sourceService: SourcesService) {
    const v = this.getValue();
    if (!v.scenes || !v.scenes[sceneId]) return;
    const p = v.scenes[sceneId];
    if (v.currentIndex === p.index) return; // no change

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
    v.currentIndex = p.index;
    this.setValue(v);
  }

  removeScene(sceneId: string) {
    const v = this.getValue();
    if (!v.scenes || !v.scenes[sceneId]) return;
    delete v.scenes[sceneId];
    this.setValue(v);
  }
}
