# slobs-client
Electron client for the Streamlabs OBS streaming software.

## Dependencies

### Node OBS

Due to OBS containing files named `package.json`, it is not
currently possible to install `node-obs` via NPM. You will
need to install and compile it manually, and then symlink it
in the root of this directory: `./node-obs`.

Node OBS can be found here:
https://github.com/twitchalerts/node-obs

### Yarn

In order to ensure you are using the correct version of each
node module, you should use the yarn package manager. On OS X
you can install yarn via homebrew:

```
brew update
brew install yarn
```

For other platforms, check the yarn docs:
https://yarnpkg.com/en/docs/install

## Installation

First, install all node modules via yarn:

```
yarn
```

Then, rebuild native extensions for electron:

```
yarn run rebuild
```

Finally, compile assets with webpack:

```
yarn run compile
```

## Starting

You can run the app with:

```
yarn start
```

## Streaming

The default config will stream to:
https://www.twitch.tv/slobstest
