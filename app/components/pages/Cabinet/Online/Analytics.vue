<!-- app/components/pages/Cabinet/Online/Analytics.vue -->
<template>
  <div class="online-card stats-card">
    <div class="online-card__header">
      <span class="online-card__title">
        <Icon name="mdi:chart-box-outline" size="14" />
        Аналитика сайта
      </span>
      <div class="online-card__actions">
        <span v-if="statsUpdatedAt" class="stats-updated" title="Время последней загрузки аналитики">
          обновлено в {{ formatClock(statsUpdatedAt) }}
        </span>
        <label class="toggle-label stats-staff-toggle" title="Не учитывать собственные заходы сотрудников (визиты после логина)">
          <input
            type="checkbox"
            class="toggle-cb"
            :checked="hideStaff !== false"
            @change="onHideStaffToggle"
          >
          <span class="toggle-track" />
          <span class="toggle-text">без сотрудников</span>
        </label>
        <select :value="statsDays" class="stats-select" @change="onDaysChange">
          <option :value="1">Сегодня</option>
          <option :value="7">7 дней</option>
          <option :value="30">30 дней</option>
          <option :value="90">90 дней</option>
        </select>
        <button class="crm-btn crm-btn--ghost crm-btn--sm" :disabled="loading" @click="emit('refresh')">
          <Icon name="mdi:refresh" size="14" :class="{ spin: loading }" />
        </button>
      </div>
    </div>

    <div v-if="error && !stats" class="online-state online-state--error">
      <span>{{ error }}</span>
    </div>

    <template v-else-if="stats">
      <!-- Сводка по периоду -->
      <div class="stats-kpis">
        <div class="kpi">
          <div class="kpi__icon kpi__icon--accent"><Icon name="mdi:eye-outline" size="16" /></div>
          <div class="kpi__info">
            <span class="kpi__label">Визиты</span>
            <span class="kpi__value">{{ formatNumber(stats.totals?.visits) }}</span>
          </div>
        </div>
        <div class="kpi">
          <div class="kpi__icon kpi__icon--info"><Icon name="mdi:account-outline" size="16" /></div>
          <div class="kpi__info">
            <span class="kpi__label">Посетители</span>
            <span class="kpi__value">{{ formatNumber(stats.totals?.visitors) }}</span>
          </div>
        </div>
        <div class="kpi">
          <div class="kpi__icon kpi__icon--success"><Icon name="mdi:phone-outline" size="16" /></div>
          <div class="kpi__info">
            <span class="kpi__label" title="Визиты, в которых было хотя бы одно контактное действие: звонок, мессенджер, email или заявка">Обращения</span>
            <span class="kpi__value">{{ formatNumber(stats.totals?.conversions) }}</span>
          </div>
        </div>
        <div class="kpi">
          <div class="kpi__icon kpi__icon--warning"><Icon name="mdi:percent-outline" size="16" /></div>
          <div class="kpi__info">
            <span class="kpi__label">Конверсия</span>
            <span class="kpi__value">{{ stats.totals?.conversionRate ?? 0 }}%</span>
          </div>
        </div>
        <div class="kpi">
          <div class="kpi__icon kpi__icon--accent"><Icon name="mdi:timer-outline" size="16" /></div>
          <div class="kpi__info">
            <span class="kpi__label">Ср. время</span>
            <span class="kpi__value">{{ formatSeconds(stats.totals?.avgSeconds) }}</span>
          </div>
        </div>
        <div class="kpi">
          <div class="kpi__icon kpi__icon--danger"><Icon name="mdi:logout" size="16" /></div>
          <div class="kpi__info">
            <span class="kpi__label">Отказы</span>
            <span class="kpi__value">{{ stats.totals?.bounceRate ?? 0 }}%</span>
          </div>
        </div>
      </div>

      <!-- Формы за период: полная воронка «показ → открытие → фокус → ввод → заявка» -->
      <div
        class="stats-forms"
        title="CTA — клик по кнопке, ведущей к форме (cta_click). Показ — форма продержалась в кадре (form_view, impression: вовлечением не считается и «отказ» не снимает). Открытие — форма открыта или начато заполнение (form_open). Фокус — курсор в поле (form_focus). Ввод — начали печатать (form_typing). Заявка — отправленная форма (form_submit). Микро-события включаются точечно (см. NUXT_PUBLIC_VISITOR_MICRO_TRACKING), минимальная пауза в кадре — NUXT_PUBLIC_VISITOR_MICRO_VIEW_MIN_MS."
      >
        <span class="stats-forms__item">
          <Icon name="mdi:cursor-default-click-outline" size="13" />
          Кликов CTA: <b>{{ formatNumber(stats.totals?.ctaClicks) }}</b>
        </span>
        <span class="stats-forms__item stats-forms__item--success">
          <Icon name="mdi:file-send-outline" size="13" />
          Заявки: <b>{{ formatNumber(stats.totals?.leadEvents) }}</b>
        </span>
        <span class="stats-forms__item">
          <Icon name="mdi:form-select" size="13" />
          Открытий формы: <b>{{ formatNumber(stats.totals?.formOpens) }}</b>
        </span>
        <span v-if="hasMicroData" class="stats-forms__item" title="Показ (impression, form_view): форма продержалась в кадре. Действием пользователя не считается">
          <Icon name="mdi:eye-outline" size="13" />
          Показ формы: <b>{{ formatNumber(stats.totals?.formViews) }}</b>
        </span>
        <span v-if="hasMicroData" class="stats-forms__item">
          <Icon name="mdi:cursor-text" size="13" />
          Фокус: <b>{{ formatNumber(stats.totals?.formFocuses) }}</b>
        </span>
        <span v-if="hasMicroData" class="stats-forms__item">
          <Icon name="mdi:keyboard-outline" size="13" />
          Ввод: <b>{{ formatNumber(stats.totals?.formTypings) }}</b>
        </span>
        <span class="stats-forms__item">
          <Icon name="mdi:send-check-outline" size="13" />
          Визитов с отправкой: <b>{{ formatNumber(stats.totals?.formSubmits) }}</b>
        </span>
        <span class="stats-forms__item" :class="{ 'stats-forms__item--warn': (stats.totals?.formSubmitRate ?? 0) < 30 }">
          <Icon name="mdi:percent-outline" size="13" />
          Доходимость формы: <b>{{ stats.totals?.formSubmitRate ?? 0 }}%</b>
        </span>
        <span class="stats-forms__item">
          <Icon name="mdi:account-arrow-right-outline" size="13" />
          Без заявки: <b>{{ formatNumber(noLeadVisits) }}</b>
        </span>
      </div>

      <!-- Полная воронка формы: показ → открытие → фокус → ввод → отправка -->
      <div v-if="hasMicroData" class="stats-form-ladder" title="Доли считаются от предыдущего шага (отправка — от открытий, как в «Доходимости»)">
        <template v-for="(step, index) in microFunnel" :key="step.key">
          <span v-if="index > 0" class="stats-form-ladder__arrow">→</span>
          <span class="stats-form-ladder__step">
            <span class="stats-form-ladder__label">{{ step.label }}</span>
            <b class="stats-form-ladder__value">{{ formatNumber(step.value) }}</b>
            <span v-if="step.share !== null" class="stats-form-ladder__share">{{ step.share }}%</span>
          </span>
        </template>
      </div>

      <!-- Графики -->
      <div class="stats-charts">
        <div class="chart-card chart-card--wide">
          <div class="chart-card__header">
            <span class="chart-card__title"><Icon name="mdi:chart-line" size="13" /> Динамика по дням</span>
          </div>
          <div v-if="dailyData.labels.length" ref="dailyChartRef" class="chart-card__canvas" />
          <div v-else class="stats-empty">Нет данных для графика</div>
        </div>

        <div class="chart-card">
          <div class="chart-card__header">
            <span class="chart-card__title"><Icon name="mdi:chart-donut" size="13" /> Источники</span>
          </div>
          <div v-if="stats.channels.length" ref="channelsChartRef" class="chart-card__canvas chart-card__canvas--sm" />
          <div v-else class="stats-empty">Нет данных для графика</div>
        </div>

        <div class="chart-card">
          <div class="chart-card__header">
            <span class="chart-card__title"><Icon name="mdi:chart-bar" size="13" /> События</span>
          </div>
          <div v-if="hasEventData" ref="eventsChartRef" class="chart-card__canvas chart-card__canvas--sm" />
          <div v-else class="stats-empty">Нет данных для графика</div>
        </div>
      </div>

      <div class="stats-block">
        <div class="stats-block__title">Источники трафика</div>
        <div v-if="!stats.channels.length" class="stats-empty">Пока нет данных за период</div>
        <div v-else class="stats-table-wrap">
          <table class="stats-table">
            <thead>
              <tr>
                <th>Источник</th><th>Визиты</th><th>Посетители</th><th>Обращения</th>
                <th>Конверсия</th><th>Отказы</th><th>Время</th><th>Страниц</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in stats.channels" :key="row.channel">
                <td>{{ row.channelLabel }}</td>
                <td>{{ formatNumber(row.visits) }}</td>
                <td>{{ formatNumber(row.visitors) }}</td>
                <td>
                  <span v-if="row.conversions > 0" class="pill pill--success">{{ formatNumber(row.conversions) }}</span>
                  <span v-else>0</span>
                </td>
                <td>{{ row.conversionRate }}%</td>
                <td :class="{ 'stats-warn': row.bounceRate >= 60 }">{{ row.bounceRate }}%</td>
                <td>{{ formatSeconds(row.avgSeconds) }}</td>
                <td>{{ row.avgPages }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="stats-block">
        <div class="stats-block__title">
          Страницы
          <span class="stats-chip">{{ stats.pages.length }} стр. · {{ pageGroups.length }} групп</span>
        </div>
        <div v-if="!stats.pages.length" class="stats-empty">Пока нет данных за период</div>
        <div v-else class="stats-table-wrap">
          <table class="stats-table">
            <thead>
              <tr>
                <th>Страница</th><th>Просмотры</th><th>Время</th><th>Скролл</th><th>Выходы</th>
                <th class="stats-col-actions" aria-label="Подробнее"></th>
              </tr>
            </thead>
            <tbody>
              <template v-for="group in pageGroups" :key="group.key">
                <tr class="stats-group-row">
                  <td>
                    <span class="stats-group-label">
                      <Icon :name="group.icon" size="13" />
                      <span class="stats-group-label__text">{{ group.label }}</span>
                      <span class="stats-chip">{{ group.pages.length }}</span>
                    </span>
                  </td>
                  <td>{{ formatNumber(group.views) }}</td>
                  <td>{{ formatSeconds(group.avgSeconds) }}</td>
                  <td>
                    <div class="scroll-cell">
                      <div class="scroll-bar">
                        <div class="scroll-bar__fill" :class="{ 'scroll-bar__fill--low': group.avgScroll < 25 }" :style="{ width: `${group.avgScroll}%` }" />
                      </div>
                      <span class="stats-sub" :class="{ 'stats-warn': group.avgScroll < 25 }">{{ group.avgScroll }}%</span>
                    </div>
                  </td>
                  <td :class="{ 'stats-warn': group.exitRate >= 60 }">{{ formatNumber(group.exits) }} ({{ group.exitRate }}%)</td>
                  <td class="stats-col-actions"></td>
                </tr>
                <tr
                  v-for="row in group.pages"
                  :key="row.path"
                  class="stats-row--clickable stats-page-row"
                  tabindex="0"
                  :title="`Показать детали страницы ${row.path}`"
                  @click="openPage(row.path)"
                  @keydown.enter="openPage(row.path)"
                >
                  <td class="stats-path" :title="row.path">
                    <button
                      class="stats-path-link"
                      @click.stop="openPage(row.path)"
                      @keydown.stop
                    >{{ row.path }}</button>
                  </td>
                  <td>{{ formatNumber(row.views) }}</td>
                  <td>{{ formatSeconds(row.avgSeconds) }}</td>
                  <td>
                    <div class="scroll-cell">
                      <div class="scroll-bar">
                        <div class="scroll-bar__fill" :class="{ 'scroll-bar__fill--low': row.avgScroll < 25 }" :style="{ width: `${row.avgScroll}%` }" />
                      </div>
                      <span class="stats-sub" :class="{ 'stats-warn': row.avgScroll < 25 }">{{ row.avgScroll }}%</span>
                    </div>
                  </td>
                  <td :class="{ 'stats-warn': row.exitRate >= 60 }">{{ formatNumber(row.exits) }} ({{ row.exitRate }}%)</td>
                  <td class="stats-col-actions">
                    <Icon name="mdi:chevron-right" size="14" />
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>

      <div class="stats-block">
        <div class="stats-block__title">
          События
          <div class="stats-tabs">
            <button
              v-for="tab in eventTabs"
              :key="tab.key"
              type="button"
              class="stats-tab"
              :class="{ 'stats-tab--active': eventFilter === tab.key }"
              :title="tab.hint"
              @click="eventFilter = tab.key"
            >
              {{ tab.label }}<span class="stats-tab__count">{{ formatNumber(tab.total) }}</span>
            </button>
          </div>
        </div>
        <div v-if="!filteredEvents.length" class="stats-empty">Событий за период нет</div>
        <div v-else class="stats-table-wrap">
          <table class="stats-table">
            <thead>
              <tr>
                <th>Когда</th><th>Событие</th><th>Место</th><th>Детали</th>
                <th>Источник</th><th>Кампания</th><th>Визит</th><th>Город</th>
                <th class="stats-col-actions" aria-label="Подробнее"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in filteredEvents"
                :key="row.id"
                class="stats-row--clickable"
                tabindex="0"
                title="Открыть визит"
                @click="openSession(row.sessionId, row.visitorId)"
                @keydown.enter="openSession(row.sessionId, row.visitorId)"
              >
                <td>{{ formatFullDateTime(row.createdAt) }}</td>
                <td>
                  <span class="pill" :class="`pill--${eventBadge(row).tone}`">{{ eventBadge(row).label }}</span>
                  <span class="stats-sub"> · {{ eventLabel(row.type) }}</span>
                </td>
                <td class="stats-path" :title="formatPath(row.path)">
                  <button
                    v-if="row.path"
                    class="stats-path-link"
                    @click.stop="openPage(row.path)"
                    @keydown.stop
                  >{{ eventPlace(row.path) }}</button>
                  <span v-else>—</span>
                </td>
                <td class="stats-path" :title="eventMetaText(row.meta)">{{ eventMetaText(row.meta) || '—' }}</td>
                <td>
                  {{ row.channelLabel }}
                  <span v-if="row.referrerHost" class="stats-sub"> · {{ row.referrerHost }}</span>
                  <span v-if="row.linkedUserId" class="stats-staff">сотрудник: {{ row.linkedUserName || row.linkedUserId }}</span>
                </td>
                <td class="stats-path" :title="row.utmCampaign || ''">{{ row.utmCampaign || '—' }}</td>
                <td>№{{ row.visitNumber }}<span class="stats-sub"> · {{ row.pagesCount }} стр.</span></td>
                <td>{{ row.city || '—' }}</td>
                <td class="stats-col-actions"><Icon name="mdi:chevron-right" size="14" /></td>
              </tr>
            </tbody>
          </table>
          <div v-if="hiddenEventsCount > 0" class="stats-empty">
            Показаны последние {{ formatNumber(filteredEvents.length) }} из {{ formatNumber(eventsInFilterTotal) }} событий
          </div>
        </div>
      </div>

      <!-- Воронка: CTA → показ → открытие → фокус → ввод → заявка (уникальные визиты) -->
      <div class="stats-block">
        <div class="stats-block__title">
          Воронка форм по страницам
          <span class="stats-chip">{{ funnelRows.length }} стр. с CTA/формами</span>
        </div>
        <div v-if="!funnelRows.length" class="stats-empty">CTA и формы за период не использовали</div>
        <div v-else class="stats-table-wrap">
          <table class="stats-table">
            <thead>
              <tr>
                <th>Место формы</th>
                <th title="Уникальные визиты с кликом по CTA (в скобках — доля визитов, где затем открыли форму)">CTA</th>
                <th v-if="hasMicroData" title="Уникальные визиты, где форма попала в поле зрения (form_view, встроенные формы)">Показ</th>
                <th title="Уникальные визиты с открытой формой">Открытий</th>
                <th v-if="hasMicroData" title="Уникальные визиты с первым фокусом на поле (form_focus)">Фокус</th>
                <th v-if="hasMicroData" title="Уникальные визиты, где начали печатать в форме (form_typing)">Ввод</th>
                <th title="Уникальные визиты с отправленной формой">Отправок</th>
                <th>Доходимость</th>
                <th>Без заявки</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in funnelRows" :key="row.path || 'unknown'">
                <td class="stats-path" :title="formatPath(row.path)">
                  <button v-if="row.path" class="stats-path-link" @click="openPage(row.path)">{{ eventPlace(row.path) }}</button>
                  <span v-else>—</span>
                </td>
                <td>
                  <span v-if="row.ctaClicks > 0">
                    {{ formatNumber(row.ctaClicks) }}<span class="stats-sub"> · {{ row.ctaToFormRate }}%</span>
                  </span>
                  <span v-else>0</span>
                </td>
                <td v-if="hasMicroData">
                  <span v-if="row.views > 0">
                    {{ formatNumber(row.views) }}<span class="stats-sub"> · {{ row.viewToOpenRate }}%</span>
                  </span>
                  <span v-else>—</span>
                </td>
                <td>{{ formatNumber(row.opens) }}</td>
                <td v-if="hasMicroData" :class="{ 'stats-warn': row.opens > 0 && row.openToFocusRate < 50 }">
                  <span v-if="row.focuses > 0">
                    {{ formatNumber(row.focuses) }}<span class="stats-sub"> · {{ row.openToFocusRate }}%</span>
                  </span>
                  <span v-else>—</span>
                </td>
                <td v-if="hasMicroData" :class="{ 'stats-warn': row.focuses > 0 && row.focusToTypingRate < 70 }">
                  <span v-if="row.typings > 0">
                    {{ formatNumber(row.typings) }}<span class="stats-sub"> · {{ row.focusToTypingRate }}%</span>
                  </span>
                  <span v-else>—</span>
                </td>
                <td>
                  <span v-if="row.submits > 0" class="pill pill--success">{{ formatNumber(row.submits) }}</span>
                  <span v-else>0</span>
                </td>
                <td :class="{ 'stats-warn': row.opens > 0 && row.submitRate < 30 }">{{ row.submitRate }}%</td>
                <td>
                  <span v-if="row.noLead > 0" class="pill pill--muted">{{ formatNumber(row.noLead) }}</span>
                  <span v-else>0</span>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td>Всего</td>
                <td>
                  {{ formatNumber(funnelTotals.ctaClicks) }}<span class="stats-sub"> · {{ funnelTotals.ctaToFormRate }}%</span>
                </td>
                <td v-if="hasMicroData">
                  {{ formatNumber(funnelTotals.views) }}<span class="stats-sub"> · {{ funnelTotals.viewToOpenRate }}%</span>
                </td>
                <td>{{ formatNumber(funnelTotals.opens) }}</td>
                <td v-if="hasMicroData">
                  {{ formatNumber(funnelTotals.focuses) }}<span class="stats-sub"> · {{ funnelTotals.openToFocusRate }}%</span>
                </td>
                <td v-if="hasMicroData">
                  {{ formatNumber(funnelTotals.typings) }}<span class="stats-sub"> · {{ funnelTotals.focusToTypingRate }}%</span>
                </td>
                <td>{{ formatNumber(funnelTotals.submits) }}</td>
                <td>{{ funnelTotals.submitRate }}%</td>
                <td>{{ formatNumber(funnelNoLead) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div class="stats-block">
        <div class="stats-block__title">
          История визитов
          <span v-if="visitsCaption" class="stats-chip">{{ visitsCaption }}</span>
          <span v-if="hideStaff !== false" class="stats-chip">без сотрудников</span>
          <button
            v-if="canShowMoreVisits"
            class="crm-btn crm-btn--ghost crm-btn--sm stats-more"
            :disabled="loading"
            @click="emit('more-visits')"
          >
            <Icon name="mdi:chevron-down" size="14" />
            Показать ещё
          </button>
        </div>
        <div v-if="!stats.visits.length" class="stats-empty">Визитов за период нет</div>
        <div v-else class="stats-table-wrap">
          <table class="stats-table">
            <thead>
              <tr>
                <th>Начало</th><th>Посетитель</th><th>Источник</th><th>Кампания</th><th>Вход → выход</th><th>Город</th>
                <th>Страниц</th><th>Время</th><th>Устройство</th><th>Итог</th>
                <th v-if="isAdmin" class="stats-col-actions" aria-label="Действия"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in stats.visits"
                :key="row.id"
                class="stats-row--clickable"
                tabindex="0"
                title="Открыть визит"
                @click="openSession(row.id, row.visitorId)"
                @keydown.enter="openSession(row.id, row.visitorId)"
              >
                <td>{{ formatFullDateTime(row.startedAt) }}</td>
                <td>
                  <button
                    class="stats-visitor"
                    :title="`Открыть посетителя ${row.visitorId}`"
                    @click.stop="openVisitor(row.visitorId)"
                    @keydown.stop
                  >
                    {{ shortVisitorId(row.visitorId) }}
                  </button>
                  <button
                    class="stats-copy"
                    :title="copiedVisitorId === row.visitorId ? 'ID скопирован' : 'Скопировать ID посетителя'"
                    @click.stop="copyVisitorId(row.visitorId)"
                    @keydown.stop
                  >
                    <Icon :name="copiedVisitorId === row.visitorId ? 'mdi:check' : 'mdi:content-copy'" size="12" />
                  </button>
                </td>
                <td>
                  {{ row.channelLabel }}
                  <span v-if="row.visitNumber > 1" class="stats-sub"> · визит №{{ row.visitNumber }}</span>
                  <span v-if="row.linkedUserId" class="stats-staff">сотрудник: {{ row.linkedUserName || row.linkedUserId }}</span>
                  <span v-if="row.referrerHost" class="stats-sub"> · {{ row.referrerHost }}</span>
                </td>
                <td class="stats-path" :title="row.utmCampaign || ''">{{ row.utmCampaign || '—' }}</td>
                <td class="stats-path" :title="`${row.landingPath || ''} → ${row.exitPath || ''}`">{{ row.landingPath || '—' }} → {{ row.exitPath || '—' }}</td>
                <td>{{ row.city || '—' }}</td>
                <td>{{ row.pagesCount }}</td>
                <td>{{ formatSeconds(row.activeSeconds) }}</td>
                <td>{{ row.browser || '—' }}<span class="stats-sub"> · {{ deviceLabels[row.deviceType] || row.deviceType }}</span></td>
                <td>
                  <span v-if="row.converted" class="pill pill--success">обращение</span>
                  <span v-else-if="row.isBounce" class="pill pill--danger">отказ</span>
                  <span v-else class="pill pill--muted">—</span>
                </td>
                <td v-if="isAdmin" class="stats-col-actions">
                  <button
                    class="crm-btn crm-btn--ghost crm-btn--sm stats-row-delete"
                    title="Удалить визит из истории"
                    :disabled="deletingId === row.id"
                    @click.stop="emit('delete-visit', row)"
                    @keydown.stop
                  >
                    <Icon
                      :name="deletingId === row.id ? 'mdi:loading' : 'mdi:trash-outline'"
                      size="14"
                      :class="{ spin: deletingId === row.id }"
                    />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <div v-else class="online-state">
      <Icon name="mdi:loading" size="24" class="spin" />
      <span>Загрузка аналитики...</span>
    </div>

    <!-- Детализация: страница → посетитель → визит (состояние в URL-query) -->
    <PagesCabinetOnlineAnalyticsDetails
      v-if="detailsMounted"
      v-model:visible="detailsVisible"
      :stack="detailsStack"
      :days="statsDays"
      @push="pushStep"
      @pop="popStep"
      @goto="goToStep"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import type { ECharts, EChartsOption } from 'echarts'
import { echarts } from '~/lib/echarts'
import { isConversionEvent, isFormMicroEvent, isImpressionEvent } from 'shared/constants/visitorEvents'
import type { VisitorEventRow, VisitorStatsResponse, VisitorVisit } from '~/types'
import { useOnlineFormatters } from './composables/useOnlineFormatters'
import { buildDailySeries, chartThemeColors } from './composables/useEchartsTheme'
import { groupPages } from './composables/usePageGroups'
import {
  shortSessionId,
  shortVisitorId,
  type AnalyticsStep
} from './composables/useAnalyticsRoute'

const props = defineProps<{
  stats: VisitorStatsResponse | null
  statsDays: number
  loading: boolean
  error?: string | null
  /** Показывать колонку удаления (только для администратора) */
  isAdmin?: boolean
  /** ID визита, который удаляется прямо сейчас */
  deletingId?: string | null
  /** Скрывать ли из аналитики визиты сотрудников (по умолчанию да) */
  hideStaff?: boolean
  /** Время последней загрузки аналитики (мс) — подпись «обновлено в …» */
  statsUpdatedAt?: number | null
}>()

const emit = defineEmits<{
  'update:statsDays': [value: number]
  /** Переключение фильтра «без сотрудников» */
  'update:hideStaff': [value: boolean]
  /** Догрузить ещё визиты в историю */
  'more-visits': []
  refresh: []
  'delete-visit': [visit: VisitorVisit]
}>()

const {
  formatSeconds,
  formatFullDateTime,
  formatNumber,
  eventLabel,
  eventMetaText,
  formatPath,
  deviceLabels
} = useOnlineFormatters()

function onDaysChange(e: Event) {
  emit('update:statsDays', Number((e.target as HTMLSelectElement).value))
}

/** Фильтр «без сотрудников»: скрывает из цифр собственные заходы (после логина) */
function onHideStaffToggle(e: Event) {
  emit('update:hideStaff', (e.target as HTMLInputElement).checked)
}

/** Время последнего обновления аналитики: 14:32:05 */
function formatClock(ts: number | null | undefined): string {
  if (!ts) return '—'
  return new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

// ── События: фильтры по группам ─────────────────────────────────────────
type EventFilterKey = 'all' | 'conversion' | 'form_open' | 'other' | 'impression'

const EVENT_FILTER_HINTS: Record<EventFilterKey, string> = {
  all: 'Все события-действия посетителей за период (показы формы сюда не входят)',
  conversion: 'Обращения: клик по телефону, мессенджеру, email и отправка формы',
  form_open: 'Работа с формой: открытие/начало заполнения (form_open), фокус и ввод (form_focus / form_typing)',
  other: 'Прочие события: клики по CTA',
  impression: 'Показы формы (form_view, impression): форма продержалась в кадре. Действием не считается и в вовлечение не входит'
}

const eventFilter = ref<EventFilterKey>('all')

/** События-действия в форме: открытие, фокус, ввод (без показа — это impression) */
const isFormActionEvent = (type: string) => type === 'form_open' || (isFormMicroEvent(type) && !isImpressionEvent(type))

/** Счётчики по группам (полные за период, не только загруженная сотня) */
const eventTabs = computed(() => {
  const stats = props.stats?.eventStats || []
  const conversionTotal = stats.filter(s => s.isConversion).reduce((sum, s) => sum + s.total, 0)
  const formActionTotal = stats.filter(s => isFormActionEvent(s.type)).reduce((sum, s) => sum + s.total, 0)
  const impressionTotal = stats.filter(s => isImpressionEvent(s.type)).reduce((sum, s) => sum + s.total, 0)
  const otherTotal = stats
    .filter(s => !s.isConversion && !isFormActionEvent(s.type) && !isImpressionEvent(s.type))
    .reduce((sum, s) => sum + s.total, 0)
  // «Все» — события-действия: показы формы не должны раздувать счётчик
  const allTotal = stats
    .filter(s => !isImpressionEvent(s.type))
    .reduce((sum, s) => sum + s.total, 0) || (props.stats?.eventsTotal || 0)

  return [
    { key: 'all' as const, label: 'Все', total: allTotal, hint: EVENT_FILTER_HINTS.all },
    { key: 'conversion' as const, label: 'Обращения', total: conversionTotal, hint: EVENT_FILTER_HINTS.conversion },
    { key: 'form_open' as const, label: 'Открытия формы', total: formActionTotal, hint: EVENT_FILTER_HINTS.form_open },
    { key: 'other' as const, label: 'Прочее', total: otherTotal, hint: EVENT_FILTER_HINTS.other },
    { key: 'impression' as const, label: 'Показы формы', total: impressionTotal, hint: EVENT_FILTER_HINTS.impression }
  ]
})

const filteredEvents = computed<VisitorEventRow[]>(() => {
  const events = props.stats?.events || []
  switch (eventFilter.value) {
    case 'conversion': return events.filter(row => isConversionEvent(row.type))
    case 'form_open': return events.filter(row => isFormActionEvent(row.type))
    case 'impression': return events.filter(row => isImpressionEvent(row.type))
    case 'other': return events.filter(row => !isConversionEvent(row.type) && !isFormActionEvent(row.type) && !isImpressionEvent(row.type))
    default: return events.filter(row => !isImpressionEvent(row.type))
  }
})

const eventsInFilterTotal = computed(
  () => eventTabs.value.find(tab => tab.key === eventFilter.value)?.total || 0
)
const hiddenEventsCount = computed(
  () => Math.max(0, eventsInFilterTotal.value - filteredEvents.value.length)
)

/** Бейдж смысла события: заявка / обращение / вовлечение / показ */
function eventBadge(row: VisitorEventRow): { label: string; tone: 'success' | 'info' | 'muted' } {
  if (row.type === 'form_submit') return { label: 'заявка', tone: 'success' }
  if (row.isConversion) return { label: 'обращение', tone: 'info' }
  // Показ формы — impression: пользователь ничего не сделал, это не вовлечение
  if (isImpressionEvent(row.type)) return { label: 'показ', tone: 'muted' }
  return { label: 'вовлечение', tone: 'muted' }
}

/** Место события: путь как есть (моно-шрифт), для главной — человекочитаемо */
function eventPlace(path: string | null): string {
  if (!path) return '—'
  return path === '/' ? 'Главная (сайт)' : path
}

// ── Воронка форм: открытие → отправка ───────────────────────────────────
const funnelRows = computed(() => (props.stats?.formFunnel || []).map(row => ({
  ...row,
  noLead: Math.max(0, row.opens - row.submits)
})))

const funnelTotals = computed(() => props.stats?.formFunnelTotals || {
  ctaClicks: 0,
  views: 0,
  opens: 0,
  focuses: 0,
  typings: 0,
  submits: 0,
  ctaToFormRate: 0,
  viewToOpenRate: 0,
  openToFocusRate: 0,
  focusToTypingRate: 0,
  submitRate: 0,
  submitEvents: 0
})

const funnelNoLead = computed(() => Math.max(0, funnelTotals.value.opens - funnelTotals.value.submits))

/** Есть ли данные микро-трекинга: иначе шаги «показ/фокус/ввод» не показываем */
const hasMicroData = computed(() => {
  const t = props.stats?.totals
  return ((t?.formViews ?? 0) + (t?.formFocuses ?? 0) + (t?.formTypings ?? 0)) > 0
})

interface MicroFunnelStep {
  key: string
  label: string
  value: number
  /** Доля от предыдущего шага (у «показа» базы нет) */
  share: number | null
}

/** Полная воронка формы: показ → открытие → фокус → ввод → отправка */
const microFunnel = computed<MicroFunnelStep[]>(() => {
  const t = funnelTotals.value
  const views = t.views ?? 0
  const focuses = t.focuses ?? 0
  const typings = t.typings ?? 0
  const steps: MicroFunnelStep[] = [
    { key: 'view', label: 'Показ формы', value: views, share: null },
    { key: 'open', label: 'Открытие', value: t.opens, share: views ? t.viewToOpenRate : null },
    { key: 'focus', label: 'Фокус', value: focuses, share: t.opens ? t.openToFocusRate : null },
    { key: 'typing', label: 'Ввод', value: typings, share: focuses ? t.focusToTypingRate : null },
    { key: 'submit', label: 'Отправка', value: t.submits, share: t.opens ? t.submitRate : null }
  ]
  // form_view фиксируется только у встроенных форм: если показов нет, шаг не показываем
  return views > 0 ? steps : steps.slice(1)
})

/** Визиты, где форма открыта, но заявки не было (по сводке) */
const noLeadVisits = computed(() => Math.max(
  0,
  (props.stats?.totals?.formOpens ?? 0) - (props.stats?.totals?.formSubmits ?? 0)
))

const hasEventData = computed(() => (props.stats?.eventStats || []).some(item => item.total > 0 && !isImpressionEvent(item.type)))

// ── Страницы: логическая группировка по разделам сайта (прайс, офферы…) ─
const pageGroups = computed(() => groupPages(props.stats?.pages || []))

// ── Детализация: стек «страница → посетитель → визит» ───────────────────
const detailsStack = ref<AnalyticsStep[]>([])
/** Модалка монтируется на клиенте, чтобы не рендерить оверлей в SSR */
const detailsMounted = ref(false)

const detailsVisible = computed({
  get: () => detailsStack.value.length > 0,
  set: (value: boolean) => {
    if (!value) detailsStack.value = []
  }
})

/**
 * Кладёт шаг в стек. Если шаг такого типа уже есть — заменяет его и
 * отбрасывает более глубокие уровни (например, переход к другому посетителю).
 */
function pushStep(step: AnalyticsStep) {
  const index = detailsStack.value.findIndex(item => item.kind === step.kind)
  if (index >= 0) {
    detailsStack.value = [...detailsStack.value.slice(0, index), step]
  } else {
    detailsStack.value = [...detailsStack.value, step]
  }
}

function popStep() {
  detailsStack.value = detailsStack.value.slice(0, -1)
}

function goToStep(index: number) {
  if (index < 0 || index >= detailsStack.value.length) return
  detailsStack.value = detailsStack.value.slice(0, index + 1)
}

/** Клик по строке таблицы «Страницы» */
function openPage(path: string) {
  pushStep({ kind: 'page', id: path, title: path })
}

/** Клик по визиту (история или детали страницы) */
function openSession(sessionId: string, visitorId?: string) {
  if (visitorId && !detailsStack.value.some(step => step.kind === 'visitor')) {
    pushStep({ kind: 'visitor', id: visitorId, title: shortVisitorId(visitorId) })
  }
  pushStep({ kind: 'session', id: sessionId, title: `Визит ${shortSessionId(sessionId)}` })
}

/** Клик по ID посетителя в истории визитов — открыть карточку посетителя */
function openVisitor(visitorId: string) {
  pushStep({ kind: 'visitor', id: visitorId, title: shortVisitorId(visitorId) })
}

/** ID посетителя, который только что скопировали (галочка на кнопке) */
const copiedVisitorId = ref<string | null>(null)

/** Скопировать полный visitor_id — чтобы найти посетителя в БД/логах */
async function copyVisitorId(visitorId: string) {
  try {
    await navigator.clipboard.writeText(visitorId)
    copiedVisitorId.value = visitorId
    setTimeout(() => {
      if (copiedVisitorId.value === visitorId) copiedVisitorId.value = null
    }, 1500)
  } catch (error) {
    console.warn('[Аналитика] Не удалось скопировать ID посетителя:', error)
  }
}

/** Максимум визитов, который готов отдать сервер (VISITS_LIMIT_MAX в stats.get.ts) */
const VISITS_LIMIT_MAX = 300

/** Есть ли ещё визиты за пределами загруженной истории */
const canShowMoreVisits = computed(() => {
  const s = props.stats
  if (!s) return false
  return s.visits.length < (s.visitsTotal ?? 0) && (s.visitsLimit ?? 0) < VISITS_LIMIT_MAX
})

/** Подпись к истории визитов: «показаны последние 40 из 646» / «всего 12» */
const visitsCaption = computed(() => {
  const s = props.stats
  if (!s) return ''
  const total = s.visitsTotal ?? s.visits.length
  if (s.visits.length >= total) return `всего ${formatNumber(total)}`
  return `показаны последние ${formatNumber(s.visits.length)} из ${formatNumber(total)}`
})

// ── Графики ─────────────────────────────────────────────────────────────
const dailyChartRef = ref<HTMLElement | null>(null)
const channelsChartRef = ref<HTMLElement | null>(null)
const eventsChartRef = ref<HTMLElement | null>(null)

let dailyChart: ECharts | null = null
let channelsChart: ECharts | null = null
let eventsChart: ECharts | null = null

const dailyData = computed(() => {
  const { labels, series } = buildDailySeries(props.stats?.daily || [], ['visits', 'conversions'])
  return {
    labels,
    visits: series.visits || [],
    conversions: series.conversions || []
  }
})

function dailyOption(): EChartsOption {
  const c = chartThemeColors()
  const d = dailyData.value
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: c.tooltipBg,
      borderColor: c.border,
      textStyle: { color: c.textPrimary, fontSize: 12 }
    },
    legend: {
      data: ['Визиты', 'Обращения'],
      textStyle: { color: c.textMuted, fontSize: 11 },
      right: 0,
      top: 0,
      itemWidth: 12,
      itemHeight: 12
    },
    grid: { left: 8, right: 8, top: 30, bottom: 4, containLabel: true },
    xAxis: {
      type: 'category',
      data: d.labels,
      axisLine: { lineStyle: { color: c.border } },
      axisTick: { show: false },
      axisLabel: { color: c.textMuted, fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: c.border } },
      axisLabel: { color: c.textMuted, fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: [
      {
        name: 'Визиты',
        type: 'bar',
        data: d.visits,
        barWidth: '40%',
        itemStyle: { color: c.accent, borderRadius: [3, 3, 0, 0] }
      },
      {
        name: 'Обращения',
        type: 'line',
        data: d.conversions,
        smooth: true,
        symbolSize: 6,
        itemStyle: { color: c.success },
        lineStyle: { color: c.success, width: 2 }
      }
    ]
  }
}

function channelsOption(): EChartsOption {
  const c = chartThemeColors()
  const palette = [c.accent, c.info, c.success, c.warning, c.danger, c.textMuted]
  const data = [...(props.stats?.channels || [])]
    .filter(r => r.visits > 0)
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 7)
    .map((r, i) => ({ name: r.channelLabel, value: r.visits, itemStyle: { color: palette[i % palette.length] } }))

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: c.tooltipBg,
      borderColor: c.border,
      textStyle: { color: c.textPrimary, fontSize: 12 },
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 4,
      top: 'middle',
      textStyle: { color: c.textSecondary, fontSize: 11 },
      itemWidth: 10,
      itemHeight: 10
    },
    series: [{
      type: 'pie',
      radius: ['52%', '76%'],
      center: ['34%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: { borderColor: c.tooltipBg, borderWidth: 1 },
      label: { show: false },
      emphasis: { label: { show: false } },
      data
    }]
  }
}

function eventsOption(): EChartsOption {
  const c = chartThemeColors()
  const data = [...(props.stats?.eventStats || [])]
    // Показы формы (impression) — не события: в графике «События» им не место
    .filter(item => item.total > 0 && !isImpressionEvent(item.type))
    .sort((a, b) => a.total - b.total)

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: c.tooltipBg,
      borderColor: c.border,
      textStyle: { color: c.textPrimary, fontSize: 12 }
    },
    grid: { left: 8, right: 18, top: 8, bottom: 4, containLabel: true },
    xAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: c.border } },
      axisLabel: { color: c.textMuted, fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'category',
      data: data.map(d => eventLabel(d.type)),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: c.textSecondary, fontSize: 11 }
    },
    series: [{
      type: 'bar',
      data: data.map(d => ({
        value: d.total,
        itemStyle: {
          // 🟢 обращения · 🔵 вовлечение без заявки
          color: d.isConversion ? c.success : c.info,
          borderRadius: [0, 4, 4, 0]
        }
      })),
      barWidth: '60%'
    }]
  }
}

function disposeCharts() {
  dailyChart?.dispose(); dailyChart = null
  channelsChart?.dispose(); channelsChart = null
  eventsChart?.dispose(); eventsChart = null
}

async function renderCharts() {
  await nextTick()

  if (dailyChartRef.value && dailyData.value.labels.length) {
    if (!dailyChart) dailyChart = echarts.init(dailyChartRef.value)
    dailyChart.setOption(dailyOption(), true)
  }

  if (channelsChartRef.value && props.stats?.channels.length) {
    if (!channelsChart) channelsChart = echarts.init(channelsChartRef.value)
    channelsChart.setOption(channelsOption(), true)
  }

  if (eventsChartRef.value && props.stats?.eventStats?.some(item => item.total > 0)) {
    if (!eventsChart) eventsChart = echarts.init(eventsChartRef.value)
    eventsChart.setOption(eventsOption(), true)
  }
}

function onResize() {
  dailyChart?.resize()
  channelsChart?.resize()
  eventsChart?.resize()
}

onMounted(() => {
  detailsMounted.value = true
  if (props.stats) renderCharts()
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  disposeCharts()
  window.removeEventListener('resize', onResize)
})

watch(() => props.stats, (s) => {
  disposeCharts()
  if (s) nextTick(renderCharts)
})
</script>

<style lang="scss" scoped>
@use './online.shared.scss';

.stats-card { gap: 14px; }

.stats-staff {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  white-space: nowrap;
  width: max-content;
  margin-left: 5px;
  padding: 1px 6px;
  border-radius: var(--crm-radius-sm);
  background: var(--crm-info-dim);
  color: var(--crm-info);
  font-size: var(--crm-text-xs);
  font-weight: 600;
}

.stats-select {
  background: var(--crm-bg-overlay);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-sm);
  color: var(--crm-text-secondary);
  font-size: var(--crm-text-xs);
  padding: 3px 6px;
}

.stats-kpis {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;

  @media (max-width: 900px) { grid-template-columns: repeat(3, 1fr); }
  @media (max-width: 480px) { grid-template-columns: repeat(2, 1fr); }
}

/* 📝 Полоса «Формы за период»: заявки, открытия, доходимость */
.stats-forms {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 14px;
  padding: 8px 10px;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  font-size: var(--crm-text-xs);
  color: var(--crm-text-muted);

  &__item {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    white-space: nowrap;

    b {
      color: var(--crm-text-primary);
      font-family: var(--crm-font-mono);
      font-weight: 700;
    }

    &--success b { color: var(--crm-success); }
    &--warn b { color: var(--crm-warning); }
  }

  @media (max-width: 480px) {
    gap: 4px 10px;
  }
}

/* 🔻 Полная воронка формы: показ → открытие → фокус → ввод → отправка */
.stats-form-ladder {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  margin-top: 8px;
  padding: 8px 10px;
  background: var(--crm-bg-elevated);
  border: 1px dashed var(--crm-border);
  border-radius: var(--crm-radius-md);
  font-size: var(--crm-text-xs);

  &__step {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    white-space: nowrap;
  }

  &__label {
    color: var(--crm-text-muted);
  }

  &__value {
    color: var(--crm-text-primary);
    font-family: var(--crm-font-mono);
    font-weight: 700;
  }

  &__share {
    color: var(--crm-accent);
    font-family: var(--crm-font-mono);
  }

  &__arrow {
    color: var(--crm-text-muted);
    opacity: 0.6;
  }
}

.kpi {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);

  &__icon {
    width: 32px;
    height: 32px;
    border-radius: var(--crm-radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &--accent { background: var(--crm-accent-dim); color: var(--crm-accent); }
    &--info { background: var(--crm-info-dim); color: var(--crm-info); }
    &--success { background: var(--crm-success-dim); color: var(--crm-success); }
    &--warning { background: var(--crm-warning-dim); color: var(--crm-warning); }
    &--danger { background: var(--crm-danger-dim); color: var(--crm-danger); }
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  &__label {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
    white-space: nowrap;
  }

  &__value {
    font-size: var(--crm-text-md);
    font-weight: 700;
    color: var(--crm-text-primary);
  }
}

.stats-charts {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;

  @media (max-width: 700px) { grid-template-columns: 1fr; }
}

.chart-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  min-width: 0;

  &--wide { grid-column: 1 / -1; }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  &__title {
    font-size: var(--crm-text-xs);
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--crm-text-muted);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__canvas {
    width: 100%;
    height: 220px;

    &--sm { height: 180px; }
  }
}

.stats-block {
  display: flex;
  flex-direction: column;
  gap: 6px;

  &__title {
    font-size: var(--crm-text-xs);
    font-weight: 600;
    color: var(--crm-text-muted);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
}

.stats-chip {
  font-weight: 400;
  background: var(--crm-bg-overlay);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-sm);
  padding: 0 6px;
  color: var(--crm-text-secondary);
}

/* 🗂️ Фильтры событий: Все / Обращения / Открытия формы / Прочее / Показы формы */
.stats-tabs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}

.stats-tab {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-sm);
  background: var(--crm-bg-overlay);
  color: var(--crm-text-muted);
  font-family: inherit;
  font-size: var(--crm-text-xs);
  font-weight: 500;
  cursor: pointer;
  transition: var(--crm-transition);

  &:hover {
    border-color: var(--crm-border-hover);
    color: var(--crm-text-secondary);
  }

  &:focus-visible {
    outline: 1px solid var(--crm-accent);
    outline-offset: 1px;
  }

  &--active {
    border-color: var(--crm-accent-border);
    background: var(--crm-accent-dim);
    color: var(--crm-accent);
  }

  &__count {
    font-family: var(--crm-font-mono);
    font-weight: 700;
    opacity: 0.85;
  }
}

.stats-empty {
  font-size: var(--crm-text-xs);
  color: var(--crm-text-disabled);
  padding: 4px 0;
}

.stats-table-wrap { overflow-x: auto; }

.stats-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--crm-text-xs);

  th, td {
    padding: 5px 8px;
    text-align: left;
    white-space: nowrap;
    border-bottom: 1px solid var(--crm-border);
  }

  th { color: var(--crm-text-muted); font-weight: 600; }
  td { color: var(--crm-text-secondary); font-family: var(--crm-font-mono); }
  tbody tr:hover { background: var(--crm-bg-overlay); }

  tfoot td {
    font-weight: 600;
    color: var(--crm-text-muted);
    background: var(--crm-bg-overlay);
    border-bottom: none;
  }
}

.stats-path { max-width: 260px; overflow: hidden; text-overflow: ellipsis; }
.stats-sub { color: var(--crm-text-muted); }
.stats-ok { color: var(--crm-success); font-weight: 600; }
.stats-warn { color: var(--crm-warning); }

/* 🖱️ Кликабельные строки таблиц (переход в детализацию) */
.stats-row--clickable {
  cursor: pointer;

  &:focus-visible {
    outline: 1px solid var(--crm-accent);
    outline-offset: -1px;
  }
}

.stats-path-link {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  color: var(--crm-accent);
  cursor: pointer;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover { text-decoration: underline; }
  &:focus-visible { outline: 1px solid var(--crm-accent); outline-offset: 2px; }
}

/* 🗂️ Группы в таблице «Страницы»: раздел сайта + вложенные страницы */
.stats-group-row {
  background: var(--crm-bg-elevated);

  td {
    color: var(--crm-text-primary);
    border-top: 2px solid var(--crm-border-hover);
  }

  &:first-child td { border-top: none; }
}

.stats-table tbody .stats-group-row:hover {
  background: var(--crm-bg-elevated);
}

.stats-group-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--crm-font-sans);

  &__text { font-weight: 600; }
}

.stats-page-row td:first-child { padding-left: 26px; }

/* 🗑️ Колонка удаления визита (только администратор) */
.stats-table .stats-col-actions {
  width: 1%;
  text-align: right;
  font-family: inherit;
}

.stats-row-delete.crm-btn--ghost:hover {
  color: var(--crm-danger);
  border-color: var(--crm-danger);
  background: var(--crm-danger-dim);
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 7px;
  border-radius: 10px;
  font-size: var(--crm-text-xs);
  font-weight: 600;
  white-space: nowrap;

  &--success { background: var(--crm-success-dim); color: var(--crm-success); }
  &--danger { background: var(--crm-danger-dim); color: var(--crm-danger); }
  &--info { background: var(--crm-info-dim); color: var(--crm-info); }
  &--muted { background: var(--crm-bg-overlay); color: var(--crm-text-muted); }
}

.scroll-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.scroll-bar {
  width: 80px;
  height: 6px;
  border-radius: 3px;
  background: var(--crm-bg-overlay);
  overflow: hidden;
  flex-shrink: 0;

  &__fill {
    height: 100%;
    border-radius: 3px;
    background: var(--crm-info);
    transition: width 0.3s ease;

    &--low { background: var(--crm-warning); }
  }
}

/* 👤 История визитов: короткий ID посетителя, копирование и «Показать ещё» */
.stats-visitor {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  color: var(--crm-accent);
  cursor: pointer;

  &:hover { text-decoration: underline; }
  &:focus-visible { outline: 1px solid var(--crm-accent); outline-offset: 2px; }
}

.stats-copy {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 4px;
  padding: 0 2px;
  background: none;
  border: none;
  color: var(--crm-text-muted);
  cursor: pointer;

  &:hover { color: var(--crm-text-secondary); }
  &:focus-visible { outline: 1px solid var(--crm-accent); outline-offset: 1px; }
}

/* 🔄 Шапка блока: время последнего обновления и фильтр «без сотрудников» */
.stats-updated {
  font-size: var(--crm-text-xs);
  font-family: var(--crm-font-mono);
  color: var(--crm-text-disabled);
  white-space: nowrap;
}

.stats-staff-toggle { white-space: nowrap; }

.stats-more { margin-left: auto; }
</style>
