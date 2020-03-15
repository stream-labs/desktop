// the list of libraries that takes > 50ms to be imported
// don't use static import for these libs to avoid longer startup time

export function importAwsSdk() {
  return import('aws-sdk');
}

export function importExtractZip() {
  return import('extract-zip');
}

export function importArchiver() {
  return import('archiver');
}

export function importSocketIOClient() {
  return import('socket.io-client');
}

export function importRimraf() {
  return import('rimraf');
}

export function importBeaker() {
  return import('streamlabs-beaker');
}
