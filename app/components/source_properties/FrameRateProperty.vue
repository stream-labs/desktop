<template>
<div :class="{ 'FrameRate-container__disabled': !property.enabled }">
  <label>{{ property.description }}</label>
  <div>
    <tabs :tabs="tabs">
      <div slot="simple">Simple</div>
      <div slot="rational">Rational</div>
    </tabs>
  </div>
</div>
</template>

<script>
import Tabs from '../Tabs.vue';

export default {

  components: {
    Tabs
  },

  props: [
    'property'
  ],

  data() {
    return {
      // Simple vs Rational Values
      mode: 'simple',

      tabs: [
        {
          name: 'Simple FPS Values',
          value: 'simple'
        },
        {
          name: 'Rational FPS Values',
          value: 'rational'
        }
      ]
    };
  },

  methods: {

    setValue(event) {
      this.$store.dispatch({
        type: 'setSourceProperty',
        property: this.property,
        propertyValue: event.target.value
      });
    }
  }

};
</script>

<style lang="less" scoped>
.FrameRate-container__disabled {
  opacity: 0.3;
  pointer-events: none;
}
</style>
