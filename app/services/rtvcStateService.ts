
import { StatefulService, mutation } from "./core/stateful-service";
import { PersistentStatefulService } from './core/persistent-stateful-service';


export interface IRtvcState {
  value: any;
}

export class RtvcStateService extends PersistentStatefulService<IRtvcState> {

  setValue(v: any) {
    this.SET_STATE(v)
  }

  getValue(): any {
    const r = this.state.value
    if (!r) return {}
    return r
  }

  @mutation()
  private SET_STATE(v: any): void {
    this.state = { value: v };
  }

}
