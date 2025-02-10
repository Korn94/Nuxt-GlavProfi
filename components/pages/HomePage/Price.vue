<template>
  <div class="container">
    <!-- Заголовок -->
    <h2>Ремонт помещений, <span>цены на работы - 2025</span></h2>

    <!-- Навигация -->
    <div class="navigation">
      <button
        v-for="category in categories"
        :key="category.id"
        :class="{ active: activeCategory === category.id }"
        @click="setCategory(category.id)"
      >
        {{ category.name }}
      </button>
    </div>

    <!-- Поиск -->
    <div class="search-bar">
      <input
        type="text"
        v-model="searchQuery"
        placeholder="Поиск по работам..."
      />
    </div>

    <!-- Таблица -->
    <div class="price-list">
      <!-- Условие загрузки -->
      <div v-if="isLoading" class="loader">Загрузка...</div>
      <!-- Условие ошибки -->
      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

          <!-- Меню навигации для заголовков работ -->
    <div class="work-navigation">
      <div class="work-navigation-inner">
        <button
          :class="{ active: activeWork === 'all' }"
          @click="setActiveWork('all')"
        >
          Все работы
        </button>
        <button
          v-for="category in allWorks"
          :key="category.id"
          :class="{ active: activeWork === category.id }"
          @click="setActiveWork(category.id)"
        >
          {{ category.title }}
        </button>
      </div>
    </div>

      <!-- Категории, условие если есть работы -->
      <div v-if="filteredWorks.length">
        <!-- Добавляем заголовки категорий и списки работ -->
        <div v-for="category in filteredWorks" :key="category.id" class="category-block">
          <h2>{{ category.title }}</h2>
          <div v-for="work in category.items" :key="work.id" class="work-category">
            <!-- Заголовок работы -->
            <h3 @click="toggleCategory(work.id)">
              {{ work.name }}
            </h3>

            <!-- Список работ, только если категория открыта -->
            <ul v-if="isCategoryOpen(work.id)">
              <li v-for="item in work.subItems" :key="item.id" class="work-item">
                <div class="work-main">
                  <Icon name="fluent:copy-16-filled" width="16" height="16" class="pointer ico" @click="copyToClipboard(item.type)" />
                  <p class="work-title pointer" @click="toggleSubItems(item.id)">
                    <strong v-html="highlightText(item.type)"></strong>
                  </p>
                  <p class="work-unit">{{ item.unit }}</p>
                  <p class="work-price">{{ item.price }} ₽</p>
                </div>

                <!-- Вложенные элементы, если они есть -->
                <ul v-if="item.typeWorks && isSubItemsOpen(item.id)" class="sub-items">
                  <!-- Основные работы -->
                  <li v-for="typeWork in item.typeWorks" :key="typeWork.id" class="sub-work-item">
                    <p class="work-title" v-html="highlightText(typeWork.nameWork)"></p>
                    <p class="work-unit">{{ typeWork.unit }}</p>
                    <p class="work-price">{{ typeWork.price }} ₽</p>
                  </li>

                  <!-- Дополнительные работы -->
                  <template v-if="item.dopworks && item.dopworks.length">
                    <p class="additional-works-label">Доп. работы</p>
                    <li v-for="dopworkGroup in item.dopworks" :key="dopworkGroup.label">
                      <ul>
                        <li v-for="dopwork in dopworkGroup.works" :key="dopwork.id" class="sub-work-item">
                          <p class="work-title" v-html="highlightText(dopwork.dopwork)"></p>
                          <p class="work-unit">{{ dopwork.unit }}</p>
                          <p class="work-price">{{ dopwork.price }} ₽</p>
                        </li>
                      </ul>
                    </li>
                  </template>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Если ничего не найдено -->
      <div v-else class="no-results">Работы не найдены</div>
    </div>

    <!-- Всплывающее окно для уведомления -->
    <UIPopupsNotification
      :visible="notificationVisible"
      @update:visible="notificationVisible = $event"
      class="fade-animation"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from 'vue-router';

export default {
  setup() {
    const router = useRouter();
    const route = useRoute();

    // Данные категорий
    const categories = [
      { id: "floor", name: "Пол" },
      { id: "walls", name: "Стены" },
      { id: "ceiling", name: "Потолок" },
      { id: "plumbing", name: "Сантехника" },
      { id: "electricity", name: "Электрика" },
      { id: "other", name: "Дополнительные услуги" },
    ];

    // Состояния
    const activeCategory = ref("ceiling"); // Начальное значение
    const activeWork = ref("all"); // Активная работа (по умолчанию "Все работы")
    const works = ref([]); // Работы текущей категории
    const searchQuery = ref("");
    const openCategories = ref([]); // Открытые категории
    const openSubItems = ref({}); // Открытые вложенные элементы
    const isLoading = ref(false);
    const errorMessage = ref("");
    const notificationVisible = ref(false); // Состояние для показа уведомления

    // Загрузка данных для категории
    const loadCategoryData = async (categoryId) => {
      try {
        isLoading.value = true;
        errorMessage.value = "";

        // Загрузка основного файла категории
        const mainResponse = await fetch(`/data/${categoryId}.json`);
        if (!mainResponse.ok) {
          throw new Error(`Файл данных для категории ${categoryId} не найден.`);
        }

        const mainData = await mainResponse.json();

        // Загрузка вложенных файлов
        const loadedCategories = await Promise.all(
          mainData.categories.map(async (category) => {
            if (category.file) {
              const subResponse = await fetch(`/data/${category.file}`);
              if (!subResponse.ok) {
                console.warn(`Файл ${category.file} для категории ${categoryId} не найден.`);
                return { ...category, items: [] }; // Возвращаем пустой список, если файл не найден
              }
              const subData = await subResponse.json();
              return { ...category, items: subData.items || [] };
            }
            return category; // Если нет вложенного файла, возвращаем категорию как есть
          })
        );

        works.value = loadedCategories;
      } catch (error) {
        errorMessage.value = error.message;
        works.value = [];
      } finally {
        isLoading.value = false;
      }
    };

    // Получение всех категорий из всех категорий
    const allWorks = computed(() => {
      return works.value.map(category => ({
        id: category.id,
        title: category.title,
      }));
    });

    // Фильтрация работ
    const filteredWorks = computed(() => {
      const query = searchQuery.value.trim().toLowerCase();
      let filtered = works.value;

      // Фильтрация по активной категории
      if (activeWork.value !== "all") {
        filtered = filtered.filter(category => category.id === activeWork.value);
      }

      // Фильтрация по строке поиска
      if (query) {
        filtered = filtered.map(category => ({
          ...category,
          items: category.items.filter(item =>
            item.name.toLowerCase().includes(query) ||
            item.subItems.some(subItem => subItem.type.toLowerCase().includes(query))
          ),
        })).filter(category => category.items.length > 0);
      }

      return filtered;
    });

    // Установка активной категории
    const setActiveWork = (categoryId) => {
      activeWork.value = categoryId;
    };

    // Проверка, открыта ли категория
    const isCategoryOpen = (id) => {
      return searchQuery.value.trim() ? true : openCategories.value.includes(id);
    };

    // Открыть/закрыть категорию
    const toggleCategory = (id) => {
      if (isCategoryOpen(id)) {
        openCategories.value = openCategories.value.filter(catId => catId !== id);
      } else {
        openCategories.value.push(id);
      }
      history.replaceState(null, '', `#${activeCategory.value}-${id}`);
    };

    // Проверка, открыты ли вложенные элементы
    const isSubItemsOpen = (id) => {
      return searchQuery.value.trim() ? false : !!openSubItems.value[id];
    };

    // Открыть/закрыть вложенные элементы
    const toggleSubItems = (id) => {
      openSubItems.value[id] = !openSubItems.value[id];
    };

    // Подсветка текста
    const highlightText = (text) => {
      if (!text) return "";
      const query = searchQuery.value.trim();
      if (!query) return text;

      const regExp = new RegExp(`(${query})`, "gi");
      return text.replace(regExp, `<span class="highlight">$1</span>`);
    };

    // Скопировать в буфер
    const copyToClipboard = (text) => {
      if (!navigator.clipboard) {
        console.error("Буфер обмена недоступен.");
        return;
      }

      navigator.clipboard.writeText(text)
        .then(() => {
          notificationVisible.value = true;
        })
        .catch((err) => {
          console.error("Ошибка копирования текста:", err);
        });
    };

    // Обработка хэша после загрузки данных
    const processHash = () => {
      const [categoryId, workId] = route.hash.slice(1).split('-');
      activeCategory.value = categoryId || "ceiling";
      if (workId) openCategories.value.push(workId);
    };

    // Смена активной категории
    const setCategory = (categoryId) => {
      activeCategory.value = categoryId;
      history.replaceState(null, '', `#${categoryId}`);
      loadCategoryData(categoryId);
    };

    // Отслеживание изменений в searchQuery
    watch(searchQuery, (newQuery) => {
      if (newQuery.trim()) {
        openCategories.value = works.value.flatMap(category =>
          category.items.map(item => item.id)
        );
        Object.keys(openSubItems.value).forEach(key => {
          openSubItems.value[key] = true;
        });
      } else {
        openCategories.value = [];
        openSubItems.value = {};
      }
    });

    // Загрузка данных при монтировании компонента
    onMounted(() => {
      processHash();
      loadCategoryData(activeCategory.value);
    });

    // Отслеживание изменений хэша
    watch(() => route.hash, () => {
      if (!isLoading.value) {
        processHash();
      }
    });

    return {
      categories,
      works,
      activeCategory,
      activeWork,
      allWorks,
      searchQuery,
      filteredWorks,
      isLoading,
      errorMessage,
      notificationVisible,
      setCategory,
      setActiveWork,
      toggleCategory,
      isCategoryOpen,
      isSubItemsOpen,
      toggleSubItems,
      copyToClipboard,
      highlightText,
    };
  },
};
</script>

<style lang="scss" scoped>
$primary-color: #00c3f5;
$highlight-color: #ff9800;  // Цвет подсветки
$border-color: #ddd;
$background-light: #f7f7f7;
$sub-item-bg: #f0f0f0; // Цвет фона для расшифровок
$text-color: #18191b;
$shadow-color: rgba(0, 0, 0, 0.05);

.container {
  max-width: 1200px;
  margin: 5em auto;
  border-radius: 5px;
}

.pointer {
  cursor: pointer;
}

h2 {
  text-align: center;
}

// Навигация
.navigation {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;

  button {
    padding: 10px 15px;
    cursor: pointer;
    border: none;
    background: $sub-item-bg;
    color: $text-color;
    border-radius: 5px;
    font-weight: 600;
    transition: all 0.3s ease;

    &.active {
      background: linear-gradient(to right, #00c3f5, #00a3d3);
      box-shadow: 0 4px 10px rgba(0, 195, 245, 0.3);
    }

    &:hover {
      background: linear-gradient(to right, #00c3f5, #00a3d3);
      box-shadow: 0 4px 10px rgba(0, 195, 245, 0.3);
    }
  }
}

// Поиск
.search-bar {
  margin-bottom: 15px;

  input {
    width: 100%;
    padding: 10px 15px;
    border: 1px solid $border-color;
    border-radius: 5px;
    outline: none;
    transition: all 0.3s ease;
    box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.05);

    &:focus {
      border-color: $primary-color;
      box-shadow: 0 0 5px rgba(0, 195, 245, 0.5);
    }
  }
}

// Меню навигации для заголовков работ
.work-navigation {
  width: 100%;
  overflow-x: auto; // Включаем горизонтальную прокрутку
  -webkit-overflow-scrolling: touch; // Плавная прокрутка на мобильных устройствах
  margin-bottom: 20px;
  white-space: nowrap; // Запрещаем перенос строк
  position: relative;

  /* Стилизация для WebKit (Chrome, Safari) */
  &::-webkit-scrollbar {
    height: 6px; // Высота полосы прокрутки
  }

  &::-webkit-scrollbar-thumb {
    background: #ccc; // Цвет ползунка
    border-radius: 3px;
  }

  &::-webkit-scrollbar-track {
    background: transparent; // Фон полосы прокрутки
  }

  /* Стилизация для Firefox */
  scrollbar-width: thin; // Устанавливаем тонкую полосу прокрутки
  scrollbar-color: #ccc transparent; // Цвет ползунка и фона
}

.work-navigation-inner {
  display: inline-flex; // Размещаем кнопки в одну линию
  gap: 10px; // Расстояние между кнопками
  padding: 10px 0; // Отступы внутри контейнера
}

.work-navigation button {
  flex-shrink: 0; // Запрещаем уменьшение размера кнопок
  padding: 10px 15px;
  cursor: pointer;
  border: 1px solid $border-color;
  background: #fff;
  color: $text-color;
  border-radius: 5px;
  font-weight: 600;
  transition: all 0.3s ease;

  &.active {
    background: linear-gradient(to right, #00c3f5, #00a3d3);
    box-shadow: 0 4px 10px rgba(0, 195, 245, 0.3);
  }

  &:hover {
    background: linear-gradient(to right, #00c3f5, #00a3d3);
    box-shadow: 0 4px 10px rgba(0, 195, 245, 0.3);
  }
}

// Таблица
.price-list {
  border: 1px solid $border-color;
  border-radius: 5px;
  padding: 20px;
  background: $background-light;
  box-shadow: 0 4px 10px $shadow-color;

  .category-block {
    margin-bottom: 20px;
    border-bottom: 1px solid #ddd;

      &:last-child {
        border-bottom: none;
      }

    h2 {
      font-size: 1.5rem;
      color: $text-color;
      margin-bottom: 10px;
      position: relative;
      text-align: center;
    }
  }

  .work-category {
    margin-bottom: 15px;

    h3 {
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 1rem;
      background: linear-gradient(to bottom, #ffffff, #f7f7f7);
      padding: 10px 15px;
      margin: 0;
      border: 1px solid $border-color;
      border-radius: 5px;
      transition: all 1.3s ease;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);

      &:hover {
        background: linear-gradient(to right, #00c3f5, #00a3d3);
        // background: linear-gradient(to right, #f7f7f7, #00c3f5);
        box-shadow: 0 4px 10px rgba(0, 195, 245, 0.3);
      }
    }

    ul {
      margin: 0;
      padding: 0;
      list-style: none;
      transition: all 0.3s ease;
    }

    .work-item {
      display: flex;
      flex-direction: column;
      padding: 10px;
      border-bottom: 1px solid $border-color;
      transition: all 0.3s ease;

      &:hover {
        background: $sub-item-bg;
      }

      .work-main {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .ico {
          margin-right: 1em;
          transition: transform 0.3s ease;

          &:hover {
            transform: scale(1.2);
          }
        }
      }

      // Стили для заголовка "Дополнительные работы"
      .additional-works-label {
        font-size: .8rem;
        font-weight: 600;
        margin-top: 10px;
        color: #333;
        // padding-left: 20px;
        font-style: normal;
        border-bottom: 1px solid $border-color;
        // width: 150px;
        text-align: center;
        // border: 1px solid red;
        // background: $background-light;
      }

      .work-title {
        flex: 1;
        white-space: pre-wrap;
        font-size: 1rem;
        color: $text-color;
        transition: color 0.3s ease;

        // &:hover {
        //   color: $primary-color;
        // }
      }

      .highlight {
        background-color: $highlight-color;
        color: white;
        font-weight: bold;
        padding: 2px 5px;
        border-radius: 3px;
      }

      .work-unit, .work-price {
        display: inline-flex;
        align-items: center;
        width: 50px;
        font-size: 0.9rem;
        color: #555;
      }

      .sub-items {
        width: 100%;
        padding-left: 20px;
        background: $sub-item-bg;
        font-style: italic;
        margin-top: 1em;
        border-radius: 5px;

        .sub-work-item {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          border-bottom: 1px solid $border-color;

          .work-title {
            font-weight: normal;
            color: #555;
            font-size: 0.9rem;
          }
        }
      }
    }
  }
}

.fade-animation {
  transition: opacity 0.3s ease-in-out;

  &.hidden {
    opacity: 0;
  }
}

@media (max-width: 768px) {
  .navigation {
    flex-direction: column;
    gap: 5px;
  }

  .search-bar input {
    width: 100%;
  }
}
</style>