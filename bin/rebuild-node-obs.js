/* Execute in top-most directory in the format of
 * node <script path> <node-obs path> [copy directory path]*/

const shell = require('shelljs');
const path = require('path');
const process = require('process');

let nodeObsPath = null;
let npmBinPath = null;
let cmakeJsPath = null;

/* Configurable variables */
const runtime = 'electron';
const runtimeVersion = '1.7.12';
const configType = 'Release';

/** This assumes cmake is in the global PATH variable. */
function buildNodeObs() {
  console.log(`node-obs path given: ${nodeObsPath}`);
  shell.exec(
    `"${cmakeJsPath}" --directory ${nodeObsPath} configure --runtime ${
      runtime
    } --runtime-version ${runtimeVersion}`
  );
  shell.exec(
    `"${cmakeJsPath}" --directory ${nodeObsPath} build --runtime ${
      runtime
    } --runtime-version ${runtimeVersion}`
  );

  const nodeObsBuildPath = path.resolve(nodeObsPath, `build`);
  shell.exec(`cmake --build ${nodeObsBuildPath} --config ${configType}`);
  shell.exec(
    `cmake --build ${nodeObsBuildPath} --target install --config ${
      configType
    }`
  );

  if (process.argv.length >= 4) {
    /* Binaries are hardcoded to be put in <node obs dir>/<build dir>/distribute */
    const distributePath = path.resolve(
      nodeObsBuildPath,
      path.normalize('distribute/node-obs')
    );
    shell.cp(
      '-uR' /* Copy if Newer, Recursive */,
      distributePath,
      path.normalize(process.argv[3])
    );
  }
}

function fetchBuildParameters() {
  /* Exec path, script name, then path to node-obs */
  if (process.argv.length >= 3) {
    cmakeJsPath = path.resolve(npmBinPath, 'cmake-js');
    nodeObsPath = path.resolve(process.argv[2]);
  } else {
    console.log('Incorrect number parameters passed.');
    process.exitCode = -1;
    return;
  }

  buildNodeObs();
}

function fetchNpmBin(error, stdout, stderr) {
  if (error) {
    console.log(stdout);
    console.log(stderr);
    console.log(`Failed to fetch npm bin path: ${error}`);
    process.exitCode = -1;
    return;
  }

  npmBinPath = stdout.trim();
  fetchBuildParameters();
}

/** Notice that an npm replacement such as yarn
 will execute itself when npm is called here */
shell.exec('npm bin', { async: true, silent: true }, fetchNpmBin);
