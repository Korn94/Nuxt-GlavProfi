<template>
  <div class="container">
    <!-- Навигация -->
    <div class="navigation">
      <button
        v-for="category in categories"
        :key="category.id"
        :class="{ active: activeCategory === category.id }"
        @click="setCategory(category.id)"
      >
        {{ category.name }}
        <button @click.stop="editCategory(category)">✎</button>
        <button @click.stop="deleteCategory(category.id)">🗑️</button>
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
      <div v-if="isLoading">Загрузка...</div>
      <!-- Условие ошибки -->
      <div v-if="errorMessage">{{ errorMessage }}</div>

      <!-- Категории, условие если есть работы -->
      <div v-if="filteredWorks.length">
        <!-- Добавляем заголовки категорий и списки работ -->
        <div v-for="category in filteredWorks" :key="category.id" class="category-block">
          <h2>{{ category.title }} 
            <button @click.stop="editTitle(category)">✎</button>
            <button @click.stop="deleteCategory(category.id)">🗑️</button>
            <button @click.stop="saveCategoryData(category.id)" style="margin-left: 10px;">Сохранить</button>
            <button @click.stop="addWork(category.id)" style="margin-left: 10px;">Добавить раздел работ</button>
          </h2>
          <div v-for="work in category.items" :key="work.id" class="work-category">
            <!-- Заголовок работы -->
            <h3 @click="toggleCategory(work.id)">
              {{ work.name }}
              <button @click.stop="editName(work)">✎</button>
              <button @click.stop="deleteWork(work.id)">🗑️</button>
              <button @click.stop="addItem(work.id)" style="margin-left: 10px;">Добавить работу</button>
            </h3>

            <!-- Список работ, только если категория открыта -->
            <ul v-if="isCategoryOpen(work.id)">
              <li v-for="item in work.subItems" :key="item.id" class="work-item">
                <div class="work-main">
                  <Icon name="fluent:copy-16-filled" width="16" height="16" class="pointer ico" @click="copyToClipboard(item.type)" />
                  <p class="work-title pointer" @click="toggleSubItems(item.id)">
                    <strong><span v-html="highlightText(item.type)"></span></strong>
                    <button @click.stop="editType(item)">✎</button>
                    <button @click.stop="deleteItem(item.id)">🗑️</button>
                    <button @click.stop="addTypeWork(item.id)" style="margin-left: 10px;">Добавить подработу</button>
                  </p>
                  <p class="work-unit">{{ item.unit }}</p>
                  <p class="work-price">
                    <input 
                      type="number" 
                      :value="item.price" 
                      @input="updatePrice(item.id, $event.target.value)" 
                      style="width: 80px;" 
                    /> ₽
                  </p>
                </div>

                <!-- Вложенные элементы, если они есть -->
                <ul v-if="item.typeWorks && isSubItemsOpen(item.id)" class="sub-items">
                  <li v-for="typeWork in item.typeWorks" :key="typeWork.id" class="sub-work-item">
                    <p class="work-title">
                      <span v-html="highlightText(typeWork.nameWork)"></span>
                      <button @click.stop="editNameWork(typeWork)">✎</button>
                      <button @click.stop="deleteTypeWork(typeWork.id)">🗑️</button>
                    </p>
                    <p class="work-unit">{{ typeWork.unit }}</p>
                    <p class="work-price">
                      <input 
                        type="number" 
                        :value="typeWork.price" 
                        @input="updatePrice(typeWork.id, $event.target.value)" 
                        style="width: 80px;" 
                      /> ₽
                    </p>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Если ничего не найдено -->
      <div v-else>Работы не найдены</div>
    </div>

    <!-- Всплывающее окно для уведомления -->
    <UiAlerts
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
    const categories = ref([
      { id: "floor", name: "Пол" },
      { id: "walls", name: "Стены" },
      { id: "ceiling", name: "Потолок" },
      { id: "plumbing", name: "Сантехника" },
      { id: "electricity", name: "Электрика" },
      { id: "other", name: "Дополнительные услуги" },
    ]);

    // Состояния
    const activeCategory = ref("ceiling"); // Начальное значение
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

    // Функция для открытия всех категорий
    const openAllCategories = () => {
      openCategories.value = works.value.flatMap(category =>
        category.items.map(item => item.id)
      );
    };

    // Функция для открытия всех подкатегорий
    const openAllSubItems = () => {
      works.value.forEach(category => {
        category.items.forEach(item => {
          if (item.subItems) {
            item.subItems.forEach(subItem => {
              openSubItems.value[subItem.id] = true; // Открываем только subItems
            });
          }
        });
      });
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

    // Фильтрация работ
    const filteredWorks = computed(() => {
      const query = searchQuery.value.trim().toLowerCase();
      if (!query) return works.value;

      return works.value
        .map((category) => ({
          ...category,
          items: category.items.filter((item) =>
            item.name.toLowerCase().includes(query) || // Ищем только по имени основной работы
            item.subItems.some(subItem => subItem.type.toLowerCase().includes(query)) // И по типу подэлементов
          ),
        }))
        .filter((category) => category.items.length > 0);
    });

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

    // Обновление цены
    const updatePrice = (id, newPrice) => {
      const findAndSetPrice = (items) => {
        items.forEach(item => {
          if (item.id === id) {
            item.price = parseFloat(newPrice) || 0;
          }
          if (item.subItems) {
            findAndSetPrice(item.subItems);
          }
          if (item.typeWorks) {
            findAndSetPrice(item.typeWorks);
          }
        });
      };

      works.value.forEach(category => {
        findAndSetPrice(category.items);
      });
    };

    // Сохранение данных категории в JSON файл
    const saveCategoryData = (categoryId) => {
      const categoryData = works.value.find(category => category.id === categoryId);

      if (!categoryData) {
        console.error(`Категория с id ${categoryId} не найдена.`);
        return;
      }

      const dataToSave = {
        title: categoryData.title,
        items: categoryData.items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          subItems: item.subItems ? item.subItems.map(subItem => ({
            id: subItem.id,
            type: subItem.type,
            price: subItem.price,
            unit: subItem.unit,
            typeWorks: subItem.typeWorks ? subItem.typeWorks.map(typeWork => ({
              id: typeWork.id,
              nameWork: typeWork.nameWork,
              price: typeWork.price,
              unit: typeWork.unit
            })) : []
          })) : []
        }))
      };

      const jsonData = JSON.stringify(dataToSave, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${categoryId}.json`; // Имя файла соответствует ID категории
      a.click();

      URL.revokeObjectURL(url);
    };

    // Методы для редактирования
    const editCategory = (category) => {
      const newName = prompt("Введите новое название категории:", category.name);
      if (newName) {
        category.name = newName;
      }
    };

    const editTitle = (category) => {
      const newTitle = prompt("Введите новый заголовок категории:", category.title);
      if (newTitle) {
        category.title = newTitle;
      }
    };

    const editName = (work) => {
      const newName = prompt("Введите новое название работы:", work.name);
      if (newName) {
        work.name = newName;
      }
    };

    const editType = (item) => {
      const newType = prompt("Введите новый тип:", item.type);
      if (newType) {
        item.type = newType;
      }
    };

    const editNameWork = (typeWork) => {
      const newNameWork = prompt("Введите новое название работы:", typeWork.nameWork);
      if (newNameWork) {
        typeWork.nameWork = newNameWork;
      }
    };

    // Методы для удаления
    const deleteCategory = (categoryId) => {
      categories.value = categories.value.filter(cat => cat.id !== categoryId);
    };

    const deleteWork = (workId) => {
      works.value.forEach(category => {
        category.items = category.items.filter(item => item.id !== workId);
      });
    };

    const deleteItem = (itemId) => {
      works.value.forEach(category => {
        category.items.forEach(item => {
          item.subItems = item.subItems.filter(subItem => subItem.id !== itemId);
        });
      });
    };

    const deleteTypeWork = (typeWorkId) => {
      works.value.forEach(category => {
        category.items.forEach(item => {
          item.subItems.forEach(subItem => {
            subItem.typeWorks = subItem.typeWorks.filter(typeWork => typeWork.id !== typeWorkId);
          });
        });
      });
    };

    // Методы для добавления
    const addWork = (categoryId) => {
      const newWorkName = prompt("Введите название новой работы:");
      if (newWorkName) {
        const newWork = {
          id: `work-${Date.now()}`,
          name: newWorkName,
          price: 0,
          subItems: [],
        };
        const category = works.value.find(cat => cat.id === categoryId);
        if (category) {
          category.items.push(newWork);
        }
      }
    };

    const addItem = (workId) => {
      const newItemType = prompt("Введите тип нового элемента:");
      if (newItemType) {
        const newItem = {
          id: `item-${Date.now()}`,
          type: newItemType,
          price: 0,
          unit: "шт",
          typeWorks: [],
        };
        works.value.forEach(category => {
          category.items.forEach(item => {
            if (item.id === workId) {
              item.subItems.push(newItem);
            }
          });
        });
      }
    };

    const addTypeWork = (itemId) => {
      const newNameWork = prompt("Введите название новой работы:");
      if (newNameWork) {
        const newTypeWork = {
          id: `typeWork-${Date.now()}`,
          nameWork: newNameWork,
          price: 0,
          unit: "шт",
        };
        works.value.forEach(category => {
          category.items.forEach(item => {
            item.subItems.forEach(subItem => {
              if (subItem.id === itemId) {
                subItem.typeWorks.push(newTypeWork);
              }
            });
          });
        });
      }
    };

    // Отслеживание изменений в searchQuery
    watch(searchQuery, (newQuery) => {
      if (newQuery.trim()) {
        openAllCategories();
        openAllSubItems();
      } else {
        // Если строка поиска пустая, закрываем все категории и подкатегории
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
      searchQuery,
      setCategory,
      toggleCategory,
      isCategoryOpen,
      isSubItemsOpen,
      toggleSubItems,
      filteredWorks,
      isLoading,
      errorMessage,
      copyToClipboard,
      notificationVisible,
      highlightText,
      updatePrice,
      saveCategoryData, // Новая функция для сохранения данных категории
      editCategory,
      editTitle,
      editName,
      editType,
      editNameWork,
      deleteCategory,
      deleteWork,
      deleteItem,
      deleteTypeWork,
      addWork,
      addItem,
      addTypeWork,
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

.container {
  max-width: 1200px;
  margin: 5em auto;
}

button {
  background-color: #f0f0f0;
  color: #18191b;
  border: 1px solid #18191b;
  padding: 2px;
  margin: 0 .5em;

  &:hover {
    background-color: #00c3f5;
  }
}

.pointer {
  cursor: pointer;
}

h2 {
  text-align: center;
  margin-bottom: 0;
  margin: 2em 0 1em;
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
    background: #f0f0f0;
    color: #18191b;
    border-radius: 5px;
    font-weight: 600;
    transition: 0.3s;

    &.active {
      background: $primary-color;
      color: white;
    }

    &:hover {
      background: $primary-color;
      color: white;
    }
  }
}

// Поиск
.search-bar {
  margin-bottom: 20px;

  input {
    width: 100%;
    padding: 10px;
    border: 1px solid $border-color;
    border-radius: 5px;
  }
}

// Таблица
.price-list {
  border: 1px solid $border-color;
  border-radius: 5px;
  padding: 10px;

  .work-category {
    margin-bottom: 15px;

    h3 {
      cursor: pointer;
      display: flex;
      // justify-content: space-between;
      background: $background-light;
      padding: 5px 5px 5px 25px;
      margin: 0;
      border: 1px solid $border-color;
      border-radius: 5px;
      // justify-content: center;
      font-size: 16px;

      span {
        color: #18191b;
      }

      &:hover {
        color: $primary-color;
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
      padding: 5px 10px;
      border-bottom: 1px solid $border-color;

      .work-main {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .ico {
          margin-right: 1em;
        }
      }

      .work-title {
        flex: 1;
        white-space: pre-wrap;

        span {
          color: #18191b;
        }
      }

      .highlight {
        background-color: $highlight-color;
        color: white;
        font-weight: bold;
      }

      .work-unit, .work-price {
        display: inline-flex;
        align-items: center;
        width: 50px;
      }

      .sub-items {
        width: 100%;
        padding-left: 20px;
        background: $sub-item-bg;
        font-style: italic;

        .sub-work-item {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          border-top: 1px solid $border-color;

          .work-title {
            font-weight: normal;
            color: #555;

            span {
              color: #18191b;
            }
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