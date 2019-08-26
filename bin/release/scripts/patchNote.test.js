const { parseVersionTag, validateVersionContext, generateNewVersion } = require('./patchNote');

const fixtures = {
  public: {
    stable: 'v1.0.20190826-2',
    unstable: 'v1.0.20190826-unstable.2',
  },
  internal: {
    stable: 'v1.0.20190826-2d',
    unstable: 'v1.0.20190826-unstable.2d',
  },
};
const TODAY = new Date('2019-08-26');
const TOMORROW = new Date('2019-08-27');

function* channelEnvironmentSets() {
  for (const releaseEnvironment of ['public', 'internal']) {
    for (const releaseChannel of ['stable', 'unstable']) {
      yield {
        releaseChannel,
        releaseEnvironment,
      };
    }
  }
}

for (const fixtureSet of channelEnvironmentSets()) {
  const versionTag = fixtures[fixtureSet.releaseEnvironment][fixtureSet.releaseChannel];

  describe(`${fixtureSet.releaseEnvironment}向け${fixtureSet.releaseChannel}リリースのタグ`, () => {
    for (const set of channelEnvironmentSets()) {
      if (
        fixtureSet.releaseChannel === set.releaseChannel &&
        fixtureSet.releaseEnvironment === set.releaseEnvironment
      ) {
        test('条件が一致していればthrowしない', () => {
          expect(() => validateVersionContext({ ...set, versionTag })).not.toThrow();
        });
      } else {
        test(`不一致ならthrowする（${set.releaseEnvironment}向け${set.releaseChannel}リリース扱い）`, () => {
          expect(() => validateVersionContext({ ...set, versionTag })).toThrow();
        });
      }
    }
  });
}

test('stableチャンネルの場合はバージョン中のチャンネル部分があったらエラー', () => {
  expect(() => validateVersionContext({
    versionTag: 'v1.0.20190826-stable.2',
    releaseChannel: 'stable',
    releaseEnvironment: 'public'
  })).toThrow();
});

test('バージョンがパースできる(public stable)', () => {
  expect(parseVersionTag(fixtures.public.stable)).toMatchInlineSnapshot(`
        Object {
          "channel": undefined,
          "date": "20190826",
          "internalMark": undefined,
          "major": "1",
          "minor": "0",
          "ord": "2",
        }
    `);
});
test('バージョンがパースできる(public unstable)', () => {
  expect(parseVersionTag(fixtures.public.unstable)).toMatchInlineSnapshot(`
        Object {
          "channel": "unstable",
          "date": "20190826",
          "internalMark": undefined,
          "major": "1",
          "minor": "0",
          "ord": "2",
        }
    `);
});
test('バージョンがパースできる(internal stable)', () => {
  expect(parseVersionTag(fixtures.internal.stable)).toMatchInlineSnapshot(`
        Object {
          "channel": undefined,
          "date": "20190826",
          "internalMark": "d",
          "major": "1",
          "minor": "0",
          "ord": "2",
        }
    `);
});
test('バージョンがパースできる(internal unstable)', () => {
  expect(parseVersionTag(fixtures.internal.unstable)).toMatchInlineSnapshot(`
        Object {
          "channel": "unstable",
          "date": "20190826",
          "internalMark": "d",
          "major": "1",
          "minor": "0",
          "ord": "2",
        }
    `);
});

test('次のバージョンを生成する(当日、publicでstable)', () => {
  expect(generateNewVersion({ previousTag: fixtures.public.stable, now: TODAY })).toMatchInlineSnapshot(
    `"1.0.20190826-3"`
  );
});
test('次のバージョンを生成する(当日、publicでunstable)', () => {
  expect(generateNewVersion({ previousTag: fixtures.public.unstable, now: TODAY })).toMatchInlineSnapshot(
    `"1.0.20190826-unstable.3"`
  );
});
test('次のバージョンを生成する(当日、internalでstable)', () => {
  expect(generateNewVersion({ previousTag: fixtures.internal.stable, now: TODAY })).toMatchInlineSnapshot(
    `"1.0.20190826-3d"`
  );
});
test('次のバージョンを生成する(当日、internalでunstable)', () => {
  expect(generateNewVersion({ previousTag: fixtures.internal.unstable, now: TODAY })).toMatchInlineSnapshot(
    `"1.0.20190826-unstable.3d"`
  );
});

test('次のバージョンを生成する(別日、publicでstable)', () => {
  expect(generateNewVersion({ previousTag: fixtures.public.stable, now: TOMORROW })).toMatchInlineSnapshot(
    `"1.0.20190827-1"`
  );
});
test('次のバージョンを生成する(別日、publicでunstable)', () => {
  expect(generateNewVersion({ previousTag: fixtures.public.unstable, now: TOMORROW })).toMatchInlineSnapshot(
    `"1.0.20190827-unstable.1"`
  );
});
test('次のバージョンを生成する(別日、internalでstable)', () => {
  expect(generateNewVersion({ previousTag: fixtures.internal.stable, now: TOMORROW })).toMatchInlineSnapshot(
    `"1.0.20190827-1d"`
  );
});
test('次のバージョンを生成する(別日、internalでunstable)', () => {
  expect(generateNewVersion({ previousTag: fixtures.internal.unstable, now: TOMORROW })).toMatchInlineSnapshot(
    `"1.0.20190827-unstable.1d"`
  );
});
