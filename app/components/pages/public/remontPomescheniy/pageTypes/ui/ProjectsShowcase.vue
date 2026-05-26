<!-- app/components/pages/public/remontPomescheniy/pageTypes/ui/ProjectsShowcase.vue -->
 <template>
  <section class="projects-showcase">
    <div class="container">
      <!-- Заголовок -->
      <slot name="header">
        <header class="projects-showcase__header">
          <h2 class="projects-showcase__title" v-html="title" />
          <p v-if="subtitle" class="projects-showcase__subtitle">{{ subtitle }}</p>
        </header>
      </slot>

      <!-- Состояния загрузки / ошибки / пусто -->
      <div v-if="loading" class="projects-showcase__state">
        <div class="projects-showcase__loader">
          <div class="projects-showcase__spinner" />
          <span>Загружаем проекты...</span>
        </div>
      </div>

      <div v-else-if="error" class="projects-showcase__state projects-showcase__state--error">
        <Icon name="mdi:alert-circle-outline" size="32" />
        <p>{{ error }}</p>
        <button class="projects-showcase__retry" @click="fetchProjects">
          Попробовать снова
        </button>
      </div>

      <div v-else-if="displayedProjects.length === 0" class="projects-showcase__state">
        <slot name="empty">
          <Icon name="mdi:folder-open-outline" size="48" />
          <p>Проекты пока не добавлены</p>
        </slot>
      </div>

      <!-- Сетка проектов -->
      <div v-else class="projects-showcase__grid">
        <slot name="list" :projects="displayedProjects">
          <slot
            v-for="project in displayedProjects"
            :key="project.slug || project.id"
            name="card"
            :project="project"
          >
            <!-- Дефолтная карточка -->
            <NuxtLink
              v-if="project.slug"
              :to="`/projects/${project.slug}`"
              class="projects-showcase__card"
            >
              <div class="projects-showcase__card-image">
                <img
                  :src="getMainImage(project.images)"
                  :alt="project.title"
                  loading="lazy"
                />
              </div>
              <div class="projects-showcase__card-overlay">
                <span v-if="project.space" class="projects-showcase__card-space">
                  {{ project.space }} м²
                </span>
                <h3 class="projects-showcase__card-title">{{ project.title }}</h3>
                <p v-if="project.subtitle" class="projects-showcase__card-subtitle">
                  {{ project.subtitle }}
                </p>
                <span class="projects-showcase__card-link">
                  Подробнее
                  <Icon name="weui:arrow-filled" size="16" />
                </span>
              </div>
            </NuxtLink>
          </slot>
        </slot>
      </div>

      <!-- Футер: кнопка "все проекты" -->
      <div v-if="!loading && !error && displayedProjects.length > 0" class="projects-showcase__footer">
        <slot name="footer">
          <NuxtLink :to="allProjectsLink" class="projects-showcase__all-link">
            <span>Показать все проекты</span>
            <Icon name="mdi:arrow-right" size="20" />
          </NuxtLink>
        </slot>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

export interface ProjectImage {
  url: string
  type?: string
}

export interface Project {
  id?: number | string
  slug?: string
  title: string
  subtitle?: string
  space?: number | string
  images?: ProjectImage[]
  [key: string]: unknown
}

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    /** Массив slugs для фильтрации из API */
    slugs?: string[]
    /** Готовый массив проектов (если родитель сам их получил) */
    projects?: Project[]
    /** URL API для загрузки */
    fetchUrl?: string
    /** Ссылка на страницу со всеми проектами */
    allProjectsLink?: string
  }>(),
  {
    fetchUrl: '/api/portfolio',
    allProjectsLink: '/projects',
  }
)

const loading = ref(false)
const error = ref<string | null>(null)
const fetchedProjects = ref<Project[]>([])

// Приоритет: если передан projects — используем его, иначе fetchedProjects
const sourceProjects = computed<Project[]>(() => {
  return props.projects && props.projects.length > 0
    ? props.projects
    : fetchedProjects.value
})

// Фильтрация по slugs (если slugs не передан — показываем все)
const displayedProjects = computed<Project[]>(() => {
  if (!props.slugs || props.slugs.length === 0) {
    return sourceProjects.value
  }
  return sourceProjects.value.filter((p) => p.slug && props.slugs!.includes(p.slug))
})

// Извлекаем главное изображение
const getMainImage = (images?: ProjectImage[]): string => {
  if (!images || images.length === 0) return '/images/placeholder.jpg'
  const main = images.find((img) => img.type === 'main')
  return main?.url || images[0]?.url || '/images/placeholder.jpg'
}

// Загрузка проектов из API
const fetchProjects = async () => {
  // Если передан готовый projects — не фетчим
  if (props.projects && props.projects.length > 0) return

  loading.value = true
  error.value = null

  try {
    const data = await $fetch<{ data?: Project[] } | Project[]>(props.fetchUrl)
    const list = Array.isArray(data) ? data : data?.data
    fetchedProjects.value = Array.isArray(list) ? list : []
  } catch (err) {
    console.error('[ProjectsShowcase] Ошибка загрузки проектов:', err)
    error.value = 'Не удалось загрузить проекты'
    fetchedProjects.value = []
  } finally {
    loading.value = false
  }
}

// Ре-фетч при смене slugs (если не передан projects)
watch(
  () => props.slugs,
  () => {
    if (!props.projects || props.projects.length === 0) {
      fetchProjects()
    }
  }
)

onMounted(() => {
  fetchProjects()
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

span {
  color: unset;
}

.projects-showcase {
  padding: 5rem 0;
  background: $background-light;
  position: relative;

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;

    @media (max-width: 768px) {
      padding: 0 1.2rem;
    }
  }

  // === Заголовок ===
  &__header {
    margin-bottom: 2.5rem;
    max-width: 780px;
  }

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 2.2rem;
    font-weight: 700;
    color: $text-dark;
    margin: 0 0 1rem;
    line-height: 1.25;
    position: relative;
    padding-bottom: 1rem;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 80px;
      height: 4px;
      background: $blue-gradient;
      border-radius: 2px;
      box-shadow: 0 0 10px rgba(0, 195, 245, 0.3);
    }

    @media (max-width: 768px) {
      font-size: 1.7rem;
    }

    :deep(span),
    :deep(.accent) {
      background: $blue-gradient;
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
  }

  &__subtitle {
    font-size: 1.1rem;
    line-height: 1.6;
    color: $text-gray;
    margin: 0;
  }

  // === Состояния ===
  &__state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 4rem 2rem;
    text-align: center;
    color: $text-gray;

    &--error {
      color: $red;
      background: rgba(166, 19, 0, 0.05);
      border: 1px solid rgba(166, 19, 0, 0.2);
      border-radius: $border-radius;
    }

    p {
      font-size: 1.05rem;
      margin: 0;
    }
  }

  &__loader {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    color: $text-gray;
  }

  &__spinner {
    width: 36px;
    height: 36px;
    border: 3px solid $border-color;
    border-top-color: $blue;
    border-radius: 50%;
    animation: spin 0.9s linear infinite;
  }

  &__retry {
    margin-top: 0.5rem;
    padding: 0.6rem 1.3rem;
    background: transparent;
    border: 1px solid $red;
    color: $red;
    border-radius: 50px;
    font-family: 'Rubik', sans-serif;
    font-weight: 500;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.25s ease;

    &:hover {
      background: $red;
      color: #fff;
    }
  }

  // === Сетка проектов ===
  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.5rem;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 1.2rem;
    }
  }

  // === Карточка проекта ===
  &__card {
    position: relative;
    display: block;
    border-radius: $border-radius;
    overflow: hidden;
    aspect-ratio: 16 / 10;
    background: $background-gray;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    transition: transform 0.4s ease, box-shadow 0.4s ease;
    text-decoration: none;

    &:hover {
      transform: translateY(-6px);
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.18);

      .projects-showcase__card-image img {
        transform: scale(1.08);
      }

      .projects-showcase__card-link {
        gap: 0.7rem;
        color: $yellow;

        :deep(.icon) {
          transform: translateX(4px);
        }
      }
    }
  }

  &__card-image {
    position: absolute;
    inset: 0;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.6s ease;
    }
  }

  &__card-overlay {
    position: absolute;
    inset: 0;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    background: linear-gradient(
      to top,
      rgba(24, 25, 27, 0.95) 0%,
      rgba(24, 25, 27, 0.5) 50%,
      rgba(24, 25, 27, 0.1) 100%
    );
    color: #fff;
  }

  &__card-space {
    position: absolute;
    top: 1.2rem;
    right: 1.2rem;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(8px);
    color: #fff;
    padding: 0.3rem 0.75rem;
    border-radius: 50px;
    font-size: 0.82rem;
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  &__card-title {
    font-family: 'Rubik', sans-serif;
    font-size: 1.4rem;
    font-weight: 700;
    margin: 0 0 0.3rem;
    color: #fff;
    line-height: 1.25;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  }

  &__card-subtitle {
    font-size: 0.95rem;
    color: rgba(255, 255, 255, 0.85);
    margin: 0 0 0.8rem;
    line-height: 1.4;
  }

  &__card-link {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    color: $blue-light;
    font-size: 0.95rem;
    font-weight: 600;
    transition: all 0.3s ease;

    :deep(.icon) {
      transition: transform 0.3s ease;
    }
  }

  // === Футер ===
  &__footer {
    margin-top: 2.5rem;
    display: flex;
    justify-content: center;
  }

  &__all-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.9rem 2rem;
    background: $blue-gradient;
    color: $background-dark;
    font-family: 'Rubik', sans-serif;
    font-weight: 600;
    font-size: 1rem;
    border-radius: 50px;
    text-decoration: none;
    box-shadow: 0 6px 20px rgba(0, 195, 245, 0.3);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 28px rgba(0, 195, 245, 0.45);
      color: $background-dark;
    }

    &:active {
      transform: translateY(-1px);
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// === Адаптив ===
@media (max-width: 768px) {
  .projects-showcase {
    padding: 3.5rem 0;

    &__header {
      margin-bottom: 2rem;
    }

    &__card-title {
      font-size: 1.2rem;
    }

    &__card-overlay {
      padding: 1.2rem;
    }
  }
}
</style>