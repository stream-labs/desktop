<template>
<modal-layout
  title="Settings"
  :show-controls="true"
  :done-handler="done">
  <div slot="content">

    <SideNav>
      <NavItem>General</NavItem>
      <NavItem>Stream</NavItem>
      <NavItem>Advanced</NavItem>
    </SideNav>

    <div v-for="settingsGroup in settingsSubGroups">
      <div>{{ settingsGroup.nameSubCategory }}</div>
      <div v-for="property in settingsGroup.properties">
        {{ property.type }}
        <component
          v-if="property.visible && property.type == 'OBS_PROPERTY_BOOL'"
          :is="propertyComponentForType(property.type)"
          :property="property"/>
      </div>

    </div>

  </div>
</modal-layout>
</template>

<script>
import ModalLayout from '../ModalLayout.vue';
import Obs from '../../api/Obs.js';
import windowManager from '../../util/WindowManager';
import SideNav from '../shared/SideNav.vue';
import NavItem from '../shared/NavItem.vue';
import * as propertyComponents from '../shared/properties';
import { propertyComponentForType } from '../shared/properties/helpers';


export default {

  components: Object.assign({
    ModalLayout,
    SideNav,
    NavItem
  }, propertyComponents),

  methods: {
    done() {
      //windowManager.closeWindow();
    }
  },

  data() {
    console.log(Obs.getSettings('General'));
    return {
      settingsSubGroups: Obs.getSettings('General')
    };
  }

};
</script>
