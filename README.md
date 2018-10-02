# Streamlabs OBS

[![Build status](https://ci.appveyor.com/api/projects/status/xxn8immagev9o1fd/branch/staging?svg=true)](https://ci.appveyor.com/project/Streamlabs/streamlabs-obs)

Simple, powerful, and efficient live streaming software built on Electron and OBS.

![Streamlabs OBS](https://cdn.streamlabs.com/slobs/slobs-chatbox.png)

This application currently only supports 64-bit Windows.

## Dependencies

### Node.js

Node is required for installing npm packages and for running
various scripts.  We recommend the current LTS release, 8.x.x:

https://nodejs.org

### Yarn

In order to ensure you are using the correct version of each
node module, you should use the yarn package manager.
Installation instructions can be found here:

https://yarnpkg.com/en/docs/install

### Visual C++ Compiler

Yarn will install and compile a number of native extensions from
source.  For yarn to do this, it needs a Visual C++ compiler.  The
most reliable way to get this is to install:

Visual Studio Community 2015 with Update 3

Make sure you do a custom installation and select Visual C++ from
the languages section.

### CMake

Some of our native addons require CMake for compilation.  You can
download it here:

https://cmake.org/download/

Make sure to add CMake to your path. You may have to restart your
machine before CMake is available.

### Python 2.7

Node-gyp requires python 2.7 available in your path to install some
native addons.  You can download it here:

https://www.python.org/

## Installation

Install all node modules via yarn:

```
yarn install
```

Then, compile assets with webpack:

```
yarn compile
```

## Starting

If you are using Visual Studio Code, you can start the app
using the built in debugger (default F5).

Otherwise, you can run the app with:

```
yarn start
```

## Environment Variables

These variables can be used in development to force certain behavior.

`SLOBS_FORCE_AUTO_UPDATE`: Force the auto-updater to run in development. Normally
this would only run in production.

`SLOBS_CACHE_DIR`: Force a different location for the user data cache directory.

`SLOBS_DISABLE_MAIN_LOGGING`: Disable javascript logging in the main process.

`SLOBS_REPORT_TO_SENTRY`: Report errors to sentry in the dev environment

## Packaging / Distributing

Currently only Windows x64 packaging is supported.

### Prerequesites

The packager will use whatever version of node-obs you have
checked out in the slobs directory (at `./node-obs`).  You
should make sure that node-obs is compiled correctly with 32-bit
and 64-bit plugins, and works properly with the currently checked
out version of `streamlabs-obs`.  If you're releasing, that should
probably be the `master` branch.  You should probably try running
the app from your dev environment to make sure everything is
working before you start the release process.

### Packaging

Make sure the app is not running in your dev environment
before you start the packaging process.

You can package the app by running:

```
yarn package
```

This will package a distributable installer `.exe` to the `dist/`
directory.  There is also an unpacked version in `dist/win-unpacked`.

### Releasing

If you want to release a new version to the update server, you will need
the following variables in your environment:

```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
CSC_LINK
CSC_KEY_PASSWORD
SENTRY_AUTH_TOKEN
```

Only authorized team members have permission to release new versions.
If you need help setting up your environment for release, you can ask
someone on the team for help.

If your environment is properly set up, you can use the automated
release script to push out a new release.

Simply run:

```
yarn release
```

and follow the instructions.

### Legacy Release Checklist

NOTE: This checklist is deprecated, and is only kept here in case
the automated deploy script isn't working and we need to do a
manual deploy.

- [ ] Merge `staging` into `master` - DO NOT "Squash & Merge", just do a regular merge
- [ ] Check out `master`
- [ ] If submodules are out of date `git submodule update --init --recursive`
- [ ] Remove node modules `rm -rf node_modules`
- [ ] Install fresh packages `yarn install`
- [ ] Install node-obs with latest plugins `yarn install-node-obs`
- [ ] Compile assets `yarn compile`
- [ ] Run the test suite `yarn test`
- [ ] Change the version in `package.json`
- [ ] Commit and push
- [ ] Tag the repo `git tag 'v0.0.11'` and `git push --tags`
- [ ] Package the app `yarn package`
- [ ] Run the packaged version in `dist/win-unpacked` and make sure it runs
- [ ] Deploy the new version `yarn deploy`
- [ ] Merge master back into staging

## ❤ OBS Developers

At its core, Streamlabs OBS is powered by the [OBS](https://obsproject.com/)
engine.  We want to thank all of the developers over at the OBS project for
their years of tireless hard work, without which Streamlabs OBS wouldn't exist today.
