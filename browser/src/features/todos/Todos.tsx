import { createContext, useMemo, useState } from 'react';
import { Row, Col, Card, Switch } from 'antd';
import { initStore, useController } from '@/store/Controller';

function TodosApp() {
  const [isGlobalAppVisible, setIsGlobalAppVisible] = useState(true);
  const [isLocalAppVisible, setIsLocalAppVisible] = useState(true);

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <h2> Singleton Controllers</h2>
          <p>
            Used when you want a global shared state across multiple components.
          </p>
          <Switch
            checked={isGlobalAppVisible}
            onChange={(val) => setIsGlobalAppVisible(val)}
          />
        </Col>
      </Row>
      {isGlobalAppVisible && (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={12}>
            <TodoApp />
          </Col>
          <Col span={12}>
            <TodoApp />
          </Col>
        </Row>
      )}

      {!isGlobalAppVisible && <center>The component is unmounted</center>}

      <Row style={{ marginTop: 32 }}>
        <Col span={24}>
          <h2> Local Controllers</h2>
          <p>
            Used when you need separate instances of the controller, each
            managing its own state, typically provided via React context.
          </p>
          <Switch
            checked={isLocalAppVisible}
            onChange={(val) => setIsLocalAppVisible(val)}
          />
        </Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {isLocalAppVisible && (
          <>
            <Col span={12}>
              <TodoAppWithLocalState />
            </Col>
            <Col span={12}>
              <TodoAppWithLocalState />
            </Col>
          </>
        )}
      </Row>

      {!isLocalAppVisible && <center>The component is unmounted</center>}
    </>
  );
}

class TodoAppController {
  static ctx = createContext<TodoAppController | null>(null);

  store = initStore({
                      asyncData: '',
                      todos: [
                        {
                          id: 1,
                          title: 'Buy groceries',
                          completed: false,
                        },
                        {
                          id: 2,
                          title: 'Finish project report',
                          completed: true,
                        },
                        {
                          id: 3,
                          title: 'Schedule dentist appointment',
                          completed: false,
                        },
                        {
                          id: 4,
                          title: 'Call mom',
                          completed: false,
                        },
                      ],
                    });

  init() {
    setTimeout(() => {
      // this.toggleTodo(4);
      this.store.setState((s) => {
        s.asyncData = 'Data loaded';
      });
    }, 2000);
  }

  toggleTodo(id: number) {
    this.store.setState((s) => {
      const todo = s.todos.find((t) => t.id === id)!;
      todo.completed = !todo.completed;
    });
  }

  addTodo(title: string) {
    this.store.setState((s) => {
      s.todos = [...s.todos, { id: Date.now(), title, completed: false }];
    });
  }
}

function TodoApp() {
  const { store } = useController(TodoAppController);
  const asyncData = store.useSelector((s) => s.asyncData);
  
  return (
    <Card>
      <h2>Todo List</h2>
      <TodoList />
      <ListStats />
      <TodoInput />
      {asyncData && <AsyncData />}
    </Card>
  );
}

function AsyncData() {
  const { store } = useController(TodoAppController);
  const asyncData = store.useSelector((s) => s.asyncData);
  
  return <p>{asyncData}</p>;
}

function TodoAppWithLocalState() {
  const controller = useMemo(() => new TodoAppController(), []);

  return (
    <TodoAppController.ctx.Provider value={controller}>
      <TodoApp />
    </TodoAppController.ctx.Provider>
  );
}

function ListStats() {
  const { store } = useController(TodoAppController);
  const todoCount = store.useSelector((s) => s.todos.length);
  const completedTodoCount = store.useSelector(
    (s) => s.todos.filter((todo) => todo.completed).length
  );

  return (
    <div>
      <p>Total Todos: {todoCount}</p>
      <p>Completed Todos: {completedTodoCount}</p>
    </div>
  );
}

function TodoList() {
  const { store, toggleTodo } = useController(TodoAppController);
  const todos = store.useSelector((s) => s.todos);

  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id} style={{ textAlign: 'left' }}>
          <label
            style={{
              textDecoration: todo.completed ? 'line-through' : 'none',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
              style={{ marginRight: '8px' }}
            />
            {todo.title}
          </label>
        </li>
      ))}
    </ul>
  );
}

function TodoInput() {
  const { addTodo } = useController(TodoAppController);
  const [newTodoTitle, setNewTodoTitle] = useState('');

  const handleAddTodo = () => {
    if (newTodoTitle.trim()) {
      addTodo(newTodoTitle.trim());
      setNewTodoTitle('');
    }
  };

  return (
    <div>
      <input
        type="text"
        value={newTodoTitle}
        onChange={(e) => setNewTodoTitle(e.target.value)}
        placeholder="Add new todo"
      />
      <button onClick={handleAddTodo}>Add Todo</button>
    </div>
  );
}

export default TodosApp;
