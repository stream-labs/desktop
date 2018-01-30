<template>
<div>
  <div class="studio-controls-top">
    <h4 class="studio-controls__label">
      Sources
    </h4>
    <div>
      <i
        class="fa fa-plus icon-btn icon-btn--lg"
        @click="addSource"/>
      <i
        class="fa fa-minus icon-btn icon-btn--lg"
        :class="{ disabled: activeItemIds.length === 0}"
        @click="removeItems"/>
      <i
        :class="{ disabled: !canShowProperties()}"
        class="fa fa-cog icon-btn"
        @click="sourceProperties"/>
    </div>
  </div>
  <selector
    class="studio-controls-selector"
    @contextmenu="showContextMenu"
    @dblclick="sourceProperties"
    :items="sources"
    :activeItems="activeItemIds"
    @select="makeActive"
    @sort="handleSort">
    <template slot="actions" slot-scope="props">
      <i
        class="fa fa-lock icon-btn source-selector-action"
        :class="lockClassesForSource(props.item.value)"
        @click.stop="toggleLock(props.item.value)"
        @dblclick.stop="() => {}" />
      <i
        class="fa fa-eye icon-btn source-selector-action"
        :class="visibilityClassesForSource(props.item.value)"
        @click.stop="toggleVisibility(props.item.value)"
        @dblclick.stop="() => {}" />
    </template>
  </selector>
</div>
</template>

<script lang="ts" src="./SourceSelector.vue.ts"></script>

<style lang="less" scoped>
@import "../styles/index";

.source-selector-action {
  font-size: 16px;
}

.fa.disabled {
  opacity: 0.15;
  cursor: inherit;
  :hover {
    opacity: inherit;
  }
}
</style>
