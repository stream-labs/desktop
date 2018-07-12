import fs from 'fs';
import { stockImages, stockSounds } from './stock-library';
import { Inject } from '../../util/injector';
import { authorizedHeaders } from '../../util/requests';
import { StatefulService, mutation } from '../stateful-service';
import { UserService } from '../user';
import { HostsService } from '../hosts';
import { WindowsService } from '../windows';
import { ipcRenderer } from 'electron';

export interface IFile {
  href: string;
  filename: string;
  size?: string;
  type?: string;
}

interface IMediaGalleryState {
  uploads: IFile[];
  totalUsage: number;
  category: string;
  type: string;
  maxUsage: number;
  maxFileSize: number;
}

const filetypeMap = {
  mp3: 'audio',
  wav: 'audio',
  ogg: 'audio',
  jpg: 'image',
  png: 'image',
  gif: 'image',
  jpeg: 'image',
  webm: 'image',
  svg: 'image'
};

const defaultMaxUsage = 1024 * Math.pow(1024, 2);
const defaultMaxFileSize = 25 * Math.pow(1024, 2);

const union = (arrayA: any[], arrayB: any[]) =>
  Array.from(new Set([...arrayA, ...arrayB]));

const concatUint8Arrays = (a: Uint8Array, b: Uint8Array) => {
  const c = new Uint8Array(a.length + b.length);
  c.set(a, 0);
  c.set(b, a.length);
  return c;
};

export class MediaGalleryService extends StatefulService<IMediaGalleryState> {
  @Inject() userService: UserService;
  @Inject() hostsService: HostsService;
  @Inject() windowsService: WindowsService;

  static initialState: IMediaGalleryState = {
    uploads: [],
    totalUsage: 0,
    category: null,
    type: null,
    maxUsage: null,
    maxFileSize: null
  };

  private promises: Dictionary<{ resolve: (value?: IFile | PromiseLike<IFile>) => void, reject: () => void }> = {};

  init() {
    this.fetchFileLimits();
    this.fetchFiles();
  }

  files() {
    let totalUsage = 0;
    let files = this.state.uploads.map((item: IFile) => {
      const filename = decodeURIComponent(item.href.split(/[\\/]/).pop());
      const ext = filename
        .toLowerCase()
        .split('.')
        .pop();
      if (item.size) {
        totalUsage += parseInt(item.size, 10);
      }

      item.filename = filename;
      item.type = filetypeMap[ext];
      return item;
    });

    this.SET_TOTAL_USAGE(totalUsage);

    if (this.state.category === 'stock') {
      files = stockSounds.concat(stockImages);
    }
    if (this.state.type) {
      files = files.filter(file => file.type === this.state.type);
    }

    return files;
  }

  selectFileFromGallery(): Promise<IFile> {
    const promiseId = ipcRenderer.sendSync('getUniqueId');
    this.showMediaGallery(promiseId);
    return new Promise((resolve, reject) => {
      this.promises[promiseId] = { resolve, reject };
    });
  }

  resolveFileSelect(promiseId: string, file: IFile) {
    this.promises[promiseId].resolve(file);
    delete this.promises[promiseId];
    return file;
  }

  async upload(filePaths: string[]): Promise<void> {
    const formData = new FormData();
    filePaths.forEach((path: string) => {
      const contents = fs.readFileSync(path);
      const name = path.split('\\').pop();
      const ext = name
        .toLowerCase()
        .split('.')
        .pop();
      const file = new File([contents], name, { type: `${filetypeMap[ext]}/${ext}` });
      formData.append('uploads[]', file);
    });

    const req = this.formRequest('api/v5/slobs/uploads', {
      body: formData,
      method: 'POST'
    });
    return fetch(req)
      .then((resp: Response) => resp.json())
      .then((resp: IFile[]) => {
        this.SET_UPLOADS(union(resp, this.state.uploads));
      });
  }

  setTypeFilter(type: string, category: string) {
    if (type !== this.state.type || category !== this.state.category) {
      this.SET_TYPE(type);
      this.SET_CATEGORY(category);
    }
  }

  async downloadFile(filename: string, file: IFile): Promise<void> {
    return fetch(file.href).then(
      ({ body }: { body: ReadableStream }) => {
        const reader = body.getReader();
        let result = new Uint8Array(0);
        const readStream = ({
          done,
          value
        }: {
          done: boolean;
          value: Uint8Array;
        }) => {
          if (done) {
            fs.writeFileSync(filename, result);
          } else {
            result = concatUint8Arrays(result, value);
            reader.read().then(readStream);
          }
        };
        return reader.read().then(readStream);
      }
    );
  }

  deleteFile(file: IFile) {
    const a = document.createElement('a');
    a.href = file.href;
    const path = a.pathname;

    const req = this.formRequest(`api/v5/slobs/uploads${path}`, { method: 'DELETE' });
    const filteredUploads = this.state.uploads.filter((upload: IFile) => upload.href !== file.href);
    fetch(req).then(() => this.SET_UPLOADS(filteredUploads));
  }

  showMediaGallery(promiseId: string) {
    this.windowsService.showWindow({
      componentName: 'MediaGallery',
      queryParams: { promiseId },
      size: {
        width: 1100,
        height: 680
      }
    });
  }

  private formRequest(endpoint: string, options?: any) {
    const host = this.hostsService.streamlabs;
    const headers = authorizedHeaders(this.userService.apiToken);
    const url = `https://${host}/${endpoint}`;
    return new Request(url, { ...options, headers });
  }

  private fetchFiles() {
    const req = this.formRequest('api/v5/slobs/uploads');
    fetch(req)
      .then(resp => resp.json())
      .then((resp: IFile[]) => this.SET_UPLOADS(resp));
  }

  private fetchFileLimits() {
    const req = this.formRequest('api/v5/slobs/user/filelimits');
    fetch(req)
      .then(resp => resp.json())
      .then(({ body }: { body: any }) => ({
        maxUsage: body.max_allowed_upload_usage,
        maxFileSize: body.max_allowed_upload_fize_size
      }))
      .then(limits => this.SET_FILE_LIMITS(limits))
      .catch(() =>
        this.SET_FILE_LIMITS({
          maxUsage: defaultMaxUsage,
          maxFileSize: defaultMaxFileSize
        })
      );
  }

  @mutation()
  private SET_UPLOADS(files: IFile[]) {
    this.state.uploads = files;
  }

  @mutation()
  private SET_TOTAL_USAGE(usage: number) {
    this.state.totalUsage = usage;
  }

  @mutation()
  private SET_TYPE(type: string) {
    this.state.type = type;
  }

  @mutation()
  private SET_CATEGORY(category: string) {
    this.state.category = category;
  }

  @mutation()
  private SET_FILE_LIMITS({
    maxFileSize,
    maxUsage
  }: {
    maxFileSize: number;
    maxUsage: number;
  }) {
    this.state.maxFileSize = maxFileSize;
    this.state.maxUsage = maxUsage;
  }
}
