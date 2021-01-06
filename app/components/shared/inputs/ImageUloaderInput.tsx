import { Component, Prop } from 'vue-property-decorator';
import cx from 'classnames';
import styles from './ImageUploaderInput.m.less';
import { BaseInput } from './BaseInput';
import { $t } from 'services/i18n';
import { createProps } from 'components/tsx-component';
import FileInput from './FileInput.vue';
import { IImageUploaderMetadata, IInputMetadata } from './index';
import Utils from '../../../services/utils';

class Props {
  value: string = '';
  metadata: IImageUploaderMetadata = null;
}

@Component({ props: createProps(Props) })
export default class ImageUploaderInput extends BaseInput<string, IImageUploaderMetadata, Props> {
  value: string;
  title: string;
  metadata: IInputMetadata;

  private get imageUrl() {
    return this.hasNonDefaultValue ? this.value : this.options.defaultUrl;
  }

  private get hasNonDefaultValue() {
    return this.value && this.value !== 'default';
  }

  private errorMessage = '';

  private onFileChangeHandler(ev: InputEvent) {
    // read the file
    const files = ((ev.currentTarget as unknown) as { files: FileList }).files;
    if (!files?.length) return;
    const fr = new FileReader();
    const file = files[0];

    // check max size
    this.errorMessage = '';
    if (file.size > this.options.maxFileSize) {
      this.errorMessage =
        $t('Maximum file size reached ') +
        Utils.getReadableFileSizeString(this.options.maxFileSize);
      this.emitInput('');
      return;
    }

    // save is as a base64 string
    fr.readAsDataURL(file);
    fr.addEventListener('load', () => {
      this.emitInput(fr.result as string);
    });
  }

  private clearImage() {
    this.emitInput('default');
  }

  render() {
    return (
      <div
        data-role="input"
        data-type="imageUploader"
        data-name={this.options.name}
        class={styles.imageUploader}
      >
        {this.imageUrl && <img src={this.imageUrl} alt="" class={styles.image} />}
        {!this.hasNonDefaultValue && (
          <div class={styles.footer}>
            {this.errorMessage && <span class="input-error">{this.errorMessage}</span>}
            {!this.errorMessage && <span>{$t('Select image')}</span>}
          </div>
        )}
        <label class={styles.fileLabel}>
          <input
            type="file"
            onchange={(ev: InputEvent) => this.onFileChangeHandler(ev)}
            accept=".jpg, .png, .jpeg"
          />
        </label>
        {this.hasNonDefaultValue && (
          <div class={styles.footer}>
            <span onclick={() => this.clearImage()}>{$t('Clear')}</span>
          </div>
        )}
      </div>
    );
  }
}
