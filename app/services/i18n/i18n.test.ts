import test from 'ava';
import * as Proxyquire from 'proxyquire';

function noopDecorator() {
  return function() {};
}

function identity<T>(x: T): T {
  return x;
}

test('get instance', t => {
  require('../stateful-service')
    .StatefulService
    .setupVuexStore({ watch: identity });

  const m = Proxyquire.noCallThru()('./i18n', {
    'services/stateful-service': {
      mutation: noopDecorator,
      '@noCallThru': false
    },
    '../../util/injector': {
      Inject: noopDecorator
    },
    '../../../obs-api': {
      Global: {}
    },
    'services/app': {
      AppService: {}
    }
  });
  t.truthy(m.I18nService.instance);
});
