<script>
/**
 * base component for custom input fields
 * @tutorial: https://vuejs.org/v2/guide/components.html#Form-Input-Components-using-Custom-Events
 */
import Vue from 'vue';

export default Vue.extend({

  props: {
    value: {},
    enabled: { type: Boolean, default: true }
  },

});


</script>
