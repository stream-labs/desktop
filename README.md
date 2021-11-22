# Streamlabs OBS

[![Build Status](https://dev.azure.com/streamlabs/Streamlabs%20OBS/_apis/build/status/stream-labs.streamlabs-obs?branchName=staging)](https://dev.azure.com/streamlabs/Streamlabs%20OBS/_build/latest?definitionId=1&branchName=staging)

Simple, powerful, and efficient live streaming software built on Electron and OBS.

![Streamlabs OBS](https://cdn.streamlabs.com/slobs/slobs-chatbox.png)

This application currently only supports OSX 10.14+ and 64-bit Windows.

## Dependencies

### Node.js

Node is required for installing npm packages and for running
various scripts. We recommend the latest LTS release.

https://nodejs.org

### Yarn

In order to ensure you are using the correct version of each
node module, you should use the yarn package manager.
Installation instructions can be found here:

https://yarnpkg.com/en/docs/install

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

### Packaging

Make sure the app is not running in your dev environment
before you start the packaging process.

You can package the app by running:

```
yarn package
```

This will package a distributable installer `.exe` to the `dist/`
directory. There is also an unpacked version in `dist/win-unpacked`.

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
engine. We want to thank all of the developers over at the OBS project for
their years of tireless hard work, without which Streamlabs OBS wouldn't exist today.
