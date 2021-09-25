<template>
  <modal-layout :content-styles="{ padding: 0 }" :show-cancel="false" :done-handler="done">
    <div slot="content">
      <div v-if="!transitionsEnabled" class="transition-blank">
        {{ $t('You need at least 2 scenes to edit transitions.') }}
      </div>
      <tabs :tabs="tabs" className="scene-transition__tabs" v-model="selectedTab" v-else>
        <div slot="transitions" class="transition-tab">
          <button class="button button--action" @click="addTransition">
            {{ $t('Add Transition') }}
          </button>
          <table style="width: 100%">
            <thead>
              <tr>
                <th>{{ $t('Default') }}</th>
                <th>{{ $t('Name') }}</th>
                <th>{{ $t('Transition Type') }}</th>
                <th class="table__controls"></th>
                <!-- Controls has no header -->
              </tr>
            </thead>
            <tbody>
              <tr v-for="transition in transitions" :key="transition.id">
                <td class="transition-default-selector" @click="makeDefault(transition.id)">
                  <i
                    v-if="defaultTransitionId === transition.id"
                    class="fas fa-circle transition-default"
                  />
                  <i v-else class="far fa-circle" />
                </td>
                <td>{{ transition.name }}</td>
                <td>{{ nameForType(transition.type) }}</td>
                <td class="table__controls">
                  <i
                    @click="editTransition(transition.id)"
                    class="transition-control"
                    :class="getClassNames(transition.id)"
                    :title="getEditableMessage(transition.id)"
                  />

                  <i
                    @click="deleteTransition(transition.id)"
                    class="icon-trash transition-control"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div slot="connections" class="transition-tab">
          <button class="button button--action" @click="addConnection">
            {{ $t('Add Connection') }}
          </button>
          <table style="width: 100%">
            <thead>
              <tr>
                <th>{{ $t('Beginning Scene') }}</th>
                <th>{{ $t('Transition Name') }}</th>
                <th>{{ $t('Ending Scene') }}</th>
                <th class="table__controls"></th>
                <!-- Controls has no header -->
              </tr>
            </thead>
            <tbody>
              <tr v-for="connection in connections" :key="connection.id">
                <td>{{ getSceneName(connection.fromSceneId) }}</td>
                <td>{{ getTransitionName(connection.transitionId) }}</td>
                <td>{{ getSceneName(connection.toSceneId) }}</td>
                <td class="table__controls">
                  <i
                    v-if="isConnectionRedundant(connection.id)"
                    class="icon-information transition-redundant"
                    v-tooltip="redundantConnectionTooltip"
                  />
                  <i @click="editConnection(connection.id)" class="icon-edit transition-control" />
                  <i
                    @click="deleteConnection(connection.id)"
                    class="icon-trash transition-control"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </tabs>
      <modal name="transition-settings" :height="550">
        <scrollable className="transition-settings-modal">
          <transition-settings :transition-id="inspectedTransition" />
          <button
            class="button button--action transition-done"
            @click="dismissModal('transition-settings')"
          >
            {{ $t('Done') }}
          </button>
        </scrollable>
      </modal>
      <modal name="connection-settings" :height="550">
        <div class="connection-settings-modal">
          <connection-settings :connection-id="inspectedConnection" />
          <button
            class="button button--action transition-done"
            @click="dismissModal('connection-settings')"
          >
            {{ $t('Done') }}
          </button>
        </div>
      </modal>
    </div>
  </modal-layout>
</template>

<script lang="ts" src="./SceneTransitions.vue.ts"></script>

<style lang="less">
.scene-transition__tabs {
  padding: 0 20px !important;
}
</style>

<style lang="less" scoped>
@import '../../styles/index';

.controls {
  padding-top: 30px;
}

.transition-blank {
  text-align: center;
  padding: 50px;
}

.transition-settings-modal {
  padding: 20px;
  height: 100%;
}

.connection-settings-modal {
  padding: 20px;
}

.transition-tab {
  padding: 20px;
}

.transition-default {
  color: var(--teal);
}

.transition-default-selector {
  cursor: pointer;
  width: 90px;

  &:hover {
    :not(.transition-default) {
      color: var(--white);
    }
  }
}

.transition-control {
  margin-left: 10px;
}

.transition-control:not(.disabled) {
  cursor: pointer;
  .icon-hover();
}

.transition-redundant {
  color: var(--info);

  &:hover {
    color: var(--info);
  }
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
</style>
