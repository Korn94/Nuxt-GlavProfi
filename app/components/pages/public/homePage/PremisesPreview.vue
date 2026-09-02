<!-- app\components\pages\public\homePage\PremisesPreview.vue -->
 <template>
  <section class="premises-preview">
    <div class="container">
      <h2 class="premises-preview__title">Основные <span class="blue">типы помещений</span></h2>
      <p class="premises-preview__subtitle">
        Работаем с коммерческими, производственными и специализированными объектами в <span class="blue">Рязани</span> и <span class="blue">Рязанской области</span>, а также в <span class="blue">Москве</span> и <span class="blue">МО</span>.
      </p>

      <div class="premises-preview__grid">
        <NuxtLink
          v-for="item in previewItems"
          :key="item.slug"
          :to="`/remont-pomescheniy/${item.slug}`"
          class="premises-preview__card"
        >
          <div class="premises-preview__card-image">
            <img :src="item.image" :alt="item.title" loading="lazy" class="premises-preview__img">
            <div class="premises-preview__card-overlay">
              <h3 class="premises-preview__card-title">{{ item.title }}</h3>
              <p v-if="item.subtitle" class="premises-preview__card-subtitle">{{ item.subtitle }}</p>
            </div>
          </div>

          <div class="premises-preview__card-body">
            <p class="premises-preview__card-desc">{{ item.description }}</p>

            <div class="premises-preview__prices">
              <span class="premises-preview__price-main">{{ item.price }}</span>
              <span class="premises-preview__price-example" v-if="item.priceExample">{{ item.priceExample }}</span>
            </div>
          </div>
        </NuxtLink>
      </div>

      <div class="premises-preview__footer">
        <NuxtLink to="/remont-pomescheniy" class="premises-preview__btn">
          Все помещения
          <Icon name="mdi:arrow-right" size="16" />
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const previewItems = [
  {
    slug: 'banki',
    title: 'Банки',
    subtitle: 'отделения, операционные залы, хранилища',
    category: 'commercial',
    price: 'от 14 000 ₽ за м²',
    priceExample: 'за 100 м² ~1.4–2.0 млн ₽',
    description: 'Работаем с учетом требований безопасности: усиленные перегородки, кабель-каналы под охранно-пожарную сигнализацию, зоны для инкассации.',
    image: 'main/remont-pomescheniy/banki.webp',
  },
  {
    slug: 'magaziny',
    title: 'Магазины',
    subtitle: 'ТЦ, стрит-ритейл, бутики',
    category: 'commercial',
    price: 'от 13 000 ₽ за м²',
    priceExample: 'за 100 м² ~1.3–1.9 млн ₽',
    description: 'Монтируем витринные группы, торговое оборудование, напольные покрытия по вашей спецификации. Сдаем объект готовым к выкладке товара.',
    image: 'main/remont-pomescheniy/magaziny.webp',
  },
  {
    slug: 'kliniki',
    title: 'Медицинские центры',
    subtitle: 'клиники, стоматологии, аптеки, лаборатории',
    category: 'other',
    price: 'от 8 500 ₽ за м²',
    priceExample: 'за 100 м² ~0.8–1.5 млн ₽',
    description: 'Отделка по проекту или ТЗ: бесшовные покрытия, стены под дезинфекцию, специфические материалы. Проверяем основание под спец. полы, герметичность мокрых зон.',
    image: 'main/remont-pomescheniy/medicina.webp',
  }
]
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.premises-preview {
  padding: 4rem 0;
  background: $background-dark;

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
  }

  &__title {
    @include section-title;
    color: $text-light;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 60px;
      height: 3px;
      background: $blue-gradient;
      border-radius: 2px;
      box-shadow: 0 0 10px $blue50;
    }
  }

  &__subtitle {
    color: rgba($text-light, 0.75);
    font-size: 1rem;
    margin-bottom: 2rem;
    max-width: 600px;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
  }

  &__card {
    background: rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: $border-radius;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: all 0.35s ease;
    text-decoration: none;
    color: inherit;

    &:hover {
      transform: translateY(-6px);
      box-shadow: 0 12px 25px rgba(0, 0, 0, 0.3);
      border-color: $blue;
      background: rgba(0, 195, 245, 0.06);
      cursor: pointer;
    }

    &:hover &__img {
      transform: scale(1.05);
    }
  }

  &__card-image {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background: rgba(0, 0, 0, 0.2);
  }

  &__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }

  &__card-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 1rem 1.2rem;
    background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%);
    z-index: 1;
  }

  &__card-title {
    font-size: 1.15rem;
    font-weight: 600;
    color: #fff;
    margin: 0 0 0.2rem;
    line-height: 1.3;
    text-shadow: 0 1px 3px rgba(0,0,0,0.4);
  }

  &__card-subtitle {
    font-size: 0.85rem;
    color: rgba(255,255,255,0.9);
    margin: 0;
  }

  &__card-body {
    padding: 1.2rem 1.4rem 1.4rem;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    flex: 1;
  }

  &__card-desc {
    font-size: 0.95rem;
    line-height: 1.55;
    color: rgba($text-light, 0.85);
    margin: 0;
  }

  &__prices {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    padding-top: 0.6rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    margin-top: auto;
  }

  &__price-main {
    font-size: 1.25rem;
    font-weight: 700;
    color: $blue-light;
  }

  &__price-example {
    font-size: 0.85rem;
    color: rgba($text-light, 0.5);
  }

  &__footer {
    display: flex;
    justify-content: center;
    padding-top: 2rem;
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.85rem 2rem;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: $text-light;
    border-radius: var(--border-radius, 6px);
    font-family: 'Rubik', sans-serif;
    font-weight: 500;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    text-decoration: none;

    &:hover {
      background: rgba(0, 195, 245, 0.1);
      border-color: $blue;
      color: $blue-light;
    }
  }
}

@media (max-width: 768px) {
  .premises-preview {
    padding: 3rem 0;

    &__title { font-size: 1.6rem; }
    &__grid { grid-template-columns: 1fr; }
  }
}
</style>