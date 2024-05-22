import { Observable } from 'rxjs';

// Jest 28 で追加された jest.fn の型引数を模倣する
export function jest_fn<T extends (...args: any[]) => any>(): jest.Mock<
  ReturnType<T>,
  Parameters<T>
> {
  return jest.fn<ReturnType<T>, Parameters<T>>();
}

export type ObserveType<T extends Observable<any>> = T extends Observable<infer U> ? U : never;
