<template>
<div
  :class="{ 'FrameRate-container__disabled': !property.enabled }">
  <label>{{ property.description }}</label>
  <div>
    <tabs :tabs="tabs" style="margin-bottom: 10px;">
      <div slot="simple" class="FrameRate-simple">
        <select>
          <option>30</option>
        </select>
      </div>
      <div slot="rational" class="row FrameRate-rational">
        <div class="small-6 column">
          <label>Numerator</label>
          <input type="text"/>
          <label>Denominator</label>
          <input type="text"/>
        </div>
        <div class="small-6 column">
          <ul class="FrameRate-rationalStats">
            <li>FPS: {{ framesPerSecond }}</li>
            <li>Frame Interval: {{ frameInterval }}</li>
            <li>Min FPS: {{ minFPS }}</li>
            <li>Max FPS: {{ maxFPS }}</li>
          </ul>
        </div>
      </div>
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
  },

  computed: {
    framesPerSecond() {
      return '30';
    },

    frameInterval() {
      return '33.33ms';
    },

    minFPS() {
      return '1/1';
    },

    maxFPS() {
      return '30/1';
    },

    rationalNumerator() {
      return '30';
    },

    rationalDenominator() {
      return '1';
    }
  }

};
</script>

<style lang="less" scoped>
.FrameRate-container__disabled {
  opacity: 0.3;
  pointer-events: none;
}

.FrameRate-simple {
  padding: 10px;
}

.FrameRate-rational {
  padding: 10px 0;
}

.FrameRate-rationalStats {
  list-style-type: none;
  margin: 20px 0;
}
</style>
