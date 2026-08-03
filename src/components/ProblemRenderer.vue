<script setup>
import MarkdownIt from 'markdown-it'
import taskLists from 'markdown-it-task-lists'
import { computed } from 'vue'
import BaseCard from './BaseCard.vue'

const props = defineProps({ description: { type: String, default: '' } })
const md = new MarkdownIt({ html: false, linkify: true, typographer: true }).use(taskLists)
const html = computed(() => md.render(props.description))
</script>

<template>
  <BaseCard padding="lg" class="problem-description">
    <div v-if="$slots.actions" class="problem-actions"><slot name="actions" /></div>
    <div class="problem-description-body" v-html="html" />
  </BaseCard>
</template>
