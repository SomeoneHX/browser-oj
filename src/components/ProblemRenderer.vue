<script setup>
import MarkdownIt from 'markdown-it'
import taskLists from 'markdown-it-task-lists'
import { computed } from 'vue'

const props = defineProps({ description: { type: String, default: '' } })
const md = new MarkdownIt({ html: false, linkify: true, typographer: true }).use(taskLists)
const html = computed(() => md.render(props.description))
</script>

<template><div class="problem-description" v-html="html" /></template>
