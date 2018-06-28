<template>
<modal-layout
  :title="$t('Scene Transitions')"
  :done-handler="done">

  <div slot="content">
    <div v-if="!transitionsEnabled">
      You need at least 2 scenes to edit transitions.
    </div>
    <tabs :tabs="tabs" v-else>
      <div slot="transitions">
        <button class="button button--action" @click="addTransition">
          {{$t('Add Transition')}}
        </button>
        <ul>
          <li v-for="transition in transitions" :key="transition.id">
            {{ transition.name }}
            <button @click="editTransition(transition.id)">Edit</button>
            <button @click="deleteTransition(transition.id)">Delete</button>
            <span v-if="defaultTransitionId === transition.id">[IS DEFAULT]</span>
            <button v-else @click="makeDefault(transition.id)">Make Default</button>
          </li>
        </ul>
      </div>
      <div slot="connections">
        <button class="button button--action" @click="addConnection">
          {{$t('Add Connection')}}
        </button>
        <ul>
          <li v-for="connection in connections" :key="connection.id">
            From: {{ getSceneName(connection.fromSceneId) }}
            Transition: {{ getTransitionName(connection.transitionId) }}
            To: {{ getSceneName(connection.toSceneId) }}
            <button @click="editConnection(connection.id)">Edit</button>
            <button @click="deleteConnection(connection.id)">Delete</button>
            <span v-if="isConnectionRedundant(connection.id)">[REDUNDANT]</span>
          </li>
        </ul>
      </div>
    </tabs>
    <modal name="transition-settings" :height="550">
      <div class="transition-settings-modal">
        <transition-settings :transition-id="inspectedTransition"/>
      </div>
    </modal>
    <modal name="connection-settings" :height="550">
      <div class="connection-settings-modal">
        <connection-settings :connection-id="inspectedConnection"/>
      </div>
    </modal>
  </div>

</modal-layout>
</template>

<script lang="ts" src="./SceneTransitions.vue.ts"></script>

<style lang="less" scoped>
.controls {
  padding-top: 30px;
}

.transition-settings-modal {
  padding: 20px;
}

.connection-settings-modal {
  padding: 20px;
}
</style>
