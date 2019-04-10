<template>
  <div>
    <div class="flex flex--space-between padding--10">
      <input
        v-model="searchQuery"
        type="text"
        class="chatbot__input--search width--auto margin--10"
        placeholder="Search"
      >
      <button
        class="button button--action button--add-command margin--10"
        @click="openAddModal()"
      >{{ $t('Add Regular') }}</button>
    </div>

    <div class="section__body" v-if="users">
      <div v-if="users.data.length == 0">
        <empty-section
          :variation="'text'"
          :title="$t('You don\'t have any users yet')"
          :subtitle="$t('Try adding one')"
        ></empty-section>
      </div>
      <div v-else>
        <table>
          <thead>
            <tr>
              <th>{{ $t('Platform') }}</th>
              <th>{{ $t('Role') }}</th>
              <th>{{ $t('User') }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users.data" :key="user.id">
              <td>{{ user.platform }}</td>
              <td>{{ $t('Regular') }}</td>
              <td>{{ user.user }}</td>
              <td>
                <div class="flex flex--end align-items--inline">
                  <i class="icon-trash padding--5 cursor--pointer" @click="openDeleteModal(user)"/>
                  <i class="fas icon-edit padding--5 cursor--pointer" @click="openAddModal(user)"/>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <ChatbotPagination
          v-if="totalPages > 1"
          :totalPages="totalPages"
          :currentPage="currentPage"
          @change="fetchRegulars"
        />
      </div>

      <div class="margin-top--25"></div>
    </div>

    <ModalComp
      :type="'confirmation'"
      :width="400"
      :subTitle="$t(`Delete ‘${selectedUser ? selectedUser.user : ''}’`)"
      :text="$t(`Are you sure you want to delete ‘${ selectedUser ? selectedUser.user: ''}’? This action cannot be undone.`)"
      @confirm="onDeleteUser"
    ></ModalComp>
  </div>
</template>

<script lang='ts' src="./ChatbotUserManagement.vue.ts"></script>

<style lang="less" scoped>
@import '../../../../styles/index';
.section__body {
  .padding--10;
  .margin-horizontal--10;
}
.cloudbot-button__container {
  .padding-bottom(2);

  input {
    margin-left: 0;
  }

  button {
    margin-right: 0;
  }
}

.cloudbot-edit {
  padding-left: 5px;
  padding-right: 5px;
}
</style>