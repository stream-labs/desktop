<template>
  <div class="nicolive-area">
    <template v-if="!hasProgram">
      <div><button @click="createProgram" :disabled="isCreating">番組作成</button></div>
      <div><button @click="fetchProgram" :disabled="isFetching">番組取得</button></div>
    </template>
    <template v-else>
      <div><button @click="fetchProgram" :disabled="isFetching">番組取得</button></div>
      <div><button @click="editProgram" :disabled="isEditing">番組編集</button></div>
      <div v-if="programStatus === 'test'"><button @click="startProgram" :disabled="isStarting">番組開始</button></div>
      <div v-else-if="programStatus === 'onAir'"><button @click="endProgram" :disabled="isEnding">番組終了</button></div>
      <div v-else><button @click="createProgram" :disabled="isCreating">番組作成</button></div>
      <div><button @click="toggleAutoExtension">自動延長を{{ autoExtensionEnabled ? 'OFF' : 'ON' }}にする</button></div>
      <div>
        <button @click="extendProgram" :disabled="autoExtensionEnabled || isExtending || !isProgramExtendable">
          <template v-if="autoExtensionEnabled">自動延長が有効です</template>
          <template v-else-if="isExtending">延長中です……</template>
          <template v-else-if="isProgramExtendable">延長する</template>
          <template v-else>延長できません</template>
        </button>
      </div>
      <div>
        <h1>{{programTitle}}</h1>
        <div>status: {{ programStatus }}</div>
        <img :src="communitySymbol" /><p>{{communityName}}</p>
        <ul>
          <li>視聴者数: {{ viewers }}</li>
          <li>コメント数: {{ comments }}</li>
          <li>ニコニ広告pt: {{ adPoint }}</li>
          <li>ギフトpt: {{ giftPoint }}</li>
          <li>{{ format(programCurrentTime) }} / {{ format(programTotalTime) }}</li>
        </ul>
      </div>
      <div>
        <h1>番組詳細</h1>
        <div>{{ programDescription }}</div>
      </div>
      <div>
        <input type="text" :readonly="isCommentSending" :disabled="isCommentSending" placeholder="(Ctrl+Enterで固定表示)" v-model="operatorCommentValue" @keydown.enter="sendOperatorComment($event)" >
        <button type="submit" :disabled="isCommentSending" @click="sendOperatorComment($event)">送信</button>
      </div>
    </template>
  </div>
</template>

<script lang="ts" src="./NicoliveArea.vue.ts"></script>
