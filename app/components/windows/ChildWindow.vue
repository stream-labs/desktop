<template>
<div style="height: 100%">
    <!-- <keep-alive> helps to restore previous window from cache -->
    <keep-alive v-if="componentExist">
        <component :is="componentName"/>
    </keep-alive>
</div>
</template>

<script lang="ts" src="./ChildWindow.vue.ts"></script>
