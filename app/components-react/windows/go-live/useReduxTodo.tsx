import { Services } from '../../service-provider';
import { ViewHandler } from '../../../services';
import { mutation } from '../../store';
import { useFeature } from '../../hooks/useFeature';

interface ITodoState {
  items: ITodoItem[];
  listName: string;
}

interface ITodoItem {
  title: string;
  done: boolean;
}

class TodoView extends ViewHandler<ITodoState> {
  get count() {
    return this.state.items.length;
  }
  get folders() {
    return Services.ScenesService.views.activeScene!.getFolders();
  }
}

class TodoFeature extends TodoView {
  state = {
    items: [
      { title: 'item1', done: true },
      { title: 'item2', done: false },
    ],
    listName: 'Default list',
  };

  get items() {
    return this.state.items;
  }

  get listName() {
    return this.state.listName;
  }

  get count() {
    return this.state.items.length;
  }

  @mutation()
  markAllDone() {
    this.state.items.forEach(item => (item.done = true));
  }

  @mutation()
  markAllUndone() {
    this.state.items.forEach(item => (item.done = false));
  }

  @mutation()
  setListName(name: string) {
    this.state.listName = name;
  }
}

export function useTodoFeature() {
  return useFeature(TodoFeature);
}
