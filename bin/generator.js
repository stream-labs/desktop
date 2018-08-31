const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const util = require('util');
const pmap = require('p-map');

const readdir = util.promisify(fs.readdir);
const lstat = util.promisify(fs.lstat);

function add_hash_entry(digest, file_path, context) {
    const file_entry = path.relative(context.root_folder_path, file_path);
    context.callback(file_entry, digest);
}

async function handle_file_lstat(stats, file_path, context) {
    if (stats.isSymbolicLink()) {
        console.log(`Ignoring symbolic link: ${file_path}`);
        return;
    }

    if (stats.isDirectory()) {
        const files = await readdir(file_path);
        await handle_folder_read(files, file_path, context);
        return;
    }

    /* Hash the file for later comparison. This is the value of the key. */
    const digest = await new Promise((resolve, reject) => {
        const file_stream = fs.createReadStream(file_path);
        const hash = crypto.createHash(context.hash_algo);

        file_stream.on('data', (chunk) => {
            hash.update(chunk);
        });

        file_stream.on('end', () => {
            resolve(hash.digest('hex'));
        });

        file_stream.on('error', reject);

    });

    add_hash_entry(digest, file_path, context);
}

async function handle_folder_read(files, folder_path, context) {
    return pmap(files, (file) => {
        const file_path = path.resolve(folder_path, file);

        return lstat(file_path).then((stats) => {
            return handle_file_lstat(stats, file_path, context);
        });
    }, { concurrency: 10 });
}

/**
    Our primary entry point and what gets executed
    if we run from command line.

    @param folder_path
        A full or relative path to the file
        If it's a full path, the file list will
        still contain a relative path since its
        required when updating.

    @param hash_algo
        The hash algorithm to use when creating a
        hash for the file. This is to be one of the
        elements returned from crypto.getHashes().
        It may return a hash that doesn't work
        out of the box. My answer to that is use
        one that's supported. I may add a whilelist
        at a later time.

    @todo A callback when a path/hash key/value is made should
          be used instead to allow formats outside of json.
          It would also be the easiest way to prevent having
          to load the entirety of the file list into a single
          object which can be heavy in some use-cases.
 */
async function generate_file_list(folder_path, options, callback) {
    const cwd = path.resolve();

    /* Our list is a dictionary where the key
     * is the relative path to the file from
     * the root directory. This is important
     * since it's used during updating as well
     * since full path will obviously differ per
     * machine. */
    const root_folder_path = path.resolve(cwd, folder_path);

    if (!options) options = { };

    if (!options['hashAlgo'])
        options['hashAlgo'] = 'sha1';

    const context = {
        callback,
        root_folder_path,
        hash_algo: options['hashAlgo']
    };

    const files = await readdir(root_folder_path);
    await handle_folder_read(files, root_folder_path, context);
}

module.exports = generate_file_list;