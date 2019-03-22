<template>
  <div>
    <img :src="communitySymbol" />
    <h1>{{programTitle}}</h1>
    <h2>{{communityName}}</h2>
    <div>
      <span>視聴者数: {{ viewers }}</span>
      <span>コメント数: {{ comments }}</span>
      <span>ニコニ広告pt: {{ adPoint }}</span>
      <span>ギフトpt: {{ giftPoint }}</span>
    </div>
    <div>status: {{ programStatus }}</div>
    <div v-if="programStatus === 'onAir'"><button @click="endProgram" :disabled="isEnding">番組終了</button></div>
    <div v-else-if="programStatus === 'end'"><button @click="createProgram" :disabled="isCreating">番組作成</button></div>
    <div v-else><button @click="startProgram" :disabled="isStarting || programStatus === 'reserved'">番組開始</button></div>
  </div>
</template>

<script lang="ts" src="./ProgramInfo.vue.ts"></script>
