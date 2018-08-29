#!/bin/bash

BASEDIR=$(git rev-parse --show-cdup)

RELEASE=$(jq -r .version < ${BASEDIR}package.json)
echo Release: $RELEASE

sentry-cli releases files $RELEASE upload-sourcemaps ${BASEDIR}bundles/ || exit 1
sentry-cli releases new $RELEASE || exit 1

