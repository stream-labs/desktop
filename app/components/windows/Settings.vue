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

    <GenericForm :data="settingsData"></GenericForm>

  </div>
</modal-layout>
</template>

<script>
import ModalLayout from '../ModalLayout.vue';
import SideNav from '../shared/SideNav.vue';
import NavItem from '../shared/NavItem.vue';
import GenericForm from '../shared/forms/GenericForm.vue'
import windowManager from '../../util/WindowManager';
import SettingsService from '../../services/settings';


export default {

  components: {
    ModalLayout,
    SideNav,
    NavItem,
    GenericForm
  },

  methods: {
    done() {
      //windowManager.closeWindow();
      this.settingsService.setSettings('General', this.settingsService.getSettings('General'))
    }
  },

  data() {
    this.settingsService = SettingsService.instance;
    console.log(this.settingsService.getSettings('General'));
    return {
      settingsData: this.settingsService.getSettings('General')
    };
  }

};
</script>
