<template>
<modal-layout
  title="Settings"
  :show-controls="true"
  :done-handler="done">

  <div slot="content">
    <div class="row">
      <div class="columns small-3">
        <NavMenu v-model="categoryName" class="side-menu">
          <NavItem v-for="category in categoriesNames" :to="category">{{ category }}</NavItem>
        </NavMenu>
      </div>
      <div class="columns small-9">
        <GenericForm v-model="settingsData"></GenericForm>
      </div>
    </div>
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

  data () {
    return {
      categoryName: 'General',
      categoriesNames: this.settingsService.getCategories()
    }
  },

  computed: {
    settingsData() {return this.settingsService.getSettings(this.categoryName)}
  },

  methods: {
    done () {
      this.settingsService.setSettings(this.categoryName, this.settingsData);
      windowManager.closeWindow();
    }
  },
};
</script>

<style lang="less" scoped>
  .side-menu {
    position: fixed;
    left: 0;
  }
</style>