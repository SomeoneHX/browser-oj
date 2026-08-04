<script setup>
import { ref, watch } from 'vue'
import BaseCard from '../components/BaseCard.vue'
import CodeEditor from '../components/CodeEditor.vue'
import { runIdeCode } from '../utils/ide'
import { getIdeDraft, saveIdeDraft } from '../utils/storage'
import { LANGUAGES } from '../utils/languages'
import { useEmceptionRuntime } from '../composables/useEmceptionRuntime'

const { ready: runtimeReady, ensureChecked } = useEmceptionRuntime()
void ensureChecked()
const draft = getIdeDraft()
const code = ref(draft.code)
const language = ref(draft.language)
const input = ref(draft.input)
watch([code, language, input], ([c, l, i]) => saveIdeDraft({ code: c, language: l, input: i }))
const output = ref('')
const outputError = ref(false)
const running = ref(false)
const outputPlaceholder = '运行代码后在此显示输出'

const languages = LANGUAGES

async function run() {
  if (running.value || !code.value.trim()) return
  running.value = true
  output.value = ''
  outputError.value = false
  const result = await runIdeCode(code.value, language.value, input.value)
  output.value = result.output.trim()
  outputError.value = !!result.error
  running.value = false
}
</script>

<template>
  <div class="page-container ide-page">
    <BaseCard padding="md" class="page-meta-card"><div class="page-meta-row"><div class="page-meta-left"><h2><i class="fas fa-terminal" />在线 IDE</h2></div><div class="page-meta-right"><div class="editor-lang-select"><i class="fas fa-code" /><select :value="language" @change="language = $event.target.value"><option v-for="item in languages" :key="item.id" :value="item.id" :disabled="item.id === 'cpp-wasm' && !runtimeReady">{{ item.label }}</option></select></div></div></div></BaseCard>
    <BaseCard flush class="ide-editor-card"><CodeEditor :value="code" :language="language" :show-toolbar="false" :fill="true" @update:value="code = $event" @update:language="language = $event" /></BaseCard>
    <div class="ide-bottom-grid">
      <BaseCard flush class="ide-panel-card"><div class="ide-panel-header"><span><i class="fas fa-keyboard" />输入</span></div><textarea v-model="input" class="ide-textarea" spellcheck="false" placeholder="标准输入（stdin）" /></BaseCard>
      <BaseCard flush class="ide-panel-card"><div class="ide-panel-header"><span><i class="fas fa-terminal" />输出</span><button class="btn-run" :disabled="running || !code.trim()" @click="run"><i :class="['fas', running ? 'fa-spinner fa-spin' : 'fa-play']" />{{ running ? '运行中...' : '运行' }}</button></div><pre class="ide-output" :class="{ 'ide-output-error': outputError }">{{ output || outputPlaceholder }}</pre></BaseCard>
    </div>
  </div>
</template>
