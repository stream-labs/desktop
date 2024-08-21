import { useEffect, useReducer, useRef } from 'react';
import { RealmObject } from 'services/realm';

export function useRealmObject<T extends RealmObject>(obj: T) {
  const [_, forceUpdate] = useReducer(x => x + 1, 0);

  useEffect(() => {
    const listener = () => {
      forceUpdate();
    };

    obj.realmModel.addListener(listener);

    return () => {
      obj.realmModel.removeListener(listener);
    };
  }, [obj]);

  return obj;
}

export function useRealmObjectAdv<T extends RealmObject>(obj: T, selector: (obj: T) => any[]) {
  const [state, forceUpdate] = useReducer(x => x + 1, 0);
  const previousValues = useRef(selector(obj));

  useEffect(() => {
    const listener = () => {
      const newValues = selector(obj);

      if (!newValues.every((value, index) => value === previousValues.current[index])) {
        previousValues.current = newValues;
        forceUpdate();
      }
    };

    obj.realmModel.addListener(listener);

    return () => {
      obj.realmModel.removeListener(listener);
    };
  }, [obj, selector]);

  return obj;
}
