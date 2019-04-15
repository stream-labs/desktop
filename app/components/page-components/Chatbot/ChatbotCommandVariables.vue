<template>
  <div>
    <div class="flex padding--10">
      <input
        v-model="searchQuery"
        type="text"
        class="chatbot__input--search width--auto margin--10"
        placeholder="Search"
      >
    </div>
    <div class="padding--10 margin-horizontal--10">
      <!-- variables -->
      <div
        class="accordion-container"
        v-for="(variableArr, slugName, index) in filteredVariables"
        :key="index"
      >
        <h2>{{ $t(slugName)}}</h2>
        <Accordion
          v-for="(variable, index) in variableArr"
          :key="index"
          :closedTitle="variable.variable"
          :openedTitle="variable.variable"
          class="width--100"
        >
          <div slot="toggle" @click.stop>
            <div class="flex flex--space-between">
              <span class="accordion-spacer">
                <div class="margin-right--20">{{ variable.variable }}</div>
                <p style="font-weight:normal">{{ variable.description }}</p>
              </span>
              <div>
                <Badge
                  v-for="(tag,tagIndex) in variable.tags"
                  :small="true"
                  :key="tagIndex"
                  :variant="'tag'"
                  :align-left="true"
                >{{tag}}</Badge>
              </div>
            </div>
          </div>
          <div slot="content">
            <h4>Usage</h4>
            <pre>{{variable.example}}</pre>
            <h4>Result</h4>
            <pre>{{variable.result}}</pre>
          </div>
        </Accordion>
      </div>
    </div>
  </div>
</template>

<script lang='ts' src="./ChatbotCommandVariables.vue.ts"></script>

<style lang="less" scoped>
@import '../../../styles/index';
.accordion-container {
  .margin-bottom(3.75);
}
.accordion-spacer {
  display: flex;
  flex-wrap: wrap;

  p {
    margin-bottom: 0px;
  }
}
pre {
  background-color: var(--section-alt);
  white-space: pre-wrap;
  word-wrap: break-word;
  text-align: justify;
  .padding(1);
  .radius(1);
  .margin-bottom(3);
  font-family: monospace,monospace;
  font-size: 1em;
}
</style>
