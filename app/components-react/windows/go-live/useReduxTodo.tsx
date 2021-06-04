import { Services } from '../../service-provider';
import { ViewHandler } from '../../../services';
import { mutation } from '../../store';
import { useFeature } from '../../hooks/useFeature';
import React from 'react';

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

// // create a stateful feature
//
// class TodoFeature {
//   // INITIAL STATE
//   state = {
//     items: [
//       { title: 'item1', done: true },
//       { title: 'item2', done: false },
//     ],
//   };
//
//   // GETTERS
//
//   get items() {
//     return this.state.items;
//   }
//
//   get count() {
//     return this.state.items.length;
//   }
//
//   // ACTIONS
//
//   showCount() {
//     alert(this.count);
//   }
//
//   // MUTATIONS
//
//   @mutation()
//   clear() {
//     this.state.items = [];
//   }
//
//   @mutation()
//   markAllDone() {
//     this.state.items.forEach(item => (item.done = true));
//   }
// }
//
// // create a root component
// export function TodoList() {
//   return (
//     <div>
//       <TodoListItems />
//       <TodoListButtons />
//     </div>
//   );
// }
//
// // render the list
// export function TodoListItems() {
//   // select component's dependencies
//   const { items } = useFeature(TodoFeature);
//
//   return (
//     <ul>
//       {items.map((item, ind) => (
//         <li key={ind}>
//           {item.title} done: {String(item.done)}
//         </li>
//       ))}
//     </ul>
//   );
// }
//
// // render the buttons
// export function TodoListButtons() {
//   // select component's dependencies
//   const { clear, markAllDone } = useFeature(TodoFeature);
//
//   return (
//     <div>
//       <Button onClick={clear}> Clear list </Button>
//       <Button onClick={markAllDone}> Mark all done </Button>
//     </div>
//   );
// }
