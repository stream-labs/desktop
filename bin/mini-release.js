/*
 * All-in-one interactive N Air release script.
 */

const fs = require('fs');
const path = require('path');

let sh;
let moment;
let inq;
let colors;
let ProgressBar;
let yml;

try {
    sh = require('shelljs');
    moment = require('moment');
    inq = require('inquirer');
    colors = require('colors/safe');
    ProgressBar = require('progress');
    yml = require('js-yaml');
} catch (e) {
    if (e.message.startsWith('Cannot find module')) {
        throw new Error(`先に\`yarn install\`を実行する必要があります: ${e.message}`);
    }
    throw e;
}

/**
 * CONFIGURATION
 */

function info(msg) {
    sh.echo(colors.magenta(msg));
}

function error(msg) {
    sh.echo(colors.red(`ERROR: ${msg}`));
}

function executeCmd(cmd) {
    const result = sh.exec(cmd);

    if (result.code !== 0) {
        error(`Command Failed >>> ${cmd}`);
        sh.exit(1);
    }

    // returns {code:..., stdout:..., stderr:...}
    return result;
}

async function confirm(msg, defaultValue = true) {
    const result = await inq.prompt({
        type: 'confirm',
        name: 'conf',
        message: msg,
        'default': defaultValue
    });

    return result.conf;
}

function checkEnv(varName) {
    if (!process.env[varName]) {
        error(`Missing environment variable ${varName}`);
        sh.exit(1);
    }
}

function generateNewVersion(previousTag, now = Date.now()) {
    // previous tag should be following rule:
    //  v{major}.{minor}.{yyyymmdd}-{ord}

    const re = /v(\d+)\.(\d+)\.(\d{8})-(\d+)/g;
    let result = re.exec(previousTag);
    if (!result || result.length < 5) {
        result = ['', '0', '1', '', '1'];
    }
    let [matched, major, minor, date, ord] = result;

    const today = moment(now).format('YYYYMMDD');
    if (date === today) {
        ++ord;
    } else {
        date = today;
        ord = 1;
    }
    return `${major}.${minor}.${date}-${ord}`;
}

/**
 * This is the main function of the script
 */
async function runScript() {
    info(colors.magenta('|----------------------------------|'));
    info(colors.magenta('| N Air Interactive Release Script |'));
    info(colors.magenta('|----------------------------------|'));

    const githubApiServer = 'https://api.github.com';
    const githubWebServer = 'https://github.com';
    const githubApi = `${githubApiServer}/api/v3`;

    const organization = 'n-air-app';
    const repository = 'n-air-app';
    const remote = 'origin';

    const targetBranch = 'n-air_development';

    // Start by figuring out if this environment is configured properly
    // for releasing.
    checkEnv('CSC_LINK');
    checkEnv('CSC_KEY_PASSWORD');
    checkEnv('NAIR_LICENSE_API_KEY');

    info(`check whether remote ${remote} exists`);
    executeCmd(`git remote get-url ${remote}`)

    info('make sure there is nothing to commit on local directory');
    executeCmd('git status'); // there should be nothing to commit
    executeCmd('git diff -s --exit-code'); // and nothing changed

    info('checking current branch...')
    const currentBranch = executeCmd('git rev-parse --abbrev-ref HEAD').stdout.trim()
    if (currentBranch !== targetBranch) {
        if (!await confirm(`current branch '${currentBranch}' is not '${targetBranch}'. continue?`, false)) {
            sh.exit(1);
        }
    }

    info('pulling fresh repogitory...')
    executeCmd(`git pull`);

    info('checking current tag...');
    const previousTag = executeCmd('git describe --tags --abbrev=0').stdout.trim();

    let nothingChanged = sh.exec(`git diff -s --exit-code ${previousTag}`).code == 0;

    let newVersion;
    let rebuild = false;
    if (nothingChanged) {
        newVersion = previousTag.substr(1);

        if (!await confirm(`Are you sure you want to REBUILD as version v${newVersion} (nothing Changed)?`)) sh.exit(0);
        rebuild = true;
    } else {
        const defaultVersion = generateNewVersion(previousTag);

        newVersion = (await inq.prompt({
            type: 'input',
            name: 'newVersion',
            message: 'What should the new version number be?',
            default: defaultVersion
        })).newVersion;
        if (!await confirm(`Are you sure you want to release as version v${newVersion}?`, false)) sh.exit(0);

        // update package.json with newVersion and git tag
        executeCmd(`yarn version --new-version=${newVersion}`);
    }

    if (!await confirm('skip cleaning node_modules?')) {
        // clean
        info('Removing old packages...');
        sh.rm('-rf', 'node_modules');
    }

    info('Installing yarn packages...');
    executeCmd('yarn install');

    info('Compiling assets...');
    executeCmd('yarn compile:production');

    info('Making the package...');
    executeCmd('yarn package');

    info('Pushing to the repository...')
    executeCmd(`git push ${remote} ${targetBranch}`);
    executeCmd(`git push ${remote} v${newVersion}`);

    info(`version: v${newVersion}`);

    if (!rebuild) {
        info(`log since ${previousTag}:`);
        executeCmd(`git log --oneline --graph --decorate --ancestry-path ${previousTag}..`);
        info('');
    }

    const distDir = path.resolve('.', 'dist');
    const latestYml = path.join(distDir, 'latest.yml');
    const parsedLatestYml = yml.safeLoad(fs.readFileSync(latestYml));
    const binaryFile = parsedLatestYml.path;
    const binaryFilePath = path.join(distDir, binaryFile);
    if (!fs.existsSync(binaryFilePath)) {
        error(`Counld not find ${path.resolve(binaryFilePath)}`);
        sh.exit(1);
    }

    executeCmd(`ls -l ${binaryFilePath} ${latestYml}`);

    // TODO upload to the github directly via API...

    info(`please upload latest.yml and ${binaryFile} to the release!`);
    // open release page on github
    if (rebuild) {
        executeCmd(`start ${githubWebServer}/${organization}/${repository}/releases/edit/${previousTag}`);
    } else {
        executeCmd(`start ${githubWebServer}/${organization}/${repository}/releases/new`);
    }
    // open dist files directory
    executeCmd('start dist');

    // done.
    info(`Version ${newVersion} released successfully!`);
}

runScript().then(() => {
    sh.exit(0);
});
