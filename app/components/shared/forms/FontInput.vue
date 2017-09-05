<template>
<div>
  <div class="input-container">
    <div class="input-label">
    </div>
    <div class="input-wrapper">
      <div class="checkbox">
        <input
          type="checkbox"
          :checked="isGoogleFont"
          @change="setFontType"
        />
        <label>Use Google Font</label>
      </div>
    </div>
  </div>
  <google-font-selector
    v-if="isGoogleFont"
    :value="googleFont"
    @input="setGoogleFont"/>
  <system-font-selector
    v-else
    :value="value"
    @input="setFont"/>
</div>
</template>

<script lang="ts">
import { Component, Prop } from 'vue-property-decorator';
import { Input, IFormInput, TObsType, IFont, IGoogleFont } from './Input';
import GoogleFontSelector from './GoogleFontSelector.vue';
import SystemFontSelector from './SystemFontSelector.vue';

@Component({
  components: { GoogleFontSelector, SystemFontSelector }
})
class FontInput extends Input<IFormInput<IFont>> {

  static obsType: TObsType;

  @Prop()
  value: IFormInput<IFont>;

  isGoogleFont = !!this.value.value.path;

  setFont(font: IFormInput<IFont>) {
    this.emitInput(font);
  }


  setGoogleFont(font: IGoogleFont) {
    this.emitInput({
      ...this.value,
      value: {
        path: font.path,
        size: Number(font.size)
      }
    });
  }


  get googleFont() {
    return {
      path: this.value.value.path,
      size: this.value.value.size
    };
  }


  setFontType(e: Event) {
    this.isGoogleFont = e.target['checked'];
  }

}

FontInput.obsType = 'OBS_PROPERTY_FONT';

export default FontInput;
</script>
