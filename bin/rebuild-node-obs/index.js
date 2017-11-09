/* Execute in top-most directory in the format of 
 * node <script path> <node-obs path> [copy directory path]*/

const shell = require('shelljs');
const path = require('path');
const process = require('process');

let node_obs_path = null;
let npm_bin_path = null;
let cmake_js_path = null;

/* Configurable variables */
const cmake_generator = 'Visual Studio 14 2015 Win64';
const runtime = 'electron';
const runtime_version = '1.7.7';

/** This assumes cmake is in the global PATH variable. */
function buildNodeObs() {
	console.log(`node-obs path given: ${node_obs_path}`);
	shell.exec(`"${cmake_js_path}" --directory ${node_obs_path} configure --runtime ${runtime} --runtime-version ${runtime_version}`);
	shell.exec(`"${cmake_js_path}" --directory ${node_obs_path} build --runtime ${runtime} --runtime-version ${runtime_version}`);

	const node_obs_build_path = path.resolve(node_obs_path, `build`);
	shell.exec(`cmake --build ${node_obs_build_path} --config Release`);
	shell.exec(`cmake --build ${node_obs_build_path} --target install`);

	if (process.argv.length >= 4) {
		/* Binaries are hardcoded to be put in <node obs dir>/<build dir>/distribute */
		const distribute_path = path.resolve(node_obs_build_path, path.normalize('distribute/node-obs'));
		shell.cp('-uR' /* Copy if Newer, Recursive */, distribute_path, path.normalize(process.argv[3]));
	}
}

function fetchBuildParameters() {
	/* Exec path, script name, then path to node-obs */
	if (process.argv.length >= 3) {
		cmake_js_path = path.resolve(npm_bin_path, 'cmake-js');
		node_obs_path = path.resolve(process.argv[2]);
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

    npm_bin_path = stdout.trim();
    fetchBuildParameters();
}

/** Notice that an npm replacement such as yarn 
    will execute itself when npm is called here */
shell.exec('npm bin', { async: true, silent:true }, fetchNpmBin);