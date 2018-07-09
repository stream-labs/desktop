<template>
<modal-layout
  :title="$t('Scene Transitions')"
  :content-styles="{ padding: 0 }"
  :show-cancel="false"
  :done-handler="done">

  <div slot="content">
    <div v-if="!transitionsEnabled" class="transition-blank">
      {{ $t('You need at least 2 scenes to edit transitions.') }}
    </div>
    <tabs :tabs="tabs" v-model="selectedTab" v-else>
      <div slot="transitions" class="transition-tab">
        <button class="button button--action" @click="addTransition">
          {{$t('Add Transition')}}
        </button>
        <table>
          <tr>
            <th>{{ $t('Default') }}</th>
            <th>{{ $t('Name') }}</th>
            <th>{{ $t('Transition Type') }}</th>
            <th></th><!-- Controls has no header -->
          </tr>
          <tr v-for="transition in transitions" :key="transition.id">
            <td
              class="transition-default-selector"
              @click="makeDefault(transition.id)">
              <i
                v-if="defaultTransitionId === transition.id"
                class="fa fa-circle transition-default" />
              <i
                v-else
                class="fa fa-circle-o" />
            </td>
            <td>{{ transition.name }}</td>
            <td>{{ nameForType(transition.type) }}</td>
            <td>
              <i
                @click="deleteTransition(transition.id)"
                class="fa fa-trash transition-control" />
              <i
                @click="editTransition(transition.id)"
                class="fa fa-pencil transition-control" />
            </td>
          </tr>
        </table>
      </div>
      <div slot="connections" class="transition-tab">
        <button class="button button--action" @click="addConnection">
          {{$t('Add Connection')}}
        </button>
        <table>
          <tr>
            <th>{{ $t('Beginning Scene') }}</th>
            <th>{{ $t('Transition Name') }}</th>
            <th>{{ $t('Ending Scene') }}</th>
            <th></th><!-- Controls has no header -->
          </tr>
          <tr v-for="connection in connections" :key="connection.id">
            <td>{{ getSceneName(connection.fromSceneId) }}</td>
            <td>{{ getTransitionName(connection.transitionId) }}</td>
            <td>{{ getSceneName(connection.toSceneId) }}</td>
            <td>
              <i
                @click="deleteConnection(connection.id)"
                class="fa fa-trash transition-control" />
              <i
                @click="editConnection(connection.id)"
                class="fa fa-pencil transition-control" />
              <i
                v-if="isConnectionRedundant(connection.id)"
                class="fa fa-exclamation-triangle transition-redundant"
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
          {{ $t('Done') }}
        </button>
      </div>
    </modal>
    <modal name="connection-settings" :height="550">
      <div class="connection-settings-modal">
        <connection-settings :connection-id="inspectedConnection"/>
        <button
          class="button button--action transition-done"
          @click="dismissModal('connection-settings')">
          {{ $t('Done') }}
        </button>
      </div>
    </modal>
  </div>

</modal-layout>
</template>

<script lang="ts" src="./SceneTransitions.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/index";

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
  color: @teal;
}

.transition-default-selector {
  text-align: center;
  cursor: pointer;
  width: 90px;

  &:hover {
    :not(.transition-default) {
      color: @white;
    }
  }
}

.transition-control {
  margin-right: 10px;
  cursor: pointer;

  &:hover {
    color: @white;
  }
}

.transition-redundant {
  color: @yellow;
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
  background-color: @navy-secondary;
}
</style>
