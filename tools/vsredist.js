'use strict';

// A simple check for VCRedist being installed using 'reg query' commands. Native code can
//  make this much better, but this works for now.
// 
// How to use:
// 1. Create a VCRedist update
// 2. Check for a required update with VCRedist.check() (returns true if needed)
// 3. If true: Call VCRedist.update(cb) to begin the download and installation.
//    The callback will have one parameter which is an object like this:
//      object {
//          status: object {
//              failed: bool,
//              complete: bool,
//              checking: bool,
//              downloading: bool,
//              installing: bool
//          },
//          totalBytes: number,
//          downloadBytes: number,
//          percent: number,
//          error: string
//      }

const { spawnSync } = require('child_process');
const https = require('https');
const url = require('url');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

function queryRegistryKeyValue(path, entry) {
    let proc = spawnSync(
        'reg',
        ['query', path, '/v', entry],
        {
            encoding: 'utf8',
            windowsHide: true
        }
    );

    let rval = {};
    rval.error = proc.error;
    rval.status = proc.status;
    rval.stdout = proc.stdout;
    rval.stderr = proc.stderr;

    if (proc.status == 0) {
        let lines = proc.stdout.split('\r\n');
        let values = lines[2].split(' ');
        let stringvalues = values.slice(12);

        switch (values[8]) {
            case 'REG_SZ': {
                rval.string = stringvalues.join(' ');
                break;
            }
            case 'REG_MULTI_SZ': {
                rval.string = stringvalues.join(' ');
                break;
            }
            case 'REG_EXPAND_SZ': {
                rval.string = stringvalues.join(' ');
                break;
            }
            case 'REG_DWORD': {
                rval.decimal = parseInt(stringvalues[0], 16);
                rval.hexadecimal = stringvalues[0];
                break;
            }
            case 'REG_QWORD': {
                rval.decimal = parseInt(stringvalues[0], 16);
                rval.hexadecimal = stringvalues[0];
                break;
            }
            case 'REG_BINARY': {
                rval.decimal = parseInt("0x" + stringvalues[0], 16);
                rval.hexadecimal = "0x" + stringvalues[0];
                break;
            }
            case 'REG_NONE': {
                break;
            }
        }
    }

    return rval;
}

class VCRedist {
    constructor() {
        this.targetVersionMajor = 14;
        this.targetVersionMinor = 15;
        this.fstream = undefined;
        this.cbInfo = {
            status: {
                failed: false,
                complete: false,
                checking: false,
                downloading: false,
                installing: false
            },
            totalBytes: 0,
            downloadBytes: 0,
            percent: NaN,
            error: ""
        }

        // We only need x64 right now.
        // https://aka.ms/vs/15/release/vc_redist.x64.exe
        this.host = 'aka.ms';
        this.path = '/vs/15/release/vc_redist.x64.exe';
    }

    check() {
        // Check if installed
        let isInstalled = queryRegistryKeyValue(
            'HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\VisualStudio\\14.0\\VC\\Runtimes\\x64',
            'Installed'
        )
        if (isInstalled.status != 0) {
            return true;
        }
        if (isInstalled.decimal != 1) {
            return true;
        }

        // Check Version major
        let majorVersion = queryRegistryKeyValue(
            'HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\VisualStudio\\14.0\\VC\\Runtimes\\x64',
            'Major'
        )
        if (majorVersion.status != 0) {
            return true;
        }
        if (majorVersion.decimal < this.targetVersionMajor) {
            return true;
        } else if (majorVersion.decimal > this.targetVersionMajor) {
            return false;
        }

        // Check Version minor
        let minorVersion = queryRegistryKeyValue(
            'HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\VisualStudio\\14.0\\VC\\Runtimes\\x64',
            'Minor'
        )
        if (minorVersion.status != 0) {
            return true;
        }
        if (minorVersion.decimal < this.targetVersionMinor) {
            return true;
        }

        return false;
    }

    requestHead(p_host, p_path, cb) {
        return new Promise((resolve, reject) => {
            function parse_response(response, resolve, reject) {
                if (cb != undefined) {
                    cb(response, resolve, reject);
                }
                resolve(response);
            }
            function handleTimeout(resolve, reject) {
                reject("Timed out trying to request information from remote.");
            }

            let request = https.request({
                method: 'HEAD',
                hostname: p_host,
                path: p_path,
                timeout: 1000
            })
                .on('response', (response) => { parse_response(response, resolve, reject); })
                .on('timeout', () => { handleTimeout(resolve, reject); });
            request.end();
        });
    }

    requestGet(p_host, p_path, cb) {
        return new Promise((resolve, reject) => {
            function parse_response(response, resolve, reject) {
                if (cb != undefined) {
                    cb(response, resolve, reject);
                }
            }
            function handleTimeout(resolve, reject) {
                reject("Timed out trying to request information from remote.");
            }

            let request = https.request({
                method: 'GET',
                hostname: p_host,
                path: p_path,
                timeout: 1000
            })
                .on('response', (response) => { parse_response(response, resolve, reject); })
                .on('timeout', () => { handleTimeout(resolve, reject); });
            request.end();
        });
    }

    async update(updateCB) {
        let random_name = 'vcredist_'
            + crypto.randomBytes(4).readUInt32LE(0).toString(16)
            + crypto.randomBytes(4).readUInt32LE(0).toString(16)
            + crypto.randomBytes(4).readUInt32LE(0).toString(16)
            + crypto.randomBytes(4).readUInt32LE(0).toString(16)
            + ".exe";
        let full_file_path = path.resolve(os.tmpdir(), random_name);
        
        // Gather information about the file.
        {
            this.cbInfo.status.checking = true;
            updateCB(this.cbInfo);

            let step, parsed;
            try {
                while ((step == undefined) || (step.statusCode >= 300 && step.statusCode < 400)) {
                    step = await this.requestHead(this.host, this.path);

                    switch (step.statusCode) {
                        case 200: // Success
                            break;
                        case 301: // Permanently Moved
                        case 302: // Temporarily Moved
                        case 303: // See Other
                        case 307: // Temporary Redirect
                            parsed = url.parse(step.headers.location);
                            this.host = parsed.host;
                            this.path = parsed.path;
                            break;
                        default:
                            this.cbInfo.status.failed = true;
                            this.cbInfo.error = step.statusMessage;
                            updateCB(this.cbInfo);
                            return false;
                    }
                }
                if (step.statusCode != 200) {
                    this.cbInfo.status.failed = true;
                    this.cbInfo.error = step.statusMessage;
                    updateCB(this.cbInfo);
                    return false;
                }
            } catch (err) {
                console.log(err);
                return false;
            }
            this.cbInfo.status.checking = false;
            this.cbInfo.totalBytes = parseInt(step.headers['content-length']);
        }

        // Download
        {
            this.cbInfo.status.downloading = true;
            updateCB(this.cbInfo);

            this.fileStream = fs.createWriteStream(full_file_path)
            let step = await this.requestGet(this.host, this.path, (response, resolve, reject) => {
                response.pipe(this.fileStream);
                response.on('data', (chunk) => {
                    this.cbInfo.downloadBytes += chunk.length;
                    this.cbInfo.percent = (this.cbInfo.downloadBytes / this.cbInfo.totalBytes);
                    updateCB(this.cbInfo);
                });
                response.on('error', (err) => {
                    this.fileStream.unlink(() => {
                        this.cbInfo.error = "Failed to write output file.";
                        resolve(false);
                    });
                });
                response.on('close', () => {
                    this.fileStream.close(() => {
                        resolve(true);
                    });
                });
                this.fileStream.on('finish', () => {
                    this.fileStream.close(() => {
                        resolve(true);
                    });
                });
            });
            if (!step) {
                this.cbInfo.failed = true;
                updateCB(this.cbInfo);
                return false;
            }
            this.cbInfo.status.downloading = false;
            updateCB(this.cbInfo);
        }

        // Install
        {
            this.cbInfo.status.installing = true;
            updateCB(this.cbInfo);

            let res = spawnSync(full_file_path, ['/install', '/quiet', '/norestart'], { encoding: 'utf8' })

            if (res.status != 0) {
                this.cbInfo.failed = true;
                this.cbInfo.error = "Failed to spawn process, status code " + res.status;
                updateCB(this.cbInfo);
                return false;
            }

            this.cbInfo.status.installing = false;
            updateCB(this.cbInfo);
        }

        // Cleanup
        {
            let wait = new Promise((resolve, reject) => {
                fs.unlink(full_file_path, (err) => {
                    resolve(err);
                })
            });
            let res = await wait;
            if (res != null) {
                console.log(res);
                // Not a failure, we already updated.
            }
        }
        
        this.cbInfo.status.complete = true;
        updateCB(this.cbInfo);

        return true;
    }
}

exports.VCRedist = VCRedist;
