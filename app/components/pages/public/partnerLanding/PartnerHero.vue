<!-- app/components/pages/public/partnerLanding/PartnerHero.vue -->
<template>
  <div class="partner__nav-wrap">
    <nav class="partner__nav">
      <div class="logo">
        Глав <span class="pill">Профи</span>
      </div>
      <a class="navlink" href="#how">Как это работает</a>
    </nav>
  </div>

  <header class="hero">
    <div class="container">
      <div class="hero__grid">
        <div>
          <div class="kicker">
            <span class="dot"></span>
            Партнёрская программа для коммерческих брокеров · Рязань
          </div>

          <h1 class="hero__title">
            Партнёрское<br />
            вознаграждение за <em>каждого<br />клиента.</em>
          </h1>

          <p class="hero__lead">
            Вы помогаете клиенту найти коммерческое помещение. Мы помогаем превратить его
            в работающий бизнес. Вы передаёте лид — ГлавПрофи ведёт ремонт — вы получаете
            фиксированную сумму за результат.
          </p>

          <div class="hero__actions">
            <a class="btn btn--dark" href="#join">
              Стать партнёром
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>

            <a class="btn btn--light" href="#calc">Посчитать вознаграждение</a>
          </div>

          <div class="hero__note">
            Без обязательства рекомендовать нас. Решение о работе с подрядчиком всегда
            остаётся за клиентом.
          </div>
        </div>

        <div class="hero-card">
          <div class="hero-card__badge">Средний чек партнёра · 2026</div>

          <div class="hero-card__money">40–70 тыс. ₽</div>
          <div class="hero-card__money-sub">
            с одного закрытого клиента. Фиксированная сумма — не зависит от того, сколько
            клиент с нами сторгуется.
          </div>

          <h3 class="hero-card__title">
            Один клиент.<br />
            Две сделки.
          </h3>

          <div class="mini-flow">
            <div class="mini-flow__row">
              <b>Вы</b><span>приводите клиента</span>
            </div>
            <div class="mini-flow__row">
              <b>ГлавПрофи</b><span>продаёт и выполняет ремонт</span>
            </div>
            <div class="mini-flow__row">
              <b>Вы</b><span>получаете партнёрское вознаграждение</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<style lang="scss" scoped>
$accent: #4dd6ff;
$accent-2: #22bdf0;
$ink: #0f1114;
$line: #e4e6e0;
$dark: #171a1c;

.container {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 28px;

  @media (max-width: 768px) { padding: 0 20px; }
  @media (max-width: 480px) { padding: 0 16px; }
}

.partner__nav-wrap {
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(244, 245, 243, 0.88);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.partner__nav {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 28px;
  height: 82px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  @media (max-width: 768px) { padding: 0 20px; height: 72px; }
  @media (max-width: 480px) { padding: 0 16px; height: 64px; }
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 900;
  letter-spacing: -0.04em;
  font-size: 24px;
  color: $ink;

  .pill {
    background: $accent;
    color: #0a1a22;
    padding: 2px 10px;
    border-radius: 9px;
    display: inline-block;
    margin-left: 4px;
  }

  @media (max-width: 480px) { font-size: 20px; }
}

.navlink {
  font-size: 14px;
  color: #555;
  font-weight: 500;
  transition: color 0.2s;
  &:hover { color: $ink; }
  @media (max-width: 640px) { display: none; }
}

.hero {
  padding: 36px 0 90px;
  @media (max-width: 900px) { padding: 24px 0 60px; }
  @media (max-width: 480px) { padding: 16px 0 40px; }
}

.hero__grid {
  display: grid;
  grid-template-columns: 1.35fr 0.9fr;
  gap: 48px;
  align-items: center;

  @media (max-width: 900px) { grid-template-columns: 1fr; gap: 32px; }
  @media (max-width: 480px) { gap: 24px; }
}

.kicker {
  display: inline-flex;
  gap: 10px;
  align-items: center;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #555;
  margin-bottom: 22px;

  @media (max-width: 480px) { font-size: 10px; margin-bottom: 16px; }
}

.dot {
  width: 8px;
  height: 8px;
  background: $accent;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(77, 214, 255, 0.25);
  flex-shrink: 0;
}

.hero__title {
  font-family: 'Rubik', sans-serif;
  font-size: clamp(44px, 6vw, 78px);
  line-height: 0.96;
  letter-spacing: -0.055em;
  margin: 0 0 26px;
  font-weight: 900;
  color: $ink;

  em { font-style: normal; color: $accent-2; }

  @media (max-width: 900px) { font-size: clamp(36px, 7vw, 56px); margin-bottom: 20px; }
  @media (max-width: 640px) { font-size: clamp(32px, 9vw, 44px); }
  @media (max-width: 480px) { font-size: clamp(28px, 10vw, 36px); margin-bottom: 16px; }
}

.hero__lead {
  font-size: 20px;
  max-width: 620px;
  color: #4a4d50;
  margin: 0 0 30px;
  line-height: 1.5;

  @media (max-width: 768px) { font-size: 17px; margin-bottom: 24px; }
  @media (max-width: 480px) { font-size: 15px; margin-bottom: 20px; }
}

.hero__actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    flex-direction: column;
    .btn { width: 100%; justify-content: center; }
  }
}

.hero__note {
  font-size: 12.5px;
  color: #7a7d80;
  margin-top: 16px;
  max-width: 520px;
  line-height: 1.5;

  @media (max-width: 480px) { font-size: 11.5px; margin-top: 12px; }
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  border: 0;
  border-radius: 12px;
  padding: 15px 24px;
  font-weight: 800;
  cursor: pointer;
  font-size: 15px;
  font-family: inherit;
  text-decoration: none;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease, color 0.18s ease;
  &:hover { transform: translateY(-1px); }

  @media (max-width: 480px) { padding: 14px 20px; font-size: 14px; }
}

.btn--dark {
  background: $dark;
  color: #fff;
  &:hover { box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18); color: #fff; }
}

.btn--light {
  background: #fff;
  border: 1px solid $line;
  color: $ink;
  &:hover { background: #fafaf6; box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06); color: $ink; }
}

.hero-card {
  background: $dark;
  color: #fff;
  border-radius: 24px;
  padding: 30px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.14);
  isolation: isolate;

  &::after {
    content: '';
    position: absolute;
    width: 220px;
    height: 220px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(77, 214, 255, 0.9) 0%, rgba(77, 214, 255, 0) 70%);
    right: -90px;
    top: -90px;
    pointer-events: none;
    z-index: -1;
  }

  @media (max-width: 768px) { padding: 26px; }
  @media (max-width: 480px) { padding: 20px; border-radius: 18px; }
}

.hero-card__badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(77, 214, 255, 0.12);
  color: $accent;
  padding: 6px 12px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  position: relative;
  z-index: 1;
  margin-bottom: 16px;
}

.hero-card__money {
  font-size: 52px;
  line-height: 1;
  font-weight: 900;
  letter-spacing: -0.06em;
  color: $accent;
  position: relative;
  z-index: 1;

  @media (max-width: 640px) { font-size: 42px; }
  @media (max-width: 480px) { font-size: 36px; }
}

.hero-card__money-sub {
  color: #b8bcc0;
  margin: 12px 0 26px;
  position: relative;
  z-index: 1;
  font-size: 13.5px;
  line-height: 1.5;

  @media (max-width: 480px) { font-size: 12.5px; margin-bottom: 20px; }
}

.hero-card__title {
  font-size: 26px;
  letter-spacing: -0.03em;
  margin: 0 0 20px;
  position: relative;
  z-index: 1;
  line-height: 1.15;
  color: #fff;
  font-weight: 800;

  @media (max-width: 480px) { font-size: 22px; margin-bottom: 16px; }
}

.mini-flow {
  border-top: 1px solid #2f3438;
  padding-top: 20px;
  display: grid;
  gap: 14px;
  position: relative;
  z-index: 1;

  @media (max-width: 480px) { padding-top: 16px; gap: 12px; }
}

.mini-flow__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  font-size: 14px;

  b { color: #fff; font-weight: 800; }
  span { color: #8b9094; font-size: 13px; text-align: right; }

  @media (max-width: 480px) { font-size: 13px; }
}
</style>