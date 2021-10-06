import { Observable } from 'rxjs';
import { useEffect } from 'react';

export function useSubscription<T>(observable: Observable<T>, cb: (value: T) => unknown) {
  useEffect(() => {
    const subscription = observable.subscribe(cb);
    return () => subscription.unsubscribe();
  });
}
