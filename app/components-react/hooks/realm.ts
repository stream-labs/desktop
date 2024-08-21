import { useEffect, useReducer, useRef } from 'react';
import { RealmObject } from 'services/realm';
import { isEqual } from 'lodash';

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

      if (!isEqual(newValues, previousValues.current)) {
        previousValues.current = newValues;
        forceUpdate();
      }
    };

    obj.realmModel.addListener(listener);

    return () => {
      obj.realmModel.removeListener(listener);
    };
  }, [obj.realmModel, selector]);

  return obj;
}
