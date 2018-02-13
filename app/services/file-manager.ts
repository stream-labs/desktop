import { Service } from 'services/service';
import path from 'path';
import fs from 'fs';

interface IFile {
  data: string;
  locked: boolean;
  version: number;
}

/**
 * This service provides an atomic, race-condition-free
 * file I/O system.  It supports instaneous synchronous
 * reads and writes of files under management.  It does
 * this by storing a copy of all files in memory, and
 * asynchronously flushing them to disk.  This obviously
 * has the downside of being memory intensive, and should
 * only be used for small files where atomicity and
 * performance are important.
 */
export class FileManagerService extends Service {
  private files: Dictionary<IFile> = {};

  /**
   * Registers existing files with the manager.  Any files that were
   * not created during this session should be registered before reading
   * to avoid synchronous reads.
   * @param filePaths An array of paths
   */
  async registerFiles(filePaths: string[]) {
    const promises = filePaths.map(async filePath => {
      const truePath = path.resolve(filePath);
      const exists = await this.fileExists(truePath);

      if (exists) {
        const data = await this.readFile(truePath);
        if (!this.files[truePath]) {
          this.files[truePath] = {
            data,
            locked: false,
            version: 0
          };
        }
      }
    });

    return Promise.all(promises);
  }

  async exists(filePath: string): Promise<boolean> {
    const truePath = path.resolve(filePath);

    if (this.files[truePath]) return Promise.resolve(true);
    return this.fileExists(truePath);
  }

  write(filePath: string, data: string) {
    const truePath = path.resolve(filePath);
    const file = this.files[truePath];

    if (file) {
      file.data = data;
      file.version += 1;
    } else {
      this.files[truePath] = {
        data,
        locked: false,
        version: 0
      };
    }

    this.flush(truePath);
  }

  read(filePath: string) {
    const truePath = path.resolve(filePath);
    let file = this.files[truePath];

    // In the event a file wasn't pre-registered, we will fall back to a
    // synchronous read.
    if (!file) {
      file = this.files[truePath] = {
        data: fs.readFileSync(truePath).toString(),
        locked: false,
        version: 0
      };
    }

    return file.data;
  }

  copy(sourcePath: string, destPath: string) {
    const trueSource = path.resolve(sourcePath);
    const trueDest = path.resolve(destPath);

    this.files[trueDest] = {
      data: this.read(trueSource),
      locked: false,
      version: 0
    };

    this.flush(trueDest);
  }

  private async flush(filePath: string) {
    const file = this.files[filePath];

    // Current flush attempt will realize it wrote out
    // of date data and re-run.
    if (file.locked) return;

    file.locked = true;
    const version = file.version;

    try {
      await this.writeFile(filePath, file.data);

      if (version !== file.version) {
        throw new Error('Wrote out of date file!  Will retry...');
      }

      file.locked = false;
    } catch (e) {
      file.locked = false;
      this.flush(filePath);
    }
  }

  /**
   * Checks if a file exists
   * @param string a path to the file
   */
  private fileExists(filePath: string): Promise<boolean> {
    return new Promise(resolve => {
      fs.exists(filePath, exists => resolve(exists));
    });
  }

  /**
   * Reads the contents of the file into a string
   * @param string a path to the file
   */
  private readFile(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, (err, data) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(data.toString());
      });
    });
  }

  /**
   * Writes data to a file
   * @param filePath a path to the file
   * @param data The data to write
   */
  private writeFile(filePath: string, data: string): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.writeFile(filePath, data, err => {
        if (err) {
          reject(err);
          return;
        }

        resolve();
      });
    });
  }
}
