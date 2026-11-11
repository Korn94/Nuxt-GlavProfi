<!-- app/components/pages/public/offers/kp/blocks/KpEstimate.vue -->
<template>
  <section class="kp-section kp-section--tables">
    <div class="kp-container">
      <h2 v-if="title" class="kp-h2">{{ title }}</h2>
      <p v-if="lead" class="kp-lead">{{ lead }}</p>

      <!-- Табы групп. Показываем только если групп больше одной -->
      <div v-if="withTabs" class="kp-tabs">
        <button
          v-for="group in groups"
          :key="group.key"
          type="button"
          class="kp-tabs__btn"
          :class="{ 'is-active': group.key === activeKey }"
          @click="activeKey = group.key"
        >
          <Icon :name="group.icon || 'material-symbols:list-alt-outline'" />
          {{ group.label }}
          <span class="kp-tabs__badge">{{ formatPrice(group.total) }} ₽</span>
        </button>
      </div>

      <div
        v-for="group in groups"
        :key="group.key"
        class="kp-estimate__group"
        :class="{ 'kp-estimate__group--hidden': withTabs && group.key !== activeKey }"
      >
        <div
          v-for="(section, index) in group.sections"
          :key="section.key"
          class="kp-table-block"
        >
          <header class="kp-table-block__head">
            <div class="kp-table-block__num">{{ pad(index + 1) }}</div>
            <h3 class="kp-table-block__title">{{ section.title }}</h3>
            <div class="kp-table-block__total">{{ formatPrice(section.total) }} ₽</div>
          </header>

          <p v-if="section.hint" class="kp-table-block__hint">{{ section.hint }}</p>

          <div class="kp-table-wrap">
            <table class="kp-table" :class="{ 'kp-table--materials': showMaterials }">
              <thead>
                <tr>
                  <th class="kp-table__name">Наименование</th>
                  <th v-if="showMaterials">Материал</th>
                  <th>Ед.</th>
                  <th>Объём</th>
                  <th>Цена, ₽</th>
                  <th class="kp-table__sum">Сумма, ₽</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, itemIndex) in section.items"
                  :key="`${section.key}-${itemIndex}`"
                  :class="{ 'is-optional': item.optional }"
                >
                  <td class="kp-table__name">
                    {{ item.name }}
                    <span v-if="item.note" class="kp-table__note">{{ item.note }}</span>
                  </td>
                  <td v-if="showMaterials">{{ item.material || '—' }}</td>
                  <td>{{ item.unit || '—' }}</td>
                  <td>{{ item.qty ?? '—' }}</td>
                  <td>{{ item.price != null ? formatPrice(item.price) : '—' }}</td>
                  <td class="kp-table__sum">{{ formatPrice(getItemSum(item)) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Итоговый блок -->
      <div class="kp-grand">
        <div
          v-for="row in totalRowsData"
          :key="row.key"
          class="kp-grand__row"
          :class="{
            'kp-grand__row--subtotal': row.kind === 'subtotal',
            'kp-grand__row--section': row.kind === 'section',
          }"
        >
          <span>{{ row.label }}</span>
          <b>{{ formatPrice(row.value) }} ₽</b>
        </div>
        <div class="kp-grand__row kp-grand__row--total">
          <span>{{ totalLabel }}</span>
          <b>{{ formatPrice(total) }} ₽</b>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { KpResolvedGroup } from '../composables/useKpDocument'
import { formatPrice, getItemSum } from '../composables/useKpDocument'

const props = withDefaults(defineProps<{
  /** Группы сметы (работы, материалы, ...) из useKpDocument() */
  groups: KpResolvedGroup[]
  title?: string
  lead?: string
  /** Табы между группами. По умолчанию — если групп больше одной */
  showTabs?: boolean
  /** Строки итога: по группам (по умолчанию) или по разделам */
  totalRows?: 'groups' | 'sections'
  /** Подпись финальной строки итога */
  totalLabel?: string
  /** Итог документа с учётом корректировок (useKpDocument().grandTotal) */
  grandTotal?: number
}>(), {
  title: 'Детализация сметы',
  lead: '',
  totalLabel: 'Всего по смете',
  totalRows: 'groups',
  // Без явного default Vue приводит отсутствующий boolean-проп к false,
  // а нам нужно отличать «не задано» (авто-режим) от «выключено»
  showTabs: undefined,
})

const withTabs = computed<boolean>(() => props.showTabs ?? props.groups.length > 1)

const activeKey = ref<string>(props.groups[0]?.key ?? '')

watch(() => props.groups, (groups) => {
  if (!groups.some(group => group.key === activeKey.value)) {
    activeKey.value = groups[0]?.key ?? ''
  }
})

/** Колонка «Материал» появляется, если материал заполнен хотя бы у одной позиции */
const showMaterials = computed<boolean>(() =>
  props.groups.some(group => group.sections.some(section => section.hasMaterial)),
)

const total = computed<number>(() =>
  props.grandTotal ?? props.groups.reduce((sum, group) => sum + group.total, 0),
)

type KpTotalRowKind = 'plain' | 'subtotal' | 'section'

interface KpTotalRow {
  key: string
  label: string
  value: number
  kind: KpTotalRowKind
}

/**
 * В режиме «по разделам» разделы группируются под итогом своей группы:
 * сначала «Итого работы» со своей суммой, затем разделы этой группы,
 * затем «Итого материалы» и её разделы. Длинный список так читается проще.
 * Если группа одна, подзаголовок не нужен — строки остаются как раньше.
 */
const groupSections = computed<boolean>(() => props.totalRows === 'sections' && props.groups.length > 1)

const totalRowsData = computed<KpTotalRow[]>(() => {
  if (props.totalRows === 'sections') {
    return props.groups.flatMap<KpTotalRow>((group) => {
      const sections = group.sections.map<KpTotalRow>((section, index) => ({
        key: `${group.key}-${section.key}-${index}`,
        label: section.title,
        value: section.total,
        // Вторичный стиль — только когда есть подзаголовки групп
        kind: groupSections.value ? 'section' : 'plain',
      }))

      if (!groupSections.value) return sections

      return [
        {
          key: `${group.key}-subtotal`,
          label: group.totalLabel || group.label,
          value: group.total,
          kind: 'subtotal',
        },
        ...sections,
      ]
    })
  }

  return props.groups.map<KpTotalRow>(group => ({
    key: `${group.key}-total`,
    label: group.totalLabel || group.label,
    value: group.total,
    kind: 'plain',
  }))
})

const pad = (value: number): string => String(value).padStart(2, '0')
</script>
