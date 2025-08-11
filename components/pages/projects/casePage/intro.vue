<template>
  <div class="wrap">
    <div class="intro">
      <div class="content">
        <p class="info">
          <span>{{ caseData.title }}</span> - {{ caseData.objectDescription }}
        </p>
        <p class="works">
          {{ caseData.shortObject }}
        </p>
      </div>
      <div class="wrap-items">
        <p class="title-info">Объект</p>
        <div class="items">
          <p class="title">{{ caseData.space }} м²</p>
          <p class="text">Площадь</p>
        </div>
        <div class="items">
          <p class="title">{{ caseData.duration }}</p>
          <p class="text">Срок работ</p>
        </div>
        <div class="items">
          <p class="title">{{ caseData.people }}</p>
          <p class="text">Работали на объекте</p>
        </div>
      </div>
    </div>
    <div class="types">
      <div class="content-revers">
        <p class="works">
          {{ caseData.shortDescription }}
        </p>
        <p class="info">
          {{ caseData.fullDescription }}
        </p>
      </div>
      <p class="title-info display-mob">Работы</p>
      <div class="wrap-items">
        <p class="title-info display-pk">Работы</p>
        <!-- Динамические работы -->
        <div v-for="(work, index) in displayedWorks" :key="index" class="items">
          <!-- <p class="title">{{ work.progress }}%</p> -->
          <PagesProjectsUiProgressIndicator :progress="work.progress" />
          <p class="work">{{ work.workType }}</p>
        </div>
      </div>
      <p class="info">Процент работ который был выполнен нами на объекте</p>
    </div>
  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue'

const props = defineProps({
  caseData: {
    type: Object,
    required: true
  },
  works: {
    type: Array,
    default: () => []
  }
})

// Ограничиваем вывод до 6 работ
const displayedWorks = computed(() => {
  return props.works.slice(0, 6)
})
</script>

<style lang="scss" scoped>
.wrap {
  .intro {
    background: $background-dark;
  }

  .types {
    background: $background-gray;

    @media (min-width: 769px) {
      .display-mob {
        display: none;
      }
    }
  }
  .intro,
  .types {
    position: relative;
    z-index: 1;
    padding: 10em 5em;
    width: 100%;

    @media (max-width: 768px) {
      padding: 8em 2em;
    }

    h3,
    p {
      line-height: 1.6;
    }

    .content, .content-revers {
      display: flex;
      width: 100%;
      margin-bottom: 5em;
      justify-content: space-between;
      gap: 2em;

      @media (max-width: 768px) {
        flex-direction: column;
      }

      .info {
        color: $text-light;
        flex: 2;
        font-weight: 700;
        margin-bottom: 1.5rem;
        font-weight: 600;
        font-size: 2em;
        line-height: 46px;
        max-width: 600px;

        @media (max-width: 768px) {
          line-height: 40px;
        }
      }

      .works {
        flex: 1;
        font-size: 1.2rem;
        color: $text-gray;
        line-height: 1.6;
        font-weight: 300;
        max-width: 600px;
      }
    }

    .content-revers {
      @media (max-width: 768px) {
        flex-direction: column-reverse;
      }

      .info {
        font-size: 1.5em;
        max-width: unset;
        text-align: right;

        @media (max-width: 768px) {
          text-align: left;
        }
      }
    }

    .wrap-items {
      margin: auto;
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
      padding-left: 20%;

      @media (max-width: 768px) {
        flex-direction: column;
        align-items: start;
        padding: unset;
        gap: 2em;
        width: 100vw;
        position: relative;
        left: 50%;
        transform: translateX(-50%);
        padding: 0 2em; // отступы от края экрана (можно настроить)
        margin: 0;
        max-width: none;
      }

      .items {
        flex: 1;

        p {
          color: $text-light;
        }

        h3 {
          color: $blue;
        }

        .title {
          color: $text-light;
          font-size: 2.2em;
          font-weight: 600;
        }

        .text {
          color: $text-gray;
          font-size: 1rem;
        }
      }
    }
  }

  .types .info {
    color: $text-gray;
    text-align: end;
  }

  .types .wrap-items {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 5em;
    margin-bottom: 2em;

      @media (max-width: 768px) {
        flex-direction: row;
        gap: 1em;
        flex-wrap: nowrap;
        overflow-x: auto;
        padding-bottom: 1em;
        justify-content: flex-start;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: thin;
        scrollbar-color: $blue20 transparent;
        padding: 2em;
        margin-bottom: unset;

        /* Скрываем полосу прокрутки (опционально) */
        -webkit-overflow-scrolling: touch;
        scrollbar-width: thin;
        scrollbar-color: $blue20 transparent;

        .display-pk {
          display: none;
        }

        .title-info {
          margin-bottom: 2em;
          flex: none;
          white-space: nowrap;
        }
      }

    
    .items {
      flex: none;
      min-width: 180px;
      max-width: 200px;
      text-align: center;
      border-radius: 12px;
      flex: 1;
      padding: 2em 1em;
      background-color: $background-gray;
      filter: drop-shadow(0 0 20px $blue20);

      .title {
        font-size: 1.2em;
        color: $blue;
      }
      
      .work {
        font-size: .8em;
        font-weight: 500;
      }
    }
  }
}

.title-info {
  position: absolute;
  left: 0;
  letter-spacing: 0.2em;
  color: $text-gray;
  text-transform: uppercase;
  transform: rotate(-90deg) translateX(0%);
  margin-right: 10%;

  @media (max-width: 768px) {
    position: unset;
    transform: unset;
    margin: 2em 0 0;
  }
}
</style>