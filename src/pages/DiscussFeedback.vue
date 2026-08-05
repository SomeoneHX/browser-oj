<script setup lang="ts">
import Giscus from '@giscus/vue'
import BaseCard from '../components/BaseCard.vue'
</script>

<template>
  <div class="page-container">
    <BaseCard padding="md" class="page-meta-card">
      <div class="page-meta-row">
        <div class="page-meta-left">
          <RouterLink to="/discuss" class="header-back-link" title="返回讨论区"><i class="fas fa-arrow-left" /></RouterLink>
          <h2><i class="fas fa-bullhorn" />Browser OJ 反馈建议</h2>
        </div>
      </div>
    </BaseCard>
    <div class="discuss-detail-layout">
      <BaseCard padding="md" class="discuss-giscus-card">
        <Giscus
          repo="SomeoneHX/browser-oj"
          repoId="R_kgDOTqBmow"
          category="Announcements"
          categoryId="DIC_kwDOTqBmo84DCt2A"
          mapping="specific"
          term="browser-oj-feedback"
          strict="0"
          reactions-enabled="1"
          emit-metadata="0"
          input-position="bottom"
          theme="light"
          lang="zh-CN"
          :lazyLoad="true"
        />
      </BaseCard>
      <BaseCard padding="md" class="discuss-guide-card">
        <h3><i class="fas fa-circle-info" />反馈说明</h3>
        <p>欢迎提出对 Browser OJ 的问题、建议与改进想法。</p>
        <ul>
          <li>功能异常与使用问题</li>
          <li>界面与交互改进建议</li>
          <li>题目、评测或内容建议</li>
          <li>其他产品反馈</li>
        </ul>
        <p class="discuss-guide-note"><i class="fas fa-lightbulb" />请尽可能说明复现步骤、浏览器和错误现象，方便定位问题。</p>
      </BaseCard>
    </div>
  </div>
</template>
