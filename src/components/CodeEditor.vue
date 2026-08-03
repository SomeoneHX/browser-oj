<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { EditorState, Compartment } from '@codemirror/state'
import { basicSetup } from 'codemirror'
import { EditorView, keymap } from '@codemirror/view'
import { cpp } from '@codemirror/lang-cpp'
import { javascript } from '@codemirror/lang-javascript'

const props = defineProps({ value: { type: String, default: '' }, language: { type: String, default: 'cpp' } })
const emit = defineEmits(['update:value', 'update:language'])
const editorElement = ref(null)
const languageCompartment = new Compartment()
let view

const languageExtension = (language) => language === 'javascript' ? javascript() : cpp()

onMounted(() => {
  view = new EditorView({
    state: EditorState.create({
      doc: props.value,
      extensions: [
        basicSetup,
        languageCompartment.of(languageExtension(props.language)),
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

const languages = [
  { id: 'c', label: 'C (JSCPP)' },
  { id: 'cpp', label: 'C++ (JSCPP)' },
  { id: 'javascript', label: 'JavaScript' },
]
</script>

<template>
  <div class="code-editor-panel">
    <div class="editor-toolbar">
      <div class="editor-lang-select"><i class="fas fa-code" /><select :value="language" @change="emit('update:language', $event.target.value)"><option v-for="item in languages" :key="item.id" :value="item.id">{{ item.label }}</option></select></div>
    </div>
    <div ref="editorElement" class="editor-container" />
  </div>
</template>
