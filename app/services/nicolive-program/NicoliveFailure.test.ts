type NicoliveFailureType = typeof import('./NicoliveFailure').NicoliveFailure;

afterEach(() => {
  jest.resetModules();
});

test('4xxで未定義文言だったら400にフォールバックする', async () => {
  const showMessageBox = jest.fn().mockImplementation((_window, _option, callback) => {
    callback();
  });
  jest.doMock('electron', () => ({
    remote: {
      dialog: {
        showMessageBox,
      },
      getCurrentWindow: () => {},
    },
  }));
  jest.doMock('./NicoliveClient', () => ({ NotLoggedInError: class {} }));
  jest.doMock('services/i18n', () => ({
    $t: jest.fn().mockImplementation((key, { fallback } = {}) => {
      const keys = key.split('.');
      const code = keys[keys.length - 2];
      const value = keys[keys.length - 1];
      if (code === '400') return value;
      return fallback;
    }),
  }));

  const m = require('./NicoliveFailure');
  const NicoliveFailure = m.NicoliveFailure as NicoliveFailureType;
  const openErrorDialogFromFailure = m.openErrorDialogFromFailure;
  const failure = NicoliveFailure.fromClientError('method', {
    ok: false,
    value: { meta: { status: 403 } },
  });

  await openErrorDialogFromFailure(failure);
  expect(showMessageBox.mock.calls[0][1].title).toBe('title');
  expect(showMessageBox.mock.calls[0][1].message).toBe('message');
});

test('5xxで未定義文言だったら500にフォールバックする', async () => {
  const showMessageBox = jest.fn().mockImplementation((_window, _option, callback) => {
    callback();
  });
  jest.doMock('electron', () => ({
    remote: {
      dialog: {
        showMessageBox,
      },
      getCurrentWindow: () => {},
    },
  }));
  jest.doMock('services/i18n', () => ({
    $t: jest.fn().mockImplementation((key, { fallback } = {}) => {
      const keys = key.split('.');
      const code = keys[keys.length - 2];
      const value = keys[keys.length - 1];
      if (code === '500') return value;
      return fallback;
    }),
  }));

  const m = require('./NicoliveFailure');
  const NicoliveFailure = m.NicoliveFailure as NicoliveFailureType;
  const openErrorDialogFromFailure = m.openErrorDialogFromFailure;
  const failure = NicoliveFailure.fromClientError('method', {
    ok: false,
    value: { meta: { status: 503 } },
  });

  await openErrorDialogFromFailure(failure);
  expect(showMessageBox.mock.calls[0][1].title).toBe('title');
  expect(showMessageBox.mock.calls[0][1].message).toBe('message');
});
