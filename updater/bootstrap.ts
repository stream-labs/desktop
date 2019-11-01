/**
 * Updater bootstrap:
 * Determines if the user should receive an update, and if so,
 * spawns the updater and shuts down the application. In most
 * error situations, the application will start up normally.
 */

import * as util from 'util';
import * as path from 'path';
import * as tasklist from 'tasklist';
import * as fs from 'fs';
import * as request from 'request';
import * as cp from 'child_process';
import * as semver from 'semver';
import * as log from 'electron-log';
import * as crypto from 'crypto';

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const mkdir = util.promisify(fs.mkdir);

/**
 * Use our own promisify for request, has better typings
 */
const prequest = (info: request.UriOptions & request.CoreOptions) => {
  return new Promise<request.Response>((resolve, reject) => {
    request(info, (err, response) => {
      if (err) {
        reject(err);
      } else {
        resolve(response);
      }
    });
  });
};

/**
 * The main process provides this to the bootstrap module. It describes
 * the state of the current version, as well as how, where from, and to
 * where we should update.
 */
interface IUpdateInfo {
  baseUrl: string;
  version: string;
  exec: string[];
  cwd: string;
  waitPids: number[];
  appDir: string;
  tempDir: string;
  cacheDir: string;
  versionFileName: string;
}

/**
 * This describes the shape of a channel file (i.e. latest.json) living
 * on our update CDN.
 */
interface ILatestVersionInfo {
  /**
   * The latest available version
   */
  version: string;

  /**
   * A random string chosen at release time that is added to the
   * update id before hashing into a release bucket to ensure we
   * rollout to a different sample of people with each release.
   */
  seed: string;

  /**
   * Determines the percentage of users this release is rolled out to
   */
  rollout: {
    /**
     * The default rollout percentage used when deciding whether to update
     */
    default: number;

    /**
     * A version-specific override that allows us to target this release at
     * people running a specific version.
     */
    [version: string]: number;
  };
}

/**
 * Generates a relatively small and uniform numeric hash of a string
 *
 * Inspired by MIT licensed: https://github.com/segment-boneyard/hash-mod
 * @param str The string to hash
 */
function hashToInt(str: string) {
  return str.split('').reduce((hash, char) => {
    return (hash * 31 * char.charCodeAt(0)) % 982451653;
  }, 7);
}

/**
 * The update id is a randomly chosen persistent id that is used
 * when determining whether a user should receive an update.
 */
async function getUpdateId(info: IUpdateInfo): Promise<string> {
  const updateIdPath = path.join(info.cacheDir, 'updateId');
  let updateId: string;

  try {
    updateId = (await readFile(updateIdPath)).toString();
  } catch (e) {
    log.info('Error reading update id. Assigning a new random update id.');

    updateId = crypto.randomBytes(8).toString('hex');

    await writeFile(updateIdPath, updateId);
  }

  log.info('Update id is', updateId);

  return updateId;
}

async function isInRolloutGroup(info: IUpdateInfo, latestVersion: ILatestVersionInfo) {
  const updateId = await getUpdateId(info);

  // Useful for debugging. This update id will always induce
  // an update regardless of rollout or seed.
  if (updateId === 'updateplz') {
    log.info('Detected update id short circuit code.');
    return true;
  }

  // Combine the update id with the seed from the server and hash into 1 of 100 buckets
  const bucket = hashToInt(`${updateId}${latestVersion.seed}`) % 100;

  log.info(`Assigned update group: ${updateId} + ${latestVersion.seed} => ${bucket}`);

  // Use version-specific rollout but fall back to default rollout
  const rollout =
    latestVersion.rollout[info.version] != null
      ? latestVersion.rollout[info.version]
      : latestVersion.rollout.default;

  log.info(`Current rollout for ${info.version} is ${rollout}%`);

  return bucket < rollout;
}

async function isUpdaterRunning(updaterPath: string, updaterName: string) {
  let updaterRunning = false;

  if (!fs.existsSync(updaterPath)) {
    return updaterRunning;
  }

  const processes = await tasklist();

  for (const processItem in processes) {
    if (processes[processItem].imageName === updaterName) {
      log.info(
        `Detected running updater process ${processes[processItem].imageName} - PID: ${
          processes[processItem].pid
        }`,
      );

      try {
        fs.unlinkSync(updaterPath);
      } catch (e) {
        updaterRunning = true;
      }
    }
  }

  return updaterRunning;
}

async function fetchUpdater(info: IUpdateInfo): Promise<string | null> {
  /**
   * latest-updater.exe is always the latest most stable version of the
   * updater on our update CDN.
   */
  let updaterName = 'latest-updater.exe';

  if (process.env.SLOBS_PREVIEW) {
    updaterName = 'preview-updater.exe';
  }

  const reqInfo = {
    baseUrl: info.baseUrl,
    uri: `/${updaterName}`,
  };
  const updaterPath = path.resolve(info.tempDir, updaterName);
  if (await isUpdaterRunning(updaterPath, updaterName)) {
    log.info('Updater is already running, aborting fetch.');
    return null;
  }

  const outStream = fs.createWriteStream(updaterPath);

  return new Promise((resolve, reject) => {
    const outPipe = request(reqInfo)
      .on('response', response => {
        if (response.statusCode !== 200) {
          reject(`Failed to fetch updater: status ${response.statusCode}`);
        }
      })
      .pipe(outStream);

    outPipe.on('close', () => {
      resolve(updaterPath);
    });

    outPipe.on('error', error => {
      reject(error);
    });
  });
}

async function getLatestVersionInfo(info: IUpdateInfo): Promise<ILatestVersionInfo | null> {
  const reqInfo = {
    baseUrl: info.baseUrl,
    uri: `/${info.versionFileName}`,
    json: true,
  };

  const response = await prequest(reqInfo);

  if (response.statusCode !== 200) {
    log.info(`Failed to fetch version information ` + `- ${response.statusCode}`);

    return null;
  }

  return response.body;
}

async function shouldUpdate(latestVersion: ILatestVersionInfo, info: IUpdateInfo) {
  if (!latestVersion) {
    log.info('Failed to fetch latest version.');
    return false;
  }

  if (semver.eq(info.version, latestVersion.version)) {
    log.info('Already latest version.');
    return false;
  }

  if (semver.gt(info.version, latestVersion.version)) {
    // Rollbacks are not currently supported
    log.info('Latest version is less than current version. Update will not be applied.');
    return false;
  }

  if (!(await isInRolloutGroup(info, latestVersion))) {
    log.info('User is not in rollout group. Update will not be applied.');
    return false;
  }

  return true;
}

/**
 * Determines if an update is required and sets up and spawns
 * the update. Returns a boolean indicating whether the app
 * should exit or continue with its startup procedure.
 */
async function entry(info: IUpdateInfo) {
  log.info('Starting update check:', info);

  const latestVersion = await getLatestVersionInfo(info);

  if (!latestVersion) {
    log.info('Aborting update to due failure fetching latest version information.');
    return false;
  }

  if (!(await shouldUpdate(latestVersion, info))) return false;

  /* App directory is required to be present!
   * The temporary directory may not exist though. */
  await mkdir(info.tempDir, { recursive: true });

  const updaterPath = await fetchUpdater(info);

  if (!updaterPath) {
    log.info('Aborting update due to updater already running.');
    return true;
  }

  /* Node, for whatever reason, decided that when you execute via
   * shell, all arguments shouldn't be quoted... it still does
   * spacing for us I guess */
  const updaterArgs = [
    '--base-url',
    `"${info.baseUrl}"`,
    '--version',
    `"${latestVersion.version}"`,
    '--exec',
    `"${info.exec}"`,
    '--cwd',
    `"${info.cwd}"`,
    '--app-dir',
    `"${info.appDir}"`,
    '--force-temp',
  ];

  info.waitPids.forEach(pid => {
    updaterArgs.push('-p');
    updaterArgs.push(pid.toString());
  });

  const updaterStartCommand = `start "" "${updaterPath}"`;

  log.info('Spawning updater with args:', updaterArgs);

  const updaterProcess = cp.spawn(updaterStartCommand, updaterArgs, {
    cwd: info.tempDir,
    detached: true,
    shell: true,
  });

  log.info(`Spawning updater - PID: ${updaterProcess.pid}`);

  const returnCode = await new Promise<number>(resolve => {
    updaterProcess.on('exit', resolve);
    updaterProcess.on('error', resolve);
  });

  log.info(`Updater spawn result: ${returnCode}`);

  // Allow SLOBS to exit whil the updater keeps running
  updaterProcess.unref();

  return returnCode.toString() === '0';
}

module.exports = (info: IUpdateInfo, startApp: () => void, exit: () => void) => {
  return entry(info)
    .then(shouldExit => {
      if (shouldExit) {
        log.info('Closing for update...');
        exit();
      } else {
        log.info('App will start without updating.');
        startApp();
      }
    })
    .catch(error => {
      log.info(error);
      startApp();
    });
};
