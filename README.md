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

If you are using Visual Studio Code, you can start the app
using the built in debugger.

Otherwise, you can run the app with:

```
yarn start
```

## Streaming

The default config will stream to:
https://www.twitch.tv/slobstest

## Packaging / Distributing

Currently only Windows x64 packaging is supported.

### Prerequesites

The packager will use whatever version of node-obs you have
checked out in the slobs directory (at `./node-obs`).  You
should make sure that node-obs is compiled for Windows 64-bit,
and works properly with the currently checked out version of
`slobs-client`.  If you're releasing, that should probably be
the `master` branch.  You should probably try running the app
from your dev environment to make sure everything is working
before you start the release process.

### Bumping the Version

Before you release, you should bump the version.  This is done
manually (for now) by changing the version number in the `pakcage.json`.
Commit the changes to the `package.json`, tag the commit in the format
of `v0.0.1`, and push the commit to the origin.

### Running the Packager

Make sure the app is not running in your dev environment
before you start the packaging process.

The packager can be run with the following command:

```
yarn run package
```

This will build a zipped distributable version to the `dist/`
directory.  There is also an unzipped version in `dist/win-unpacked`.

### Distributing

Distributing is currently a manual process.  Take the zip
file in `dist/` and give to whoever via Slack or some other
file sharing service.
