<template>
<modal-layout
  title="Settings"
  :show-controls="true"
  :done-handler="done">

  <div slot="content">
    <div class="row">
      <div class="columns small-3">
        <NavMenu v-model="categoryName" class="side-menu">
          <NavItem
            v-for="category in categoriesNames"
            :to="category"
            :enabled="!blackList.includes(category)"
          >
            {{ category }}
          </NavItem>
        </NavMenu>
      </div>
      <div class="columns small-9">
        <GenericForm v-model="settingsData" @input="save"></GenericForm>
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
    let categoryName = 'Stream';
    return {
      categoryName: categoryName,
      blackList: ['Advanced'],
      categoriesNames: this.settingsService.getCategories(),
      settingsData: this.settingsService.getSettings(categoryName)
    }
  },

  computed: {

  },

  methods: {

    save(settingsData) {
      this.settingsService.setSettings(this.categoryName, settingsData);
      this.settingsData = this.settingsService.getSettings(this.categoryName);
    },

    done () {
      windowManager.closeWindow();
    }
  },

  watch: {
    categoryName(categoryName) {
      this.settingsData = this.settingsService.getSettings(categoryName);
    }
  }
};
</script>

<style lang="less" scoped>
  .side-menu {
    position: fixed;
    left: 0;
  }
</style>