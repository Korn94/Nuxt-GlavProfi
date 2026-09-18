<template>
  <dl class="work-item" itemscope itemtype="https://schema.org/Service">
    <!-- Название работы -->
    <dt class="work-item__title-wrap" itemprop="name">
      <button
        class="copy-btn"
        :title="item.isCopied ? 'Скопировано' : 'Скопировать'"
        @click="dataStore.copyToClipboard(item)"
      >
        <Icon
          :name="item.isCopied ? 'solar:copy-bold-duotone' : 'solar:copy-linear'"
          size="15"
        />
      </button>

      <span
        class="work-item__title"
        :class="{ 'is-clickable': hasNestedItems }"
        @click="hasNestedItems && uiStore.toggleSubItems(item.id)"
      >
        <span v-if="editStore.editingItemId !== item.id">
          <span
            v-for="(part, index) in splitText(item.name)"
            :key="index"
            :class="{ highlight: part.isMatch }"
          >
            {{ part.text }}
          </span>
        </span>
        <input
          v-else
          v-model="editStore.editingItemData.name"
          class="edit-input"
          style="width: 80%"
        />

        <Icon
          v-if="hasNestedItems"
          :name="isSubItemsOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'"
          size="16"
          class="work-item__toggle"
        />
      </span>
    </dt>

    <!-- Цена -->
    <dd class="work-item__meta" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
      <span v-if="editStore.editingItemId !== item.id" class="price-badge">
        <span class="price-badge__value" itemprop="price" :content="String(item.price)">
          {{ Math.round(Number(item.price)) }} ₽
        </span>
        <meta itemprop="priceCurrency" content="RUB" />
        <span class="price-badge__unit">{{ item.unit }}</span>
      </span>

      <template v-else>
        <input
          v-model="editStore.editingItemData.unit"
          class="edit-input"
          style="width: 55px"
        />
        <input
          v-model.number="editStore.editingItemData.price"
          class="edit-input"
          style="width: 80px"
        />
      </template>
    </dd>

    <!-- Кнопки сохранения -->
    <div v-if="editStore.editingItemId === item.id" class="edit-buttons">
      <button @click="editStore.saveEditItem">Сохранить</button>
      <button @click="editStore.cancelEditItem">Отмена</button>
    </div>

    <!-- Админ-действия -->
    <div v-if="isAdmin" class="work-item__actions">
      <button
        v-if="!searchQuery.trim()"
        class="icon-btn item-sort-handle"
        title="Перетащить"
      >
        <Icon name="mdi:drag" size="15" />
      </button>
      <button class="icon-btn" title="Редактировать" @click.stop="editStore.startEditItem(item)">
        <Icon name="bx:edit" size="15" />
      </button>
      <button
        class="icon-btn icon-btn--danger"
        title="Удалить"
        @click.stop="editStore.deleteItem(item.id)"
      >
        <Icon name="mdi:delete-forever" size="15" />
      </button>
    </div>

    <!-- Добавление деталей / доп. работ -->
    <div v-if="isAdmin" class="work-item__admin-add">
      <button
        v-if="editStore.showAddDetailForm !== item.id"
        class="mini-dashed-btn"
        @click="editStore.showAddDetail(item.id)"
      >
        + деталь
      </button>
      <div v-else class="form form--inline">
        <input v-model="editStore.newDetail.name" placeholder="Название" />
        <PagesPublicPricesUiSelectOrInput v-model="editStore.newDetail.unit" />
        <input v-model.number="editStore.newDetail.price" placeholder="Цена" />
        <button @click="editStore.addDetail">OK</button>
        <button @click="editStore.cancelAddDetail">✕</button>
      </div>

      <button
        v-if="editStore.showAddDopworkForm !== item.id"
        class="mini-dashed-btn"
        @click="editStore.showAddDopwork(item.id)"
      >
        + доп. работа
      </button>
      <div v-else class="form form--inline">
        <input v-model="editStore.newDopwork.label" placeholder="Метка" />
        <input v-model="editStore.newDopwork.dopwork" placeholder="Название" />
        <PagesPublicPricesUiSelectOrInput v-model="editStore.newDopwork.unit" />
        <input v-model.number="editStore.newDopwork.price" placeholder="Цена" />
        <button @click="editStore.addDopwork">OK</button>
        <button @click="editStore.cancelAddDopwork">✕</button>
      </div>
    </div>

    <!-- Вложенные -->
    <dd class="work-item__nested" :class="{ 'is-open': isSubItemsOpen }">
      <dl v-if="item.details && item.details.length > 0" class="sub-items">
        <dl
          v-for="detail in item.details"
          :key="detail.id"
          class="sub-work-item"
          itemscope
          itemtype="https://schema.org/Service"
        >
          <dt class="sub-work-item__title-wrap" itemprop="name">
            <button
              class="copy-btn copy-btn--sm"
              @click="dataStore.copyToClipboard(detail)"
            >
              <Icon
                :name="detail.isCopied ? 'solar:copy-bold-duotone' : 'solar:copy-linear'"
                size="13"
              />
            </button>
            <span class="sub-work-item__title">
              <span v-if="editStore.editingDetailId !== detail.id">{{ detail.name }}</span>
              <input
                v-else
                v-model="editStore.editingDetailData.name"
                class="edit-input"
                style="width: 80%"
              />
            </span>
          </dt>

          <dd class="sub-work-item__meta" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
            <span v-if="editStore.editingDetailId !== detail.id" class="price-badge price-badge--sm">
              <span class="price-badge__value" itemprop="price" :content="String(detail.price)">
                {{ Math.round(Number(detail.price)) }} ₽
              </span>
              <meta itemprop="priceCurrency" content="RUB" />
              <span class="price-badge__unit">{{ detail.unit || item.unit }}</span>
            </span>

            <template v-else>
              <input v-model="editStore.editingDetailData.unit" class="edit-input" style="width: 55px" />
              <input v-model.number="editStore.editingDetailData.price" class="edit-input" style="width: 80px" />
            </template>
          </dd>

          <div v-if="editStore.editingDetailId === detail.id" class="edit-buttons">
            <button @click="editStore.saveEditDetail">Сохранить</button>
            <button @click="editStore.cancelEditDetail">Отмена</button>
          </div>

          <div v-if="isAdmin" class="work-item__actions">
            <button class="icon-btn" @click.stop="editStore.startEditDetail(detail)">
              <Icon name="bx:edit" size="14" />
            </button>
            <button class="icon-btn icon-btn--danger" @click.stop="editStore.deleteDetail(detail.id)">
              <Icon name="mdi:delete-forever" size="14" />
            </button>
          </div>
        </dl>
      </dl>

      <dl v-if="item.dopworks && item.dopworks.length > 0" class="sub-items sub-items--dop">
        <p class="dop-work-title">
          <Icon name="mdi:plus-circle-outline" size="14" />
          <span>Доп. работы</span>
        </p>
        <dl
          v-for="dopwork in item.dopworks"
          :key="dopwork.id"
          class="sub-work-item"
          itemscope
          itemtype="https://schema.org/Service"
        >
          <dt class="sub-work-item__title-wrap" itemprop="name">
            <button class="copy-btn copy-btn--sm" @click="dataStore.copyToClipboard(dopwork)">
              <Icon
                :name="dopwork.isCopied ? 'solar:copy-bold-duotone' : 'solar:copy-linear'"
                size="13"
              />
            </button>
            <span class="sub-work-item__title">
              <span v-if="editStore.editingDopworkId !== dopwork.id">
                <strong>{{ dopwork.label }}</strong> {{ dopwork.dopwork }}
              </span>
              <template v-else>
                <input v-model="editStore.editingDopworkData.label" class="edit-input" style="width: 35%" />
                <input v-model="editStore.editingDopworkData.dopwork" class="edit-input" style="width: 45%" />
              </template>
            </span>
          </dt>

          <dd class="sub-work-item__meta" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
            <span v-if="editStore.editingDopworkId !== dopwork.id" class="price-badge price-badge--sm">
              <span class="price-badge__value" itemprop="price" :content="String(dopwork.price)">
                {{ Math.round(Number(dopwork.price)) }} ₽
              </span>
              <meta itemprop="priceCurrency" content="RUB" />
              <span class="price-badge__unit">{{ dopwork.unit || item.unit }}</span>
            </span>

            <template v-else>
              <input v-model="editStore.editingDopworkData.unit" class="edit-input" style="width: 55px" />
              <input v-model.number="editStore.editingDopworkData.price" class="edit-input" style="width: 80px" />
            </template>
          </dd>

          <div v-if="editStore.editingDopworkId === dopwork.id" class="edit-buttons">
            <button @click="editStore.saveEditDopwork">Сохранить</button>
            <button @click="editStore.cancelEditDopwork">Отмена</button>
          </div>

          <div v-if="isAdmin" class="work-item__actions">
            <button class="icon-btn" @click.stop="editStore.startEditDopwork(dopwork)">
              <Icon name="bx:edit" size="14" />
            </button>
            <button class="icon-btn icon-btn--danger" @click.stop="editStore.deleteDopwork(dopwork.id)">
              <Icon name="mdi:delete-forever" size="14" />
            </button>
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

const props = defineProps<{
  item: PriceWorkItem
  isAdmin: boolean
  searchQuery: string
}>()

const uiStore = usePriceUIStore()
const dataStore = usePriceDataStore()
const editStore = usePriceEditStore()

const isSubItemsOpen = computed(() => !!uiStore.openSubItems[props.item.id])

const hasNestedItems = computed(
  () =>
    (props.item.details?.length ?? 0) > 0 ||
    (props.item.dopworks?.length ?? 0) > 0,
)

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
      isMatch: true,
    })

    lastIndex = index + query.length
  }

  return parts
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

span {
  color: unset;
}

/* ═══════════════════════════════════════════ */
/* ОСНОВНАЯ РАБОТА                             */
/* ═══════════════════════════════════════════ */
.work-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  margin: 0;
  // border-radius: 8px;
  // transition: background 0.2s ease;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  
  &:hover {
    background: rgba(0, 195, 245, 0.04);
    border-bottom: 1px solid rgba(0, 0, 0, 0.2);
  }

  &__title-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
    min-width: 0;
    margin: 0;
  }

  &__title {
    flex: 1;
    font-size: 0.92rem;
    color: $text-dark;
    line-height: 1.45;
    white-space: pre-wrap;
    display: flex;
    align-items: center;
    gap: 6px;

    &.is-clickable {
      cursor: pointer;
    }

    .highlight {
      background: linear-gradient(180deg, transparent 55%, rgba(0, 195, 245, 0.35) 55%);
      color: $text-dark;
      font-weight: 700;
      padding: 0 2px;
      border-radius: 2px;
    }

    @media (max-width: 768px) {
      font-size: 0.84rem;
    }
  }

  &__toggle {
    color: $blue;
    flex-shrink: 0;
    opacity: 0.7;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    flex-shrink: 0;
  }

  &__actions {
    display: flex;
    gap: 4px;
    margin-left: auto;
    flex-shrink: 0;
  }

  &__admin-add {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    width: 100%;
    padding-left: 34px;
  }

  &__nested {
    width: 100%;
    margin: 0;
    padding: 0;
    max-height: 0;
    overflow: hidden;
    opacity: 0;
    transition: max-height 0.35s ease, opacity 0.3s ease, padding 0.3s ease;

    &.is-open {
      max-height: 5000px;
      opacity: 1;
      padding: 10px 0 6px 34px;
    }
  }
}

/* Бейдж цены */
.price-badge {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(0, 195, 245, 0.09);
  border: 1px solid rgba(0, 195, 245, 0.2);
  border-radius: 8px;
  white-space: nowrap;

  &__value {
    font-weight: 600;
    color: $text-dark;
    font-size: 0.9rem;
    // font-variant-numeric: tabular-nums;

    @media (max-width: 768px) {
      font-size: 0.82rem;
    }
  }

  &__unit {
    color: $text-gray;
    font-size: 0.78rem;

    @media (max-width: 768px) {
      font-size: 0.72rem;
    }
  }

  &--sm {
    padding: 3px 8px;
    background: rgba(0, 0, 0, 0.04);
    border-color: rgba(0, 0, 0, 0.06);

    .price-badge__value {
      color: $text-dark;
      font-size: 0.82rem;
    }

    .price-badge__unit {
      font-size: 0.72rem;
    }
  }
}

/* Кнопка копирования */
.copy-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: rgba(0, 195, 245, 0.5);
  border-radius: 6px;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;

  &:hover {
    color: $blue;
    background: rgba(0, 195, 245, 0.1);
  }

  &--sm {
    width: 20px;
    height: 20px;
  }
}

/* Иконочные кнопки */
.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  background: transparent;
  color: $text-gray;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 195, 245, 0.12);
    color: $blue;
  }

  &--danger:hover {
    background: rgba(211, 47, 47, 0.1);
    color: #d32f2f;
  }
}

.item-sort-handle {
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

/* ═══════════════════════════════════════════ */
/* ВЛОЖЕННЫЕ                                   */
/* ═══════════════════════════════════════════ */
.sub-items {
  padding: 0;
  margin: 0;

  &--dop {
    margin-top: 6px;
    padding-top: 10px;
    border-top: 1px dashed rgba(0, 0, 0, 0.08);
  }
}

.dop-work-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 6px;
  padding: 3px 10px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: $blue;
  background: rgba(0, 195, 245, 0.08);
  border-radius: 6px;
}

.sub-work-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 7px 4px;
  margin: 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 6px;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(0, 195, 245, 0.03);
  }

  &:last-child {
    border-bottom: none;
  }

  &__title-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
    margin: 0;
  }

  &__title {
    flex: 1;
    font-size: 0.86rem;
    color: #555;
    line-height: 1.4;
    display: flex;
    align-items: center;
    gap: 6px;

    strong {
      color: $text-dark;
      font-weight: 600;
    }

    @media (max-width: 768px) {
      font-size: 0.8rem;
    }
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    flex-shrink: 0;
  }
}

/* ═══════════════════════════════════════════ */
/* ФОРМЫ / ИНПУТЫ                              */
/* ═══════════════════════════════════════════ */
.edit-input {
  padding: 5px 9px;
  border: 1.5px solid $blue;
  border-radius: 6px;
  font-size: 0.85rem;
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 195, 245, 0.1);
}

.edit-buttons {
  display: flex;
  gap: 8px;
  padding-left: 34px;
  width: 100%;

  button {
    padding: 5px 12px;
    font-size: 0.78rem;
    font-weight: 600;
    border-radius: 6px;
    cursor: pointer;
    border: none;

    &:first-child {
      background: $blue;
      color: #fff;
    }

    &:last-child {
      background: #eef0f3;
      color: #333;
    }
  }
}

.mini-dashed-btn {
  padding: 4px 10px;
  font-size: 0.72rem;
  font-weight: 600;
  border: 1.5px dashed rgba(0, 195, 245, 0.4);
  background: transparent;
  color: $blue;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 195, 245, 0.08);
    border-color: $blue;
  }
}

.form--inline {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  width: 100%;
  padding: 8px;
  background: #fafbfc;
  border-radius: 8px;

  input {
    padding: 5px 9px;
    border: 1px solid $border-color;
    border-radius: 6px;
    font-size: 0.8rem;
    outline: none;

    &:focus {
      border-color: $blue;
    }
  }

  button {
    padding: 5px 12px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.78rem;
    font-weight: 600;

    &:first-of-type {
      background: $blue;
      color: #fff;
    }
    &:last-of-type {
      background: #eef0f3;
      color: #333;
    }
  }
}
</style>