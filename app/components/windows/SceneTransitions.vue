<template>
<modal-layout
  :title="$t('transitions.sceneTransition')"
  bare-content
  :show-cancel="false"
  :done-handler="done">

  <div slot="content">
    <div v-if="!transitionsEnabled" class="transition-blank">
      {{ $t('transitions.mustHaveLeastTwoScenes') }}
    </div>
    <tabs :tabs="tabs" v-model="selectedTab" v-else>
      <div slot="transitions" class="transition-tab">
        <button class="button button--action" @click="addTransition">
          {{$t('transitions.addTransition')}}
        </button>
        <table>
          <tr>
            <th>{{ $t('transitions.default') }}</th>
            <th>{{ $t('transitions.transitionName') }}</th>
            <th>{{ $t('transitions.transitionType') }}</th>
            <th class="table__controls"></th><!-- Controls has no header -->
          </tr>
          <tr v-for="transition in transitions" :key="transition.id">
            <td
              class="transition-default-selector"
              @click="makeDefault(transition.id)">
              <i
                v-if="defaultTransitionId === transition.id"
                class="icon-check transition-default" />
            </td>
            <td>{{ transition.name }}</td>
            <td>{{ nameForType(transition.type) }}</td>
            <td class="table__controls">
              <i
                @click="deleteTransition(transition.id)"
                class="icon-delete transition-control" />
              <i
                @click="editTransition(transition.id)"
                class="icon-edit transition-control" />
            </td>
          </tr>
        </table>
      </div>
      <div slot="connections" class="transition-tab">
        <button class="button button--action" @click="addConnection">
          {{$t('transitions.addConnection')}}
        </button>
        <table>
          <tr>
            <th>{{ $t('transitions.connectionFrom') }}</th>
            <th>{{ $t('transitions.transitionName') }}</th>
            <th>{{ $t('transitions.connectionTo') }}</th>
            <th class="table__controls"></th><!-- Controls has no header -->
          </tr>
          <tr v-for="connection in connections" :key="connection.id">
            <td>{{ getSceneName(connection.fromSceneId) }}</td>
            <td>{{ getTransitionName(connection.transitionId) }}</td>
            <td>{{ getSceneName(connection.toSceneId) }}</td>
            <td class="table__controls">
              <i
                @click="deleteConnection(connection.id)"
                class="icon-delete transition-control" />
              <i
                @click="editConnection(connection.id)"
                class="icon-edit transition-control" />
              <i
                v-if="isConnectionRedundant(connection.id)"
                class="icon-warning transition-redundant"
                v-tooltip="redundantConnectionTooltip"/>
            </td>
          </tr>
        </table>
      </div>
    </tabs>
    <modal name="transition-settings" :height="550">
      <div class="transition-settings-modal">
        <transition-settings :transition-id="inspectedTransition"/>
        <button
          class="button button--action transition-done"
          @click="dismissModal('transition-settings')">
          {{ $t('common.done') }}
        </button>
      </div>
    </modal>
    <modal name="connection-settings" :height="550">
      <div class="connection-settings-modal">
        <connection-settings :connection-id="inspectedConnection"/>
        <button
          class="button button--action transition-done"
          @click="dismissModal('connection-settings')">
          {{ $t('common.done') }}
        </button>
      </div>
    </modal>
  </div>

</modal-layout>
</template>

<script lang="ts" src="./SceneTransitions.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/_colors";
@import "../../styles/mixins";

.controls {
  padding-top: 30px;
}

.transition-blank {
  text-align: center;
  padding: 50px;
}

.transition-settings-modal {
  padding: 20px;
}

.connection-settings-modal {
  padding: 20px;
}

.transition-tab {
  padding: 20px;
}

.transition-default {
  color: @text-primary;
}

.transition-default-selector {
  cursor: pointer;
  width: 90px;

  &:hover {
    :not(.transition-default) {
      color: @white;
    }
  }
}

.transition-control {
  margin-left: 10px;
  cursor: pointer;
  .icon-hover;
}

.transition-redundant {
  color: @accent;
}

.button {
  line-height: 26px;
  height: 26px;
  float: right;
}

.transition-done {
  position: absolute;
  bottom: 20px;
  right: 20px;
}

th, td {
  text-align: left;
  padding: 8px;
}

tr:nth-child(even) {
  background-color: @bg-secondary;
}
</style>
