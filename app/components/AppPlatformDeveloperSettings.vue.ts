import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { metadata } from 'components/shared/inputs';
import FormGroup from 'components/shared/inputs/FormGroup.vue';

@Component({
  components: { FormGroup }
})
export default class AppPlatformDeveloperSettings extends Vue {

  appPathMetadata = metadata.file({
    title: 'Unpacked App Path',
    tooltip: 'This is the path to your unpacked app.  ' +
      'It should be a folder containing a valid manifest.json',
    directory: true
  });

  appPathValue = 'test';

}
