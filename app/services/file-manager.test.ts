import test from 'ava';
import * as Proxyquire from 'proxyquire';

function identity<T>(x: T): T {
  return x;
}

test('get instance', t => {
  const m = Proxyquire.noCallThru()('./file-manager', {
    'path': {
      resolve: identity
    },
    'fs': {},
    './utils': {}
  });
  t.truthy(m.FileManagerService.instance);
});
