<template>
  <modal-layout
    :title="'Source filters (' + sourceName + ')'"
    :show-cancel="false"
    :done-handler="done"
    :fixedSectionHeight="250"
  >
    <SourcePreview slot="fixed" :sourceName="sourceName"></SourcePreview>

    <div slot="content">
      <div class="row">
        <div class="columns small-3">

          <div class="side-menu">
            <NavMenu v-model="selectedFilterName">
              <NavItem v-for="filter in filters" :to="filter" ico="eye">
                {{ filter }}
              </NavItem>
            </NavMenu>
            <div class="controls">
              <div class="fa fa-plus ico-btn" @click="addFilter"></div>
              <div
                class="fa fa-minus ico-btn"
                v-if="selectedFilterName"
                @click="removeFilter"
              >
              </div>
            </div>
          </div>

        </div>
        <div class="columns small-9">
          <div v-if="selectedFilterName">
            <GenericForm v-model="properties" @input="save"></GenericForm>
          </div>
          <div v-if="!selectedFilterName">
            No filters applied
          </div>
        </div>
      </div>
    </div>

  </modal-layout>
</template>

<script>
  import windowManager from '../../util/WindowManager';
  import windowMixin from '../mixins/window';
  import SourceFiltersService from '../../services/source-filters';

  import ModalLayout from '../ModalLayout.vue';
  import NavMenu from '../shared/NavMenu.vue';
  import NavItem from '../shared/NavItem.vue';
  import SourcePreview from '../shared/SourcePreview.vue';
  import GenericForm from '../shared/forms/GenericForm.vue';

  export default {

    mixins: [windowMixin],

    components: {
      ModalLayout,
      NavMenu,
      NavItem,
      GenericForm,
      SourcePreview
    },


    beforeCreate() {
      /**
       * @type {SourceFilterService}
       */
      this.sourceFiltersService = SourceFiltersService.instance;
    },


    data() {
      const { sourceName, selectedFilterName } = windowManager.getOptions();
      const filters = this.sourceFiltersService.getFiltersNames(sourceName);
      const filterName = selectedFilterName || filters[0];
      return {
        sourceName,
        filters,
        selectedFilterName: filterName,
        properties: this.sourceFiltersService.getPropertiesFormData(
          sourceName, filterName
        ),
      };
    },


    watch: {
      selectedFilterName() {
        this.save();
      }
    },


    methods: {

      save() {
        this.sourceFiltersService.setProperties(
          this.sourceName,
          this.selectedFilterName,
          this.properties
        );
        this.properties = this.sourceFiltersService.getPropertiesFormData(
          this.sourceName, this.selectedFilterName
        );
      },


      done() {
        windowManager.closeWindow();
      },


      addFilter() {
        windowManager.showAddSourceFilter(this.sourceName);
      },


      removeFilter() {
        this.sourceFiltersService.remove(this.sourceName, this.selectedFilterName);
        this.filters = this.sourceFiltersService.getFiltersNames(this.sourceName);
        this.selectedFilterName = this.filters[0];
      }
    }
  };
</script>

<style lang="less" scoped>

  .side-menu {
    position: fixed;
    left: 0;
  }

  .controls {
    margin-left: 15px;
    margin-top: 15px;
  }

</style>
