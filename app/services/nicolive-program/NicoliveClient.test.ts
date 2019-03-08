import * as fetchMock from 'fetch-mock';
const { NicoliveClient } = require('./NicoliveClient');

test('constructor', () => {
  const client = new NicoliveClient();
  expect(client).toBeInstanceOf(NicoliveClient);
});

// 実際には叩かないのでなんでもよい
const programID = 'lv1';
const communityID = 'co1';

const dummyBody = {
  meta: {
    status: 200,
    errorCode: 'OK',
  },
  data: 'dummy body',
};

interface Suite {
  name: string,
  method: string,
  base: string,
  path: string,
  args?: any[],
}
const suites: Suite[] = [
  {
    name: 'fetchProgramSchedules',
    base: NicoliveClient.live2BaseURL,
    method: 'get',
    path: '/unama/tool/v1/program_schedules',
  },
  {
    name: 'fetchProgram',
    method: 'get',
    base: NicoliveClient.live2BaseURL,
    path: `/watch/${programID}/programinfo`,
    args: [programID],
  },
  {
    name: 'startProgram',
    method: 'put',
    base: NicoliveClient.live2BaseURL,
    path: `/watch/${programID}/segment`,
    args: [programID],
  },
  {
    name: 'endProgram',
    method: 'put',
    base: NicoliveClient.live2BaseURL,
    path: `/watch/${programID}/segment`,
    args: [programID],
  },
  {
    name: 'extendProgram',
    method: 'post',
    base: NicoliveClient.live2BaseURL,
    path: `/watch/${programID}/extension`,
    args: [programID],
  },
  {
    name: 'sendOperatorComment',
    method: 'put',
    base: NicoliveClient.live2BaseURL,
    path: `/watch/${programID}/operator_comment`,
    args: [programID, { text: 'comment text', isPermanent: true }],
  },
  {
    name: 'fetchStatistics',
    method: 'get',
    base: NicoliveClient.live2BaseURL,
    path: `/watch/${programID}/statistics`,
    args: [programID],
  },
  {
    name: 'fetchNicoadStatistics',
    method: 'get',
    base: NicoliveClient.nicoadBaseURL,
    path: `/v1/live/statusarea/${programID}`,
    args: [programID],
  },
  {
    name: 'fetchCommunity',
    method: 'get',
    base: NicoliveClient.publicBaseURL,
    path: `/v1/communities.json?communityIds=${communityID}`,
    args: [communityID],
  },
];

describe('bodyがそのまま得られる', () => {
  afterEach(() => {
    fetchMock.reset();
  })
  suites.forEach((suite: Suite) => {
    test(suite.name, async () => {
      const client = new NicoliveClient();

      fetchMock[suite.method.toLowerCase()](suite.base + suite.path, dummyBody);
      const result = await client[suite.name](...(suite.args || []));

      expect(result).toEqual(dummyBody);
      expect(fetchMock.done()).toBe(true);
    });
  });
});

describe('JSONが壊れていたらrejectする', () => {
  afterEach(() => {
    fetchMock.reset();
  })
  suites.forEach((suite: Suite) => {
    test(suite.name, async () => {
      const client = new NicoliveClient();

      fetchMock[suite.method.toLowerCase()](suite.base + suite.path, 'invalid json');
      await expect(client[suite.name](...(suite.args || []))).rejects.toThrow('invalid json response body');

      expect(fetchMock.done()).toBe(true);
    });
  });
});

function setupMock() {
  class BrowserWindow {
    url: string = '';
    webContentsCallbacks: any[] = [];
    callbacks: any[] = [];

    webContents = {
      on: (_event: string, callback: (ev: any, url: string) => any) => {
        this.webContentsCallbacks.push(callback);
      }
    }
    on(event: string, callback: (evt: any) => any) {
      this.callbacks.push(callback);
    }
    loadURL(url: string) {
      this.url = url;
      for (const cb of this.webContentsCallbacks) {
        // 雑
        cb(null, url);
      }
    }
    close = jest.fn().mockImplementation(() => {
      for (const cb of this.callbacks) {
        // 雑
        cb(null);
      }
    });
    options: any;
    constructor(options: any) {
      this.options = options;
      wrapper.browserWindow = this;
    }
  }

  let wrapper: {
    browserWindow: BrowserWindow
  } = {
    browserWindow: null,
  };
  jest.doMock('electron', () => ({
    remote: {
      BrowserWindow
    }
  }));

  return wrapper;
}

describe('webviews', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('createProgramで番組ページへ遷移すると番組を作成したことになる', async () => {
    const mock = setupMock();

    const { NicoliveClient } = require('./NicoliveClient');
    const client = new NicoliveClient();

    // don't await
    const result = expect(client.createProgram()).resolves.toBe('CREATED');
    mock.browserWindow.loadURL(`https://live2.nicovideo.jp/watch/${programID}`);

    await result;
    expect(mock.browserWindow.close).toHaveBeenCalled();
  });

  test('createProgramでマイページに遷移すると番組を予約したことになる', async () => {
    const mock = setupMock();

    const { NicoliveClient } = require('./NicoliveClient');
    const client = new NicoliveClient();

    // don't await
    const result = expect(client.createProgram()).resolves.toBe('RESERVED');
    mock.browserWindow.loadURL('https://live.nicovideo.jp/my');

    await result;
    expect(mock.browserWindow.close).toHaveBeenCalled();
  });

  test('createProgramでニコ生外に出ると画面を閉じる', async () => {
    const mock = setupMock();

    const { NicoliveClient } = require('./NicoliveClient');
    const client = new NicoliveClient();

    // don't await
    const result = expect(client.createProgram()).resolves.toBe('OTHER');
    mock.browserWindow.loadURL('https://example.com');

    await result;
    expect(mock.browserWindow.close).toHaveBeenCalled();
  });

  test('createProgramで何もせず画面を閉じても結果が返る', async () => {
    const mock = setupMock();

    const { NicoliveClient } = require('./NicoliveClient');
    const client = new NicoliveClient();

    // don't await
    const result = expect(client.createProgram()).resolves.toBe('OTHER');
    mock.browserWindow.close();

    await result;
    expect(mock.browserWindow.close).toHaveBeenCalled();
  });

  test('editProgramで番組ページへ遷移すると番組を作成したことになる', async () => {
    const mock = setupMock();

    const { NicoliveClient } = require('./NicoliveClient');
    const client = new NicoliveClient();

    // don't await
    const result = expect(client.editProgram(programID)).resolves.toBe('EDITED');
    mock.browserWindow.loadURL(`https://live2.nicovideo.jp/watch/${programID}`);

    await result;
    expect(mock.browserWindow.close).toHaveBeenCalled();
  });

  test('editProgramでマイページに遷移すると番組を予約したことになる', async () => {
    const mock = setupMock();

    const { NicoliveClient } = require('./NicoliveClient');
    const client = new NicoliveClient();

    // don't await
    const result = expect(client.editProgram(programID)).resolves.toBe('EDITED');
    mock.browserWindow.loadURL('https://live.nicovideo.jp/my');

    await result;
    expect(mock.browserWindow.close).toHaveBeenCalled();
  });

  test('editProgramでニコ生外に出ると画面を閉じる', async () => {
    const mock = setupMock();

    const { NicoliveClient } = require('./NicoliveClient');
    const client = new NicoliveClient();

    // don't await
    const result = expect(client.editProgram(programID)).resolves.toBe('OTHER');
    mock.browserWindow.loadURL('https://example.com');

    await result;
    expect(mock.browserWindow.close).toHaveBeenCalled();
  });

  test('editProgramで何もせず画面を閉じても結果が返る', async () => {
    const mock = setupMock();

    const { NicoliveClient } = require('./NicoliveClient');
    const client = new NicoliveClient();

    // don't await
    const result = expect(client.editProgram(programID)).resolves.toBe('OTHER');
    mock.browserWindow.close();

    await result;
    expect(mock.browserWindow.close).toHaveBeenCalled();
  });
});
