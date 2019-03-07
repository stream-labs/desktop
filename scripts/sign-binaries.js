const shell = require('shelljs');
const fs = require('fs');
const path = require('path');
const signtool = require('signtool')

const osn = './node_modules/obs-studio-node/';
const crash_handler = './node_modules/crash-handler/';

function parseFiles(directory) {
	const files = fs.readdirSync(directory);
	files.forEach(file => {
		const fullPath = path.join(directory, file);
		if(fs.statSync(fullPath).isDirectory() && file != './data/obs-plugins/win-capture/') {
			parseFiles(fullPath);
		} else {
			const absolutePath = path.resolve(fullPath);
			const ext = path.extname(absolutePath)
			if(ext === '.dll' || ext === '.node' || ext === '.exe') {
				console.log('Signing ' + absolutePath);
				signtool.sign(absolutePath, {certificate: process.env.CSC_LINK, password: process.env.CSC_KEY_PASSWORD});
			}
		}			
	})
}

parseFiles(osn);
parseFiles(crash_handler);
