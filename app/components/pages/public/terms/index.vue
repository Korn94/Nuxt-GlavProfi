<!-- app/components/pages/public/terms/index.vue -->
<template>
  <div class="terms-of-service-page">
    <header class="page-header">
      <h1>{{ page.title }}</h1>
    </header>

    <main class="page-content">
      <section v-for="section in sections" :key="section.title">
        <h2>{{ section.title }}</h2>

        <!-- Тексты — статические строки из legal/data (репозиторий, не ввод
             пользователя), HTML уже экранирован в toInlineHtml(), поэтому
             v-html безопасен и заменяет десятки ручных <p>/<ul> в шаблоне. -->
        <template v-for="(block, index) in section.blocks" :key="index">
          <p v-if="block.kind === 'text'" v-html="block.html"></p>
          <ul v-else>
            <li v-for="(item, i) in block.items" :key="i" v-html="item"></li>
          </ul>
        </template>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
// Тексты условий живут в legal/data/termsOfService.ts — из них же собирается
// markdown-версия /terms-of-service.md (server/utils/llmsMarkdown.ts), поэтому
// HTML и .md не расходятся.
import { termsOfService } from '../legal/data/termsOfService';
import { toLegalBlockViews } from '~/utils/legalText';

const page = termsOfService;
const sections = page.sections.map((section) => ({
  title: section.title,
  blocks: toLegalBlockViews(section.blocks),
}));
</script>

<style lang="scss" scoped>
.terms-of-service-page {
  margin-top: 5em;
  padding: 40px 20px;
  font-family: Arial, sans-serif;
  line-height: 1.6;
  color: #333;

  @media (max-width: 768px) {
    margin-top: 2em;
  }

  .page-header {
    text-align: center;
    margin-bottom: 40px;

    h1 {
      font-size: 2rem;
      color: #18191b;
    }
  }

  .page-content {
    max-width: 1200px;
    margin: 0 auto;

    section {
      margin-bottom: 30px;

      h2 {
        font-size: 1.5rem;
        // color: #00c3f5;
        margin-bottom: 15px;
      }

      p {
        font-size: 1rem;
        // color: #555;
      }

      ul {
        margin-left: 20px;
        list-style-type: disc;

        li {
          margin-bottom: 5px;
        }
      }
    }
  }
}
</style>
