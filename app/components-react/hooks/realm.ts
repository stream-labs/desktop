import { useEffect, useReducer } from 'react';
import Realm from 'realm';

export function useRealmObject<T extends Realm.Object>(obj: T) {
  const [_, forceUpdate] = useReducer(x => x + 1, 0);

  useEffect(() => {
    const listener = () => {
      forceUpdate();
    };

    obj.addListener(listener);

    return () => {
      obj.removeListener(listener);
    };
  }, [obj]);

  return obj;
}
