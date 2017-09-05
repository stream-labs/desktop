<template>
<div class="input-container">
  <div class="input-label">
    <label>Font Size</label>
  </div>
  <div class="input-wrapper">
    <multiselect
      class="multiselect--font"
      :value="value"
      :options="fontSizePresets"
      :close-on-select="true"
      :allow-empty="false"
      @input="setFontSizePreset">
      <template slot="option" scope="props">
        <span>
          {{ props.option }}
        </span>
      </template>
    </multiselect>
  </div>
</div>
</template>

<script lang="ts">
import { Input } from './Input';
import { Component, Prop } from 'vue-property-decorator';
import { Multiselect } from 'vue-multiselect';

@Component({ components: { Multiselect } })
export default class FontSizeSelector extends Input<number> {

  @Prop()
  value: number;

  setFontSizePreset(size: string) {
    this.emitInput(Number(size));
  }

  get fontSizePresets() {
    return [
      '9',
      '10',
      '11',
      '12',
      '13',
      '14',
      '18',
      '24',
      '36',
      '48',
      '64',
      '72',
      '96',
      '144',
      '288'
    ];
  }

}

</script>
