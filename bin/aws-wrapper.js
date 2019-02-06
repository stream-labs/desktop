const cp = require('child_process');

const args = process.argv.splice(3);
const secretKey = process.env['AWS_SECRET_ACCESS_KEY'];
const accessKey = process.env['AWS_ACCESS_KEY_ID'];

if (!secretKey || !accessKey) {
	console.log('AWS environment keys missing!');
	return;
}

if (args.includes('--secret-access-key') || args.includes('--access-key')) {
	console.log('AWS environment already given in CLI commands!');
	console.log('Just call the script directly');
	return;
}

args.push('--secret-access-key', secretKey);
args.push('--access-key', accessKey);

console.log(`Wrapping ${process.argv[2]} with arguments ${args}`);

const proc = cp.fork(process.argv[2], args);

proc.on('exit', process.exit);
