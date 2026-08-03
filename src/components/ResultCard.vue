<script setup>
defineProps({ result: Object, problem: Object })
</script>

<template>
  <div v-if="result" :class="['result-card', result.status === 'ac' ? 'result-ac' : 'result-wa']">
    <div class="result-header">
      <i :class="['fas', result.status === 'ac' ? 'fa-check-circle' : 'fa-times-circle', 'result-icon']" />
      <span class="result-label">{{ result.status === 'ac' ? '通过' : '未通过' }}</span>
    </div>
    <div class="result-body">
      <template v-if="result.status === 'ac'">
        <p v-if="result.output !== null"><i class="fas fa-terminal" /> 输出匹配: <code>{{ result.output }}</code></p>
        <p v-else><i class="fas fa-check" /> 代码结构符合题目要求</p>
        <p v-if="result.similarity < 1" class="result-note">相似度: {{ (result.similarity * 100).toFixed(0) }}%</p>
      </template>
      <template v-else>
        <p v-if="result.output !== null"><i class="fas fa-terminal" /> 你的输出: <code>{{ result.output }}</code></p>
        <p v-else><i class="fas fa-code" /> 无法提取输出内容</p>
        <p><i class="fas fa-check-double" /> 期望输出: <code>{{ problem.expectedOutput }}</code></p>
        <p v-if="result.similarity > 0 && result.similarity < 1" class="result-note">部分匹配: {{ (result.similarity * 100).toFixed(0) }}%</p>
      </template>
    </div>
  </div>
</template>
