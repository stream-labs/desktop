import { Component, Prop } from 'vue-property-decorator';
import { Multiselect } from 'vue-multiselect';
import { FontLibraryService } from '../../../services/font-library';
import { Inject } from '../../../util/injector';
import { SourcesService } from '../../../services/sources';
import { Input, IGoogleFont } from './Input';
import FontSizeSelector from './FontSizeSelector.vue';
import path from 'path';


@Component({
  components: { Multiselect, FontSizeSelector }
})
export default class GoogleFontSelector extends Input<IGoogleFont> {

  @Inject()
  fontLibraryService: FontLibraryService;

  @Inject()
  sourcesService: SourcesService;

  @Prop()
  value: IGoogleFont;

  fontFamilies: string[] = [];

  fontStyles: string[] = [];

  selectedFamily = '';

  selectedStyle = '';

  loading = true;

  created() {
    this.loading = true;
    this.fontLibraryService.getManifest().then(manifest => {
      this.loading = false;
      this.fontFamilies = manifest.families.map(family => family.name);

      if (this.value.path) this.updateSelectionFromPath();
    });
  }

  updateSelectionFromPath() {
    this.fontLibraryService.lookupFontInfo(this.value.path).then(info => {
      this.selectedFamily = info.family;
      this.selectedStyle = info.style;

      this.updateStyles();
    });
  }

  updateStyles() {
    if (this.selectedFamily) {
      this.fontLibraryService.findFamily(this.selectedFamily).then(fam => {
        this.fontStyles = fam.styles.map(sty => sty.name);
      });
    }
  }

  setFamily(familyName: string) {
    this.loading = true;
    this.selectedFamily = familyName;

    this.fontLibraryService.findFamily(familyName).then(family => {
      const style = family.styles[0];

      this.updateStyles();
      this.setStyle(style.name);
    });
  }

  setStyle(styleName: string) {
    this.loading = true;
    this.selectedStyle = styleName;

    this.fontLibraryService.findStyle(this.selectedFamily, styleName).then(style => {
      this.fontLibraryService.downloadFont(style.file).then(fontPath => {
        this.emitInput({ path: fontPath, size: this.value.size });
        this.loading = false;
      });
    });
  }

  setSize(size: string) {
    this.emitInput({ path: this.value.path, size });
  }

}
