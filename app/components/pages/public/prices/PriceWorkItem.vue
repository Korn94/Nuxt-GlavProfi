<!-- app\components\pages\public\prices\PriceWorkItem.vue -->
<template>
  <dl class="work-item" itemscope itemtype="https://schema.org/Service">
    <!-- ======================================== -->
    <!-- 📌 НАЗВАНИЕ РАБОТЫ (dt)                  -->
    <!-- ======================================== -->
    <dt class="work-title-wrapper" itemprop="name">
      <!-- Иконка копирования -->
      <Icon
        :name="item.isCopied ? 'solar:copy-bold-duotone' : 'solar:copy-linear'"
        class="pointer ico"
        @click="dataStore.copyToClipboard(item)"
      />
      <!-- Название (кликабельное ТОЛЬКО если есть вложения) -->
      <span
        class="work-title"
        :class="{ pointer: hasNestedItems }"
        @click="hasNestedItems && uiStore.toggleSubItems(item.id)"
      >
        <!-- Режим просмотра: с подсветкой поиска -->
        <span v-if="editStore.editingItemId !== item.id">
          <span
            v-for="(part, index) in splitText(item.name)"
            :key="index"
            :class="{ highlight: part.isMatch }"
          >
            {{ part.text }}
          </span>
        </span>
        <!-- Режим редактирования -->
        <input
          v-else
          v-model="editStore.editingItemData.name"
          class="edit-input"
          style="width: 80%"
        />
      </span>
    </dt>

    <!-- ======================================== -->
    <!-- 💰 ЦЕНА И ЕДИНИЦА (dd)                   -->
    <!-- ======================================== -->
    <dd class="work-meta" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
      <span v-if="editStore.editingItemId !== item.id">
        <span class="work-price" itemprop="price" :content="String(item.price)">
          {{ Math.round(Number(item.price)) }} ₽ /
        </span>
        <meta itemprop="priceCurrency" content="RUB" />
        <span class="work-unit">{{ item.unit }}</span>
      </span>

      <!-- Режим редактирования цены -->
      <template v-else>
        <input
          v-model="editStore.editingItemData.unit"
          class="edit-input edit-unit"
          style="width: 50px"
        />
        <input
          v-model.number="editStore.editingItemData.price"
          class="edit-input edit-price"
          style="width: 70px"
        />
      </template>
    </dd>

    <!-- ======================================== -->
    <!-- 💾 КНОПКИ СОХРАНЕНИЯ (при редактировании) -->
    <!-- ======================================== -->
    <div v-if="editStore.editingItemId === item.id" class="edit-buttons">
      <button @click="editStore.saveEditItem">Сохранить</button>
      <button @click="editStore.cancelEditItem">Отмена</button>
    </div>

    <!-- ======================================== -->
    <!-- 🛠️ КНОПКИ АДМИНА                         -->
    <!-- ======================================== -->
    <div class="work-actions" v-if="isAdmin">
      <Icon name="bx:edit" size="16" @click.stop="editStore.startEditItem(item)" />
      <Icon name="mdi:delete-forever" size="16" @click.stop="editStore.deleteItem(item.id)" />
    </div>

    <!-- ======================================== -->
    <!-- ➕ ФОРМА ДОБАВЛЕНИЯ ДЕТАЛИ                -->
    <!-- ======================================== -->
    <div v-if="isAdmin" class="add-detail-button">
      <button @click="editStore.showAddDetail(item.id)">+ Добавить деталь</button>
      <div v-if="editStore.showAddDetailForm === item.id" class="form">
        <input v-model="editStore.newDetail.name" placeholder="Название" />
        <PagesPublicPricesUiSelectOrInput v-model="editStore.newDetail.unit" />
        <input v-model.number="editStore.newDetail.price" placeholder="Цена" />
        <button @click="editStore.addDetail">Сохранить</button>
        <button @click="editStore.cancelAddDetail">Отмена</button>
      </div>
    </div>

    <!-- ======================================== -->
    <!-- ➕ ФОРМА ДОБАВЛЕНИЯ ДОП. РАБОТЫ           -->
    <!-- ======================================== -->
    <div v-if="isAdmin" class="add-dopwork-button">
      <button @click="editStore.showAddDopwork(item.id)">+ Добавить доп. работу</button>
      <div v-if="editStore.showAddDopworkForm === item.id" class="form">
        <input v-model="editStore.newDopwork.label" placeholder="Метка" />
        <input v-model="editStore.newDopwork.dopwork" placeholder="Название работы" />
        <PagesPublicPricesUiSelectOrInput v-model="editStore.newDopwork.unit" />
        <input v-model.number="editStore.newDopwork.price" placeholder="Цена" />
        <button @click="editStore.addDopwork">Сохранить</button>
        <button @click="editStore.cancelAddDopwork">Отмена</button>
      </div>
    </div>

    <!-- ======================================== -->
    <!-- 🔽 ВЛОЖЕННЫЕ ЭЛЕМЕНТЫ                    -->
    <!-- ======================================== -->
    <dd class="work-nested" :class="{ 'is-open': isSubItemsOpen }">
      <!-- ДЕТАЛИ РАБОТ -->
      <dl v-if="item.details && item.details.length > 0" class="sub-items">
        <dl
          v-for="detail in item.details"
          :key="detail.id"
          class="sub-work-item"
          itemscope
          itemtype="https://schema.org/Service"
        >
          <dt class="work-title-wrapper" itemprop="name">
            <Icon
              :name="detail.isCopied ? 'solar:copy-line-duotone' : 'solar:copy-broken'"
              class="pointer ico"
              @click="dataStore.copyToClipboard(detail)"
            />
            <span class="work-title">
              <span v-if="editStore.editingDetailId !== detail.id">{{ detail.name }}</span>
              <input
                v-else
                v-model="editStore.editingDetailData.name"
                class="edit-input"
                style="width: 80%"
              />
            </span>
          </dt>

          <dd class="work-meta" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
            <span v-if="editStore.editingDetailId !== detail.id">
              <span class="work-price" itemprop="price" :content="String(detail.price)">
                {{ Math.round(Number(detail.price)) }} ₽
              </span>
              <meta itemprop="priceCurrency" content="RUB" />
              <span class="work-unit">{{ detail.unit || item.unit }}</span>
            </span>

            <template v-else>
              <input
                v-model="editStore.editingDetailData.unit"
                class="edit-input"
                style="width: 50px"
              />
              <input
                v-model.number="editStore.editingDetailData.price"
                class="edit-input"
                style="width: 70px"
              />
            </template>
          </dd>

          <div v-if="editStore.editingDetailId === detail.id" class="edit-buttons">
            <button @click="editStore.saveEditDetail">Сохранить</button>
            <button @click="editStore.cancelEditDetail">Отмена</button>
          </div>

          <div class="work-actions" v-if="isAdmin">
            <Icon
              name="bx:edit"
              size="16"
              @click.stop="editStore.startEditDetail(detail)"
            />
            <Icon
              name="mdi:delete-forever"
              size="16"
              @click.stop="editStore.deleteDetail(detail.id)"
            />
          </div>
        </dl>
      </dl>

      <!-- ДОП. РАБОТЫ -->
      <dl v-if="item.dopworks && item.dopworks.length > 0" class="sub-items">
        <p class="dop-work-title">Доп. работы</p>
        <dl
          v-for="dopwork in item.dopworks"
          :key="dopwork.id"
          class="sub-work-item"
          itemscope
          itemtype="https://schema.org/Service"
        >
          <dt class="work-title-wrapper" itemprop="name">
            <Icon
              :name="dopwork.isCopied ? 'solar:copy-line-duotone' : 'solar:copy-broken'"
              class="pointer ico"
              @click="dataStore.copyToClipboard(dopwork)"
            />
            <span class="work-title">
              <span v-if="editStore.editingDopworkId !== dopwork.id">
                {{ dopwork.label }} {{ dopwork.dopwork }}
              </span>
              <template v-else>
                <input
                  v-model="editStore.editingDopworkData.label"
                  class="edit-input"
                  style="width: 40%"
                />
                <input
                  v-model="editStore.editingDopworkData.dopwork"
                  class="edit-input"
                  style="width: 40%"
                />
              </template>
            </span>
          </dt>

          <dd class="work-meta" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
            <span v-if="editStore.editingDopworkId !== dopwork.id">
              <span class="work-price" itemprop="price" :content="String(dopwork.price)">
                {{ Math.round(Number(dopwork.price)) }} ₽
              </span>
              <meta itemprop="priceCurrency" content="RUB" />
              <span class="work-unit">{{ dopwork.unit || item.unit }}</span>
            </span>

            <template v-else>
              <input
                v-model="editStore.editingDopworkData.unit"
                class="edit-input"
                style="width: 50px"
              />
              <input
                v-model.number="editStore.editingDopworkData.price"
                class="edit-input"
                style="width: 70px"
              />
            </template>
          </dd>

          <div v-if="editStore.editingDopworkId === dopwork.id" class="edit-buttons">
            <button @click="editStore.saveEditDopwork">Сохранить</button>
            <button @click="editStore.cancelEditDopwork">Отмена</button>
          </div>

          <div class="work-actions" v-if="isAdmin">
            <Icon
              name="bx:edit"
              size="16"
              @click.stop="editStore.startEditDopwork(dopwork)"
            />
            <Icon
              name="mdi:delete-forever"
              size="16"
              @click.stop="editStore.deleteDopwork(dopwork.id)"
            />
          </div>
        </dl>
      </dl>
    </dd>
  </dl>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePriceUIStore, usePriceDataStore, usePriceEditStore } from 'stores/price'
import type { PriceWorkItem } from 'stores/price/types'

// ========================================
// 📥 ПРОПСЫ (минимальный набор)
// ========================================
const props = defineProps<{
  item: PriceWorkItem
  isAdmin: boolean
  searchQuery: string
}>()

// ========================================
// 🏪 PINIA STORES (вместо inject)
// ========================================
const uiStore = usePriceUIStore()
const dataStore = usePriceDataStore()
const editStore = usePriceEditStore()

// ========================================
// 🧮 ВЫЧИСЛЯЕМЫЕ СВОЙСТВА
// ========================================
/**
 * Открыты ли вложенные элементы работы (детали + доп. работы).
 * В script нужен .value для refs из Pinia setup store.
 */
const isSubItemsOpen = computed(() => !!uiStore.openSubItems[props.item.id])

/**
 * ✅ ЕСТЬ ЛИ ВЛОЖЕННЫЕ ЭЛЕМЕНТЫ (детали или доп. работы).
 * Если вложений нет — toggle блокируется, курсор становится обычным.
 */
const hasNestedItems = computed(() =>
  (props.item.details?.length ?? 0) > 0 ||
  (props.item.dopworks?.length ?? 0) > 0
)

// ========================================
// 🔍 ПОДСВЕТКА ПОИСКА
// ========================================
/**
 * Разбивает текст на части с пометкой совпадений с поисковым запросом.
 * Используется для визуальной подсветки найденных фрагментов.
 */
const splitText = (text: string) => {
  if (!text || !props.searchQuery.trim()) {
    return [{ text, isMatch: false }]
  }
  const query = props.searchQuery.trim().toLowerCase()
  const parts: Array<{ text: string; isMatch: boolean }> = []
  let lastIndex = 0

  while (lastIndex < text.length) {
    const index = text.toLowerCase().indexOf(query, lastIndex)
    if (index === -1) {
      parts.push({ text: text.slice(lastIndex), isMatch: false })
      break
    }

    if (index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, index), isMatch: false })
    }

    parts.push({
      text: text.slice(index, index + query.length),
      isMatch: true
    })

    lastIndex = index + query.length
  }

  return parts
}
</script>

<style lang="scss" scoped>
span {
  color: unset;
}

.pointer {
  cursor: pointer;
}

/* === Основная работа === */
.work-item {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  padding: 10px;
  border-bottom: 1px solid $border-color;
  transition: all 0.3s ease;
  margin: 0;

  &:hover {
    background: $sub-item-bg;
  }

  .work-title-wrapper {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    flex: 1;
    min-width: 0;

    .ico {
      margin-right: 1em;
      transition: transform 0.3s ease;
      flex-shrink: 0;
      color: $blue;

      &:hover {
        transform: scale(1.2);
      }
    }

    .work-title {
      flex: 1;
      white-space: pre-wrap;
      font-size: 1rem;
      color: $text-dark;
      display: flex;
      align-items: center;
      gap: 8px;

      .highlight {
        background-color: $blue;
        color: white;
        font-weight: bold;
        padding: 2px 5px;
        border-radius: 3px;
      }

      @media (max-width: 768px) {
        font-size: 0.8rem;
      }
    }
  }

  .work-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 110px;
    justify-content: flex-end;
    text-align: right;
    margin: 0;

    .work-unit,
    .work-price {
      display: inline-flex;
      align-items: center;
      width: auto;
      margin: 0 2px;
      font-size: 0.9rem;
      color: #555;
    }
  }

  .work-actions {
    display: flex;
    gap: 10px;
    margin-top: 5px;
    width: 100%;

    :deep(svg) {
      cursor: pointer;
      transition: transform 0.3s ease;

      &:hover {
        transform: scale(1.2);
      }
    }
  }

  .edit-buttons {
    display: flex;
    gap: 10px;
    margin-top: 5px;
    width: 100%;

    button {
      padding: 6px 12px;
      font-size: 0.8rem;
      border-radius: 4px;
      cursor: pointer;
      border: none;

      &:first-child {
        background: $blue;
        color: white;
      }

      &:last-child {
        background: #ddd;
        color: #333;
      }
    }
  }

  .edit-input {
    padding: 4px 8px;
    border: 1px solid $border-color;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .work-nested {
    width: 100%;
    padding-left: 20px;
    background: $sub-item-bg;
    border-radius: 5px;
    margin-left: 0;

    /* Анимация раскрытия через CSS-класс вместо v-show */
    max-height: 0;
    overflow: hidden;
    opacity: 0;
    transition: max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease;

    &.is-open {
      max-height: 5000px;
      opacity: 1;
      padding-top: 1em;
      padding-bottom: 1em;
    }

    .dop-work-title {
      text-align: center;
      font-weight: 600;
      margin: 10px 0;
    }
  }
}

/* === Вложенные работы === */
.sub-items {
  padding: 5px 0;
  margin: 0;
}

.sub-work-item {
  display: flex;
  flex-wrap: wrap;
  padding: 5px 0;
  border-bottom: 1px solid $border-color;
  gap: 4px;
  margin: 0;

  &:last-child {
    border-bottom: none;
  }

  .work-title-wrapper {
    .work-title {
      font-weight: normal;
      color: #555;
      font-size: 0.9rem;

      @media (max-width: 768px) {
        font-size: 0.8rem;
      }
    }
  }

  .work-meta {
    .work-unit,
    .work-price {
      font-size: 0.85rem;
    }
  }

  .work-actions {
    gap: 10px;
    margin-top: 4px;
  }
}

/* Формы добавления */
.add-detail-button,
.add-dopwork-button {
  margin-top: 0.5em;
  width: 100%;

  button {
    padding: 4px 10px;
    font-size: 0.8rem;
    border: 1px dashed $border-color;
    background: transparent;
    border-radius: 4px;
    cursor: pointer;
    color: #666;

    &:hover {
      border-color: $blue;
      color: $blue;
    }
  }
}

.form {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;

  input {
    padding: 6px 8px;
    border: 1px solid $border-color;
    border-radius: 4px;
    font-size: 0.85rem;
  }

  button {
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;

    &:first-of-type {
      background: $blue;
      color: white;
    }

    &:last-child {
      background: #ddd;
      color: #333;
    }
  }
}
</style>