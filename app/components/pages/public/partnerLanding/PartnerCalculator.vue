<!-- app/components/pages/public/partnerLanding/PartnerCalculator.vue -->
<template>
  <section id="calc" class="section section--calc">
    <div class="container">
      <div class="section-head">
        <div class="eyebrow">Сетка вознаграждения</div>
        <h2 class="section-title">Понятная сумма за каждого клиента.</h2>
        <p class="section-text">
          Никаких процентов и «индивидуальных условий». Вы всегда знаете, сколько получите:
          до передачи лида.
        </p>
      </div>

      <table class="reward-table">
        <thead>
          <tr>
            <th class="reward-table__th-tier">Тир</th>
            <th>Сумма договора</th>
            <th class="reward-table__th-right">Партнёрское вознаграждение</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="reward-table__tier">S</td>
            <td class="reward-table__range">до 1 млн ₽</td>
            <td class="reward-table__value">30 000 ₽</td>
          </tr>
          <tr>
            <td class="reward-table__tier">M</td>
            <td class="reward-table__range">1 – 2 млн ₽</td>
            <td class="reward-table__value">40 000 ₽</td>
          </tr>
          <tr>
            <td class="reward-table__tier">L</td>
            <td class="reward-table__range">2 – 3 млн ₽</td>
            <td class="reward-table__value">50 000 ₽</td>
          </tr>
          <tr>
            <td class="reward-table__tier">XL</td>
            <td class="reward-table__range">3 – 5 млн ₽</td>
            <td class="reward-table__value">70 000 ₽</td>
          </tr>
          <tr class="reward-table__row--highlight">
            <td class="reward-table__tier">XXL</td>
            <td class="reward-table__range">свыше 5 млн ₽</td>
            <td class="reward-table__value">
              100 000 ₽
              <small>+ 15 000 ₽ за каждый млн свыше 5</small>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="calc">
        <div class="calc__card">
          <h3>Калькулятор вознаграждения</h3>
          <p class="calc__sub">
            Передвиньте ползунок — увидите партнёрское вознаграждение по сетке.
          </p>

          <div class="calc__cost">
            {{ formatNumber(dealAmount) }}<small>₽</small>
          </div>

          <input
            v-model.number="dealAmount"
            type="range"
            class="calc__slider"
            min="300000"
            max="12000000"
            step="50000"
          />

          <div class="calc__tier-bar">
            <i
              v-for="(_, i) in tierInfo"
              :key="i"
              :class="{ active: currentTierIndex >= i }"
            />
          </div>
          <div class="calc__tier-label">
            Тир <b>{{ tierName }}</b> · договор {{ tierRange }}
          </div>

          <div class="calc__presets">
            <button
              v-for="preset in presets"
              :key="preset.value"
              type="button"
              :class="{ active: dealAmount === preset.value }"
              @click="dealAmount = preset.value"
            >
              {{ preset.label }}
            </button>
          </div>

          <div class="calc__hint">
            <b>Ориентиры по Рязани:</b>
            офис 80–150 м² — от 800К, магазин 150–300 м² — 1.5–3М, клиника / ресторан 300+ м²
            — 3–6М. Крупные объекты (склады, производства) — от 6М.
          </div>
        </div>

        <div class="calc__result-card">
          <div>
            <div class="calc__result-label">Ваше вознаграждение</div>
            <div class="calc__result">{{ formatNumber(rewardAmount) }} ₽</div>
          </div>

          <div class="calc__result-note">
            <b>Сделка</b>
            — подписанный договор + первый платёж клиента от 30% суммы.<br />
            <b>Выплата</b>
            — вся сумма единым платежом в течение 5 рабочих дней.<br />
            <b>Партнёр+</b>
            — от 3 сделок за 6 месяцев вознаграждение +20%.
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const dealAmount = ref(1500000)

const presets = [
  { label: 'Магазин · 800К', value: 800000 },
  { label: 'Офис · 1.5М', value: 1500000 },
  { label: 'Клиника · 2.5М', value: 2500000 },
  { label: 'Ресторан · 4М', value: 4000000 },
  { label: 'Объект · 8М', value: 8000000 },
]

const tierInfo = [
  { name: 'S', range: 'до 1 млн ₽' },
  { name: 'M', range: '1 – 2 млн ₽' },
  { name: 'L', range: '2 – 3 млн ₽' },
  { name: 'XL', range: '3 – 5 млн ₽' },
  { name: 'XXL', range: 'свыше 5 млн ₽' },
]

function formatNumber(n: number): string {
  return n.toLocaleString('ru-RU')
}

function getTierIndex(cost: number): number {
  if (cost < 1000000) return 0
  if (cost < 2000000) return 1
  if (cost < 3000000) return 2
  if (cost < 5000000) return 3
  return 4
}

function getReward(cost: number): number {
  if (cost < 1000000) return 30000
  if (cost < 2000000) return 40000
  if (cost < 3000000) return 50000
  if (cost < 5000000) return 70000

  const millionsAbove5 = Math.floor((cost - 5000000) / 1000000)
  return 100000 + millionsAbove5 * 15000
}

const rewardAmount = computed(() => getReward(dealAmount.value))
const currentTierIndex = computed(() => getTierIndex(dealAmount.value))
const tierName = computed(() => tierInfo[currentTierIndex.value].name)
const tierRange = computed(() => tierInfo[currentTierIndex.value].range)
</script>

<style lang="scss" scoped>
$accent: #4dd6ff;
$accent-2: #22bdf0;
$accent-soft: #e6f8ff;
$ink: #0f1114;
$line: #e4e6e0;
$paper: #ffffff;
$dark: #171a1c;

.container {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 28px;
  @media (max-width: 768px) { padding: 0 20px; }
  @media (max-width: 480px) { padding: 0 16px; }
}

.section {
  padding: 90px 0;
  position: relative;
  &--calc { padding-top: 20px; }

  @media (max-width: 768px) { padding: 70px 0; }
  @media (max-width: 480px) { padding: 50px 0; }
}

.eyebrow {
  font-size: 11.5px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-weight: 800;
  color: #7a7d80;
  margin-bottom: 14px;

  @media (max-width: 480px) { font-size: 10.5px; margin-bottom: 12px; }
}

.section-head {
  max-width: 740px;
  margin-bottom: 48px;
  @media (max-width: 768px) { margin-bottom: 36px; }
  @media (max-width: 480px) { margin-bottom: 28px; }
}

.section-title {
  font-family: 'Rubik', sans-serif;
  font-size: clamp(34px, 4vw, 52px);
  line-height: 1.02;
  letter-spacing: -0.05em;
  margin: 0 0 18px;
  font-weight: 900;
  color: $ink;

  :deep(span),
  :deep(.accent) {
    background: linear-gradient(120deg, $accent, $accent-2);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  @media (max-width: 768px) { font-size: clamp(28px, 5.5vw, 40px); }
  @media (max-width: 480px) { font-size: clamp(24px, 7vw, 32px); margin-bottom: 14px; }
}

.section-text {
  font-size: 17.5px;
  color: #555;
  margin: 0;
  line-height: 1.55;

  @media (max-width: 768px) { font-size: 15.5px; }
  @media (max-width: 480px) { font-size: 14.5px; }
}

.reward-table {
  width: 100%;
  border-collapse: collapse;
  background: $paper;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid $line;
  margin-bottom: 32px;

  th, td {
    text-align: left;
    padding: 22px 28px;
    border-bottom: 1px solid $line;
    font-size: 16px;
    vertical-align: middle;
  }
  th {
    background: #f0f2f3;
    font-size: 11.5px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #666;
    font-weight: 800;
  }
  &__th-tier { width: 60px; }
  &__th-right { text-align: right; }
  tr:last-child td { border-bottom: 0; }

  &__tier {
    font-weight: 900;
    font-size: 13px;
    color: #7a7d80;
    letter-spacing: 0.06em;
  }

  &__range { color: #3a3e41; font-weight: 500; }

  &__value {
    font-weight: 900;
    font-size: 18px;
    color: $ink;
    text-align: right;
    small {
      font-weight: 600;
      color: #7a7d80;
      font-size: 13px;
      display: block;
      margin-top: 2px;
    }
  }
  &__row--highlight td { background: rgba(77, 214, 255, 0.06); }

  @media (max-width: 768px) {
    th, td { padding: 16px 20px; font-size: 14.5px; }
    &__value { font-size: 16px; }
  }
  @media (max-width: 480px) {
    border-radius: 14px;
    th, td { padding: 12px 14px; font-size: 13px; }
    th { font-size: 10.5px; letter-spacing: 0.08em; }
    &__th-tier { width: auto; }
    &__tier { font-size: 11.5px; }
    &__value {
      font-size: 14px;
      small { font-size: 11px; margin-top: 0; }
    }
  }
}

.calc {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 18px;
  align-items: stretch;

  @media (max-width: 900px) { grid-template-columns: 1fr; }
}

.calc__card {
  background: $paper;
  border: 1px solid $line;
  border-radius: 24px;
  padding: 42px;

  h3 {
    margin: 0 0 8px;
    font-size: 24px;
    letter-spacing: -0.03em;
    font-weight: 800;
    color: $ink;
  }

  @media (max-width: 768px) { padding: 32px; }
  @media (max-width: 480px) { padding: 22px; border-radius: 18px; h3 { font-size: 21px; } }
}

.calc__sub {
  color: #666;
  margin: 0 0 32px;
  font-size: 15px;
  line-height: 1.5;

  @media (max-width: 480px) { margin-bottom: 24px; font-size: 14px; }
}

.calc__cost {
  font-size: 46px;
  font-weight: 900;
  letter-spacing: -0.055em;
  line-height: 1;
  margin-bottom: 8px;
  color: $ink;

  small {
    font-size: 18px;
    font-weight: 700;
    color: #999;
    letter-spacing: 0;
    margin-left: 2px;
  }

  @media (max-width: 768px) { font-size: 40px; small { font-size: 16px; } }
  @media (max-width: 480px) { font-size: 34px; small { font-size: 14px; } }
}

.calc__slider {
  width: 100%;
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  border-radius: 100px;
  background: #e6e9ea;
  outline: none;
  margin: 26px 0 14px;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: $dark;
    cursor: pointer;
    border: 4px solid $accent;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  }
  &::-moz-range-thumb {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: $dark;
    cursor: pointer;
    border: 4px solid $accent;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 480px) {
    margin: 22px 0 10px;
    height: 8px;
    &::-webkit-slider-thumb { width: 34px; height: 34px; border-width: 5px; }
    &::-moz-range-thumb { width: 34px; height: 34px; border-width: 5px; }
  }
}

.calc__tier-bar {
  display: flex;
  gap: 4px;
  margin-top: 20px;
  border-radius: 100px;
  overflow: hidden;
  height: 6px;

  i {
    flex: 1;
    background: #e6e9ea;
    display: block;
    border-radius: 100px;
    transition: background 0.2s ease;

    &.active { background: $accent; }
  }
}

.calc__tier-label {
  margin-top: 12px;
  font-size: 13px;
  color: #666;
  font-weight: 600;
  b { color: $ink; font-weight: 800; }

  @media (max-width: 480px) { font-size: 12.5px; }
}

.calc__presets {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 16px;

  button {
    background: #f0f2f3;
    border: 1px solid transparent;
    padding: 8px 14px;
    border-radius: 100px;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.2s;
    color: #3a3e41;

    &:hover { background: $accent-soft; border-color: rgba(77, 214, 255, 0.4); }
    &.active { background: $accent; border-color: $accent; color: #0a1a22; }
  }

  @media (max-width: 480px) {
    button { padding: 6px 10px; font-size: 12px; }
  }
}

.calc__hint {
  color: #666;
  font-size: 13.5px;
  line-height: 1.55;
  margin-top: 30px;
  padding-top: 24px;
  border-top: 1px solid $line;
  b { color: $ink; }

  @media (max-width: 480px) { font-size: 12.5px; margin-top: 22px; padding-top: 18px; }
}

.calc__result-card {
  background: $dark;
  color: #fff;
  border-radius: 24px;
  padding: 42px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    width: 300px; height: 300px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(77, 214, 255, 0.25) 0%, transparent 70%);
    right: -120px; bottom: -120px;
    pointer-events: none;
  }

  @media (max-width: 768px) { padding: 32px; }
  @media (max-width: 480px) { padding: 22px; border-radius: 18px; }
}

.calc__result-label {
  color: #b8bcc0;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin: 0 0 12px;
  position: relative;
  z-index: 1;
}

.calc__result {
  font-size: 64px;
  line-height: 1;
  font-weight: 900;
  letter-spacing: -0.06em;
  color: $accent;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) { font-size: 52px; }
  @media (max-width: 480px) { font-size: 42px; }
}

.calc__result-note {
  margin-top: 28px;
  color: #9aa0a4;
  font-size: 13.5px;
  line-height: 1.6;
  position: relative;
  z-index: 1;
  border-top: 1px solid #2f3438;
  padding-top: 22px;
  b { color: #fff; }

  @media (max-width: 480px) { font-size: 12.5px; margin-top: 20px; padding-top: 16px; }
}

#calc { scroll-margin-top: 90px; }
</style>