<template>
<div style="height: 100%">
    <!--
        we use 2 components for situation when we need to open a new window and
        save the previous window-component state
    -->
    <component v-if="components[0].name" v-show="components[0].isShown" :is="components[0].name"/>
    <component v-if="components[1].name" v-show="components[1].isShown" :is="components[1].name"/>
</div>
</template>

<script lang="ts" src="./ChildWindow.vue.ts"></script>
