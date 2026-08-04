<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { EditorState, Compartment } from '@codemirror/state'
import { basicSetup } from 'codemirror'
import { EditorView, keymap } from '@codemirror/view'
import { indentWithTab } from '@codemirror/commands'
import { indentUnit } from '@codemirror/language'
import { cpp } from '@codemirror/lang-cpp'
import { javascript } from '@codemirror/lang-javascript'
import BaseCard from './BaseCard.vue'
import { LANGUAGES } from '../utils/languages'
import { useEmceptionRuntime } from '../composables/useEmceptionRuntime'
import type { LanguageId } from '../types'

const props = withDefaults(defineProps<{ value?: string; language?: LanguageId; showToolbar?: boolean; height?: string; fill?: boolean }>(), { value: '', language: 'cpp', showToolbar: true, height: '420px', fill: false })
const emit = defineEmits<{ 'update:value': [value: string]; 'update:language': [value: LanguageId] }>()
const editorElement = ref<HTMLDivElement | null>(null)
const languageCompartment = new Compartment()
let view: EditorView | null = null

const languageExtension = (language: LanguageId) => (language === 'javascript' ? javascript() : cpp())

onMounted(() => {
  if (!editorElement.value) return
  view = new EditorView({
    state: EditorState.create({
      doc: props.value,
      extensions: [
        basicSetup,
        indentUnit.of('    '),
        languageCompartment.of(languageExtension(props.language)),
        keymap.of([indentWithTab]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) emit('update:value', update.state.doc.toString())
        }),
      ],
    }),
    parent: editorElement.value,
  })
})

watch(() => props.value, (value) => {
  if (!view || value === view.state.doc.toString()) return
  view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } })
})

watch(() => props.language, (language) => {
  if (view) view.dispatch({ effects: languageCompartment.reconfigure(languageExtension(language)) })
})

onBeforeUnmount(() => view?.destroy())

const { ready: runtimeReady } = useEmceptionRuntime()

const languages = LANGUAGES

const onLanguageChange = (event: Event) => {
  emit('update:language', (event.target as HTMLSelectElement).value as LanguageId)
}
</script>

<template>
  <BaseCard flush class="code-editor-panel">
    <div v-if="showToolbar" class="editor-toolbar">
      <div class="editor-lang-select"><i class="fas fa-code" /><select :value="language" @change="onLanguageChange"><option v-for="item in languages" :key="item.id" :value="item.id" :disabled="item.id === 'cpp-wasm' && !runtimeReady">{{ item.label }}</option></select></div>
    </div>
    <div ref="editorElement" class="editor-container" :style="{ height: props.fill ? '100%' : props.height }" />
  </BaseCard>
</template>
