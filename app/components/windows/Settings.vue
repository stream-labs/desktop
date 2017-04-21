<template>
<modal-layout
  title="Settings"
  :show-controls="true"
  :done-handler="done">
  <div slot="content">
    <NavMenu v-model="categoryName">
      <NavItem v-for="category in categoriesNames" :to="category">{{ category }}</NavItem>
    </NavMenu>
    <GenericForm v-model="settingsData"></GenericForm>
  </div>
</modal-layout>
</template>

<script>
import ModalLayout from '../ModalLayout.vue';
import NavMenu from '../shared/NavMenu.vue';
import NavItem from '../shared/NavItem.vue';
import GenericForm from '../shared/forms/GenericForm.vue';
import windowManager from '../../util/WindowManager';
import SettingsService from '../../services/settings';


export default {

  components: {
    ModalLayout,
    NavMenu,
    NavItem,
    GenericForm
  },

  beforeCreate() {
    this.settingsService = SettingsService.instance;
  },

  methods: {
    done () {
      console.log(this.settingsData);
      this.settingsService.setSettings(this.categoryName, this.settingsData)
    }
  },

  data () {
    return {
      categoryName: 'General',
      categoriesNames: this.settingsService.getCategories()
    }
  },

  computed: {
    settingsData() {
      console.log(this.settingsService.getSettings(this.categoryName));
      return this.settingsService.getSettings(this.categoryName)
    }
  }

};
</script>
