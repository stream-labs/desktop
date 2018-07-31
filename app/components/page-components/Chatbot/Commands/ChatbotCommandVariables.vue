<template>
<div>
  <!-- variables -->
  <div class="padding--10">
    <div v-if="variables && variables.length === 0">
      <h2>No variables.</h2>
    </div>
    <table v-else>
      <thead>
        <tr>
          <th>variable</th>
          <th>description</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(variable, index) in variables"
          :key="index"
        >
          <td> {{ $t(index) }} </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
</template>

<script lang='ts' src="./ChatbotCommandVariables.vue.ts"></script>

<style lang="less" scoped>
@import "../../../../styles/index";
tbody tr {
  .transition;
  .cursor--pointer;

  &:hover {
    td {
      color: black;
    }
  }

  td:first-child {
    width: 300px;
  }
  td:last-child {
    width: 100px;
    .align-items--inline;
    .text-align--right;
    padding-right: 10px;
    color: white;

    .icon-edit {
      font-size: 10px;
      .transition;

      &:hover {
        color: @teal;
      }
    }
  }
}


.night-theme {

  tbody tr {
    border: 2px solid transparent;
    .transition;
    .cursor--pointer;
    .transition;

    td {
      color: white;
    }
  }
  tbody tr:nth-child(odd) {
    background-color: @navy-secondary;
  }
  tbody tr:nth-child(even) {
    background-color: @navy;
  }

}
</style>
