<!-- app/components/pages/public/remontPomescheniy/pageTypes/ui/Breadcrumbs.vue -->
 <template>
  <nav class="breadcrumbs" aria-label="Хлебные крошки">
    <div class="breadcrumbs__container">
      <ol class="breadcrumbs__list" itemscope itemtype="https://schema.org/BreadcrumbList">
        <li
          v-for="(crumb, index) in items"
          :key="crumb.to || crumb.label"
          class="breadcrumbs__item"
          :class="{ 'breadcrumbs__item--current': index === items.length - 1 }"
          itemprop="itemListElement"
          itemscope
          itemtype="https://schema.org/ListItem"
        >
          <NuxtLink
            v-if="crumb.to && index !== items.length - 1"
            :to="crumb.to"
            class="breadcrumbs__link"
            itemprop="item"
          >
            <span itemprop="name">{{ crumb.label }}</span>
          </NuxtLink>
          <span
            v-else
            class="breadcrumbs__current"
            itemprop="name"
            aria-current="page"
          >
            {{ crumb.label }}
          </span>
          <meta itemprop="position" :content="String(index + 1)" />
        </li>
      </ol>
    </div>
  </nav>
</template>

<script setup lang="ts">
export interface BreadcrumbItem {
  label: string
  to?: string
}

defineProps<{
  items: BreadcrumbItem[]
}>()
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

span {
  color: unset;
}

.breadcrumbs {
  background: $background-dark;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding: 1rem 0;

  &__container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;

    @media (max-width: 768px) {
      padding: 0 1.2rem;
    }
  }

  &__list {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: 0.88rem;
  }

  &__item {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: rgba($text-light, 0.55);

    &:not(:last-child)::after {
      content: '/';
      color: rgba($text-light, 0.25);
    }

    &--current {
      color: rgba($text-light, 0.9);
    }
  }

  &__link {
    color: rgba($text-light, 0.65);
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: $blue-light;
    }
  }

  &__current {
    color: rgba($text-light, 0.9);
    font-weight: 500;
  }
}
</style>