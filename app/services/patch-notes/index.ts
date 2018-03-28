import { PersistentStatefulService } from 'services/persistent-stateful-service';

interface IPatchNotesState {
  lastVersionSeen: string;
}

export interface IPatchNotes {
  version: string;
  title: string;
  notes: string[];
}

export class PatchNotesService extends PersistentStatefulService<IPatchNotesState> {

  static defaultState: IPatchNotesState = {
    lastVersionSeen: null
  };

  showPatchNotesIfRequired() {

  }

}
