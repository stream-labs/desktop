import { Inject } from '../util/injector';
import { authorizedHeaders } from '../util/requests';
import { StatefulService, mutation } from './stateful-service';
import { UserService } from './user';
import { HostsService } from './hosts';

interface IFile {
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
  busy: boolean;
  selectedFile: IFile;
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
  svg: 'image',
};

const defaultMaxUsage = 1024 * Math.pow(1024, 2);
const defaultMaxFileSize = 25 * Math.pow(1024, 2);

const union = (arrayA: any[], arrayB: any[]) => (
  Array.from(new Set([...arrayA, ...arrayB]))
);

const stockSounds = [
  { href: 'http://uploads.twitchalerts.com/sound-defaults/bonus-2.ogg', filename: 'Bonus 2' }, { href: 'http://uploads.twitchalerts.com/sound-defaults/bonus-3.ogg', filename: 'Bonus 3' }, { href: 'http://uploads.twitchalerts.com/sound-defaults/failure.ogg', filename: 'Failure' }, { href: 'http://uploads.twitchalerts.com/sound-defaults/failure-2.ogg', filename: 'Failure 2' }, { href: 'http://uploads.twitchalerts.com/sound-defaults/funny-blunder.ogg', filename: 'Funny Blunder' }, { href: 'http://uploads.twitchalerts.com/sound-defaults/level-up.ogg', filename: 'Level Up' }, { href: 'http://uploads.twitchalerts.com/sound-defaults/magic-coins.ogg', filename: 'Magic Coins' }, { href: 'http://uploads.twitchalerts.com/sound-defaults/new-message.ogg', filename: 'New Message' }, { href: 'http://uploads.twitchalerts.com/sound-defaults/new-message-2.ogg', filename: 'New Message 2' }, { href: 'http://uploads.twitchalerts.com/sound-defaults/new-message-3.ogg', filename: 'New Message 3' }, { href: 'http://uploads.twitchalerts.com/sound-defaults/new-message-4.ogg', filename: 'New Message 4' }, { href: 'http://uploads.twitchalerts.com/sound-defaults/new-message-5.ogg', filename: 'New Message 5' }, { href: 'http://uploads.twitchalerts.com/sound-defaults/positive-win-game-sound-3.ogg', filename: 'Positive Win Game Sound 3' }, { href: 'http://uploads.twitchalerts.com/sound-defaults/positive-win-game-sound-4.ogg', filename: 'Positive Win Game Sound 4' }, { href: 'http://uploads.twitchalerts.com/sound-defaults/positive-win-game-sound-5.ogg', filename: 'Positive Win Game Sound 5' }, { href: 'http://uploads.twitchalerts.com/sound-defaults/positive-game-sound-2.ogg', filename: 'Positive Game Sound 2' }, { href: 'http://uploads.twitchalerts.com/sound-defaults/positive-game-sound-3.ogg', filename: 'Positive Game Sound 3' }, { href: 'http://uploads.twitchalerts.com/sound-defaults/positive-game-sound-4.ogg', filename: 'Positive Game Sound 4' }, { href: 'http://uploads.twitchalerts.com/sound-defaults/success-chime.ogg', filename: 'Success Chime' }, { href: 'http://uploads.twitchalerts.com/sound-defaults/the-award.ogg', filename: 'The Award' }, { href: 'http://uploads.twitchalerts.com/sound-defaults/the-award-2.ogg', filename: 'The Award 2' }, { href: 'http://uploads.twitchalerts.com/sound-defaults/water-success.ogg', filename: 'Water Success' }, { href: 'http://uploads.twitchalerts.com/sound-defaults/8-bit-success.ogg', filename: '8-Bit Success' }, { href: 'http://uploads.twitchalerts.com/sound-defaults/all-right.ogg', filename: 'All Right!' }, { href: 'http://uploads.twitchalerts.com/sound-defaults/oh-yeah.ogg', filename: 'Ohhhh Yeaaah' }, { href: 'http://uploads.twitchalerts.com/sound-defaults/soft-success.ogg', filename: 'Soft Success' }
].map((item: IFile) => { item.type = 'audio'; return item; });
const stockImages = [
  { href: 'http://uploads.twitchalerts.com/image-defaults/QotDXk8.png', filename: 'QotDXk8.png' }, { href: 'http://uploads.twitchalerts.com/image-defaults/F4YDh0E.png', filename: 'F4YDh0E.png' }, { href: 'http://uploads.twitchalerts.com/image-defaults/DeR4Lbk.png', filename: 'DeR4Lbk.png' }, { href: 'http://uploads.twitchalerts.com/image-defaults/nerOJzH.gif', filename: 'nerOJzH.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/2OB43dk.gif', filename: '2OB43dk.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/Yd0IPt1.gif', filename: 'Yd0IPt1.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/6EIjpND.gif', filename: '6EIjpND.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/GGPeRhn.gif', filename: 'GGPeRhn.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/Q3u5agn.gif', filename: 'Q3u5agn.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/DMoHG13.gif', filename: 'DMoHG13.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/YfKasMd.gif', filename: 'YfKasMd.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/DYvBsob.gif', filename: 'DYvBsob.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/5rANtdR.gif', filename: '5rANtdR.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/eBWiNmz.gif', filename: 'eBWiNmz.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/5VrJE9S.gif', filename: '5VrJE9S.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/FSIAV2u.gif', filename: 'FSIAV2u.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/MMeOVpM.gif', filename: 'MMeOVpM.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/puzkx2m.gif', filename: 'puzkx2m.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/7wUep70.gif', filename: '7wUep70.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/jJS8uN2.gif', filename: 'jJS8uN2.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/7g8MljU.gif', filename: '7g8MljU.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/FwVdBJ5.gif', filename: 'FwVdBJ5.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/L0IQKRr.gif', filename: 'L0IQKRr.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/XqKXKv4.gif', filename: 'XqKXKv4.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/FNQ5CFj.gif', filename: 'FNQ5CFj.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/fc3l87Y.gif', filename: 'fc3l87Y.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/N3qEsr2.gif', filename: 'N3qEsr2.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/IprghJf.gif', filename: 'IprghJf.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/DAFaUJS.gif', filename: 'DAFaUJS.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/TPDLKu1.gif', filename: 'TPDLKu1.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/xbzwN0P.gif', filename: 'xbzwN0P.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/OFEoWbv.gif', filename: 'OFEoWbv.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/jx9DtIK.gif', filename: 'jx9DtIK.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/rS0A2Zx.gif', filename: 'rS0A2Zx.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/nYO9x0u.gif', filename: 'nYO9x0u.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/hMLMJYs.gif', filename: 'hMLMJYs.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/VaS6lli.gif', filename: 'VaS6lli.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/eA9vnyJ.gif', filename: 'eA9vnyJ.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/5bWLiWD.gif', filename: '5bWLiWD.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/5cY9mqW.gif', filename: '5cY9mqW.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/bZIQIad.gif', filename: 'bZIQIad.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/hjajnLq.gif', filename: 'hjajnLq.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/jLbvtgH.gif', filename: 'jLbvtgH.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/D1Lz6qV.gif', filename: 'D1Lz6qV.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/1n9bK4w.gif', filename: '1n9bK4w.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/9NDQVfz.gif', filename: '9NDQVfz.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/Mn4Shfh.gif', filename: 'Mn4Shfh.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/SkCa8fk.gif', filename: 'SkCa8fk.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/xGTaKmK.gif', filename: 'xGTaKmK.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/dBXACr6.gif', filename: 'dBXACr6.gif' }, { href: 'http://uploads.twitchalerts.com/image-defaults/sJJBQOT.gif', filename: 'sJJBQOT.gif' }
].map((item: IFile) => { item.type = 'image'; return item; });

export class MediaGalleryService extends StatefulService<IMediaGalleryState> {
  @Inject() userService: UserService;
  @Inject() hostsService: HostsService;

  static initialState: IMediaGalleryState = {
    uploads: [],
    totalUsage: 0,
    category: null,
    type: null,
    busy: false,
    selectedFile: null,
    maxUsage: null,
    maxFileSize: null
  };

  init() {
    this.fetchFileLimits();
  }

  get files() {
    let totalUsage = 0;
    let files = this.state.uploads.map((item: IFile) => {
      const filename = decodeURIComponent(item.href.split(/[\\/]/).pop());
      const ext = filename.toLowerCase().split('.').pop();
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
      files = files.filter((file) => file.type === this.state.type);
    }

    return files;
  }

  formRequest(endpoint: string, options?: any) {
    const host = this.hostsService.streamlabs;
    const headers = authorizedHeaders(this.userService.apiToken);
    const url = `https://${host}/${endpoint}`;
    return new Request(url, { ...options, headers });
  }

  getUploads() {
    const req = this.formRequest('api/v5/slobs/uploads');
    fetch(req)
      .then((resp) => resp.json())
      .then(({ body }: { body: IFile[] }) => this.SET_UPLOADS(body));
  }

  upload(files: FileList) {
    this.SET_BUSY(true);

    const formData = new FormData();
    Array.from(files).forEach((file: File) => formData.append('uploads[]', file));

    const req = this.formRequest('api/v5/slobs/uploads', { body: formData, method: 'POST' });
    fetch(req)
      .then((resp: Response) => resp.json())
      .then(({ body }: { body: IFile[] }) => {
        this.SET_UPLOADS(union(body, this.state.uploads));
        this.SET_BUSY(false);
      })
      .catch(() => this.SET_BUSY(false));
  }

  setTypeFilter(type: string, category: string) {
    if (type !== this.state.type || category !== this.state.category) {
      this.SET_TYPE(type);
      this.SET_SELECTED_FILE(null);
      this.SET_CATEGORY(category);
    }
  }

  fetchFileLimits() {
    const req = this.formRequest('api/v5/slobs/user/filelimits');
    fetch(req)
      .then((resp) => resp.json())
      .then(({ body }: { body: any }) => ({
        maxUsage: body.max_allowed_upload_usage,
        maxFileSize: body.max_allowed_upload_fize_size
      }))
      .then((limits) => this.SET_FILE_LIMITS(limits))
      .catch(() => this.SET_FILE_LIMITS({ maxUsage: defaultMaxUsage, maxFileSize: defaultMaxFileSize }));
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
  private SET_BUSY(bool: boolean) {
    this.state.busy = bool;
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
  private SET_SELECTED_FILE(file: IFile) {
    this.state.selectedFile = file;
  }

  @mutation()
  private SET_FILE_LIMITS({ maxFileSize, maxUsage }: { maxFileSize: number, maxUsage: number }) {
    this.state.maxFileSize = maxFileSize;
    this.state.maxUsage = maxUsage;
  }
}
