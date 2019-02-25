/* This is our updater bootstrap.
 * It has four goals in sequence:
 *  1. Check version.
 *  2. Download updater if new version is found.
 *  3. Run updater.
 *  4. Close application.
 *
 * Any complicated logic wanting to be placed in here needs
 * to be thoroughly thought about before doing so as any
 * mistakes here will require the user download a full
 * installer to have a fix put in place. In addition,
 * anything added to the updater that further complicates
 * its runtime requirements should be looked down upon. It's
 * designed to be small and mostly standalone. */
const util = require('util');
const path = require('path');
const fs = require('fs');
const request = require('request');
const zlib = require('zlib');
const cp = require('child_process');
const semver = require('semver');
const { BrowserWindow } = require('electron');
const log = require('electron-log');
const prequest = util.promisify(request);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const mkdir = util.promisify(fs.mkdir);

/* The user needs a visual queue to know there's
 * nothing wrong with the application. So we use
 * the currently distributed version of Electron
 * to bring up a small status window that indicates
 * the status of the bootstrap. That said, if
 * anything goes wrong, just don't spawn a window
 * for safety. */
let statusWindow = null;

function destroyStatusWindow() {
    if (statusWindow) {
        statusWindow.close();
        statusWindow = null;
    }
}

async function mkdirMaybe(directory) {
    try {
        await mkdir(directory);
    } catch (error) {
        if (error.code !== 'EEXIST')
            throw error;
    }
}

async function ensureDir(dirPath) {
    const directories = dirPath.split(path.sep);

    let directory = directories[0];

    for (let i = 1; i < directories.length; ++i) {
        directory += path.sep + directories[i];
        await mkdirMaybe(directory);
    }
}

async function getPreviousRoll(cacheFile, version) {
    return new Promise((resolve, reject) => {
        fs.readFile(cacheFile, 'utf8', (err, data) => {
            if (err) {
                log.info("Roll cache not found!");
                resolve(0);
                return;
            }

            let roll = parseInt(data.toString(), 10);

            if (!roll) {
                roll = 0;
            }

            resolve(roll);
        });
    });
}

async function checkChance(info, version) {
    const reqInfo = {
        baseUrl: info.baseUrl,
        uri: `/${version}.chance`,
    };

    const response = await prequest(reqInfo);

    if (response.statusCode !== 200) {
        log.info(`No chance file found! Assuming 100...`);
        return true;
    }

    const rollCache = path.join(info.cacheDir, 'rolls', version);
    const body = JSON.parse(response.body);
    const chance = body.chance;

    log.info(`Chance to update is ${chance}...`);

    /* Check for a cached roll. Caching the roll prevents incorrect
     * chance in the case we change the percentage chance to update. */
     let roll = await getPreviousRoll(rollCache, version);

    /* The above can return 0. Remember that 0 is an invalid roll meaning
     * it either doesn't exist or something went wrong. */

    /* Our D100 roll, 1 - 100
     * Math.random() gives 0.0 through 0.9999 repeating.
     * Multiply that by 100 to get a number between 0.0 and 99.9999 repeating.
     * Truncate that to make an integer to get between 0 and 99.
     * Add 1 so our result is between 1 and 100. */
    if (roll === 0) {
        roll = Math.trunc(Math.random() * 100) + 1;

        /* Even if we don't need to, just cache the roll,
         * it helps simplify the logic */
        await ensureDir(path.dirname(rollCache));
        await writeFile(rollCache, `${roll}`);
    }

    log.info(`You rolled ${roll}`);

    return roll <= chance;
}

/* Note that latest-updater.exe never changes
 * in name regardless of what version of the
 * application we're using. The base url should
 * always have an endpoint of `/latest-updater.exe`
 * that points to the updater executable or at
 * least redirects to it. Except for a preview version 
 * where preview-updater.exe name will be used */
async function fetchUpdater(info, progress) {
    let updater_name = 'latest-updater.exe';
    if(process.env.SLOBS_PREVIEW) {
        updater_name = 'preview-updater.exe';
    }
    const reqInfo = {
        baseUrl: info.baseUrl,
        uri: `/${updater_name}`
    };

    const updaterPath = path.resolve(info.tempDir, updater_name);
    const outStream = fs.createWriteStream(updaterPath);

    /* It's more convenient to use the piping functionality of
     * native request than using a promise here. */
    const handleResponse = (response, reject) => {
        if (response.statusCode !== 200) {
            reject(`Failed to fetch updater: status ${response.statusCode}`);
            return;
        }

        const contentLength = response.headers['content-length'];
        let accum = 0;

        response.on('data', (chunk) => {
            if (!contentLength) return;
            accum += chunk.length;
            progress((accum / contentLength) * 100);
        });
    };

    return new Promise((resolve, reject) => {
        const outPipe = request(reqInfo)
            .on('response', (response) => handleResponse(response, reject))
            .pipe(outStream);

        outPipe.on('close', () => {
            resolve(updaterPath);
        });

        outPipe.on('error', (error) => {
            reject(error);
        });
    });
}

async function getVersion(info) {
    const reqInfo = {
        baseUrl: info.baseUrl,
        uri: `/${info.versionFileName}`,
        json: true
    };

    let response = await prequest(reqInfo);

    if (response.statusCode !== 200) {
        log.info(
            `Failed to fetch version information ` +
            `- ${response.statusCode}`
        );

        return null;
    }

    return response.body.version;
}

/* Note that we return true when we fail to fetch
 * version correctly! This is to make sure we don't
 * bork the user due to update error. It's better to
 * let the user use an out of date application than
 * not to use it at all in this case. Only in the
 * case that we correctly fetch version and know that
 * we're out of date should we actually tell the app
 * to close so we can update. */
async function entry(info) {
    try {
        statusWindow = new BrowserWindow({
            width: 400,
            height: 180,
            frame: false,
            resizable: false,
            show: false
        });

        statusWindow.on('closed', () => {
            statusWindow = null;
        });

        /* 20 minutes in documentation and I still can't
         * tell if this does what I'm wanting */
        statusWindow.webContents.on('destroyed', () => {
            statusWindow = null;
        });

        statusWindow.on('ready-to-show', () => {
            statusWindow.show();
        });

        statusWindow.loadURL('file://' + __dirname + '/index.html');
    } catch (error) {
        log.info('Error when spawning status window!');
        if (statusWindow) statusWindow.close();
        statusWindow = null;
    }

    const latestVersion = await getVersion(info);

    /* Latest version need to be greater than the current version! */
    if (!latestVersion) {
        log.info('Failed to fetch latest version!');
        return false;
    }

    if (semver.eq(info.version, latestVersion)) {
        log.info('Already latest version!');
        return false;
    }

    if (semver.gt(info.version, latestVersion)) {
        log.info('Latest version is less than current version!');
        return false;
    }

    if (!await checkChance(info, latestVersion)) {
        log.info('Failed the chance lottery. Better luck next time!');
        return false;
    }

    /* App directory is required to be present!
     * The temporary directory may not exist though. */
    await ensureDir(info.tempDir);

    /* We're not what latest specifies. Download
    * updater, generate updater config, start the
    * updater, and tell application to finish. */
    const updaterPath = await fetchUpdater(info, progress => {});

    /* Node, for whatever reason, decided that when you execute via
     * shell, all arguments shouldn't be quoted... it still does
     * spacing for us I guess */
    const updaterArgs = [
        '--base-url', `"${info.baseUrl}"`,
        '--version', `"${latestVersion}"`,
        '--exec', `"${info.exec}"`,
        '--cwd', `"${info.cwd}"`,
        '--app-dir', `"${info.appDir}"`,
        '--force-temp'
    ];

    info.waitPids.forEach((pid) => {
        updaterArgs.push('-p');
        updaterArgs.push(pid);
    });

    if (statusWindow) {
        updaterArgs.push('-p');
        updaterArgs.push(statusWindow.webContents.getOSProcessId().toString());
    }

    const updaterStartCommand = `start \"\"  \"${updaterPath}\" `

    log.info(updaterArgs);

    const update_spawned = cp.spawn(`${updaterStartCommand}`, updaterArgs, {
        cwd: info.tempDir,
        detached: false,
        shell: true
    });

    log.info('updater process ' + `pid ${update_spawned.pid}`);

    //make promises for app exit , error , data and some timeout
    const primiseExit = new Promise(resolve => {
        update_spawned.on('exit', resolve);
    });

    const primiseError = new Promise(resolve => {
        update_spawned.on('error', resolve);
    });

    //wait for something to happen
    const promise = await Promise.race([primiseError, primiseExit]);
    log.info('Updater spawn promise ' + `result \"${promise}\"`);

    update_spawned.unref();

    return `${promise}` === "0";
}

module.exports = async (info) => {
    return entry(info).then(status => {
        destroyStatusWindow();
        return Promise.resolve(status);
    }).catch((error) => {
        log.info(error);
        destroyStatusWindow();
        return Promise.resolve(false);
    });
};
