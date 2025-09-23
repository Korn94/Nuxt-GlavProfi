<template>
  <section class="hero">
    <div class="container">
      <h1 class="hero__title">
        Ремонт коммерческих помещений
      </h1>
      <p class="hero__highlight">Как превратить ваш бизнес в точку притяжения <span class="hero__subtitle">а не в ремонтную яму</span></p>
    </div>
  </section>
</template>

<style scoped lang="scss">
.hero {
  padding: 8rem 0 3rem;
  position: relative;
  overflow: hidden;

  .container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
  }

  &__title {
    font-size: 3.5rem;
    text-align: center;
    line-height: 1.1;
    margin-bottom: 4rem;
    background: $blue-gradient;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    font-weight: 800;

    @media (max-width: 768px) {
      font-size: 2.5rem;
    }
  }

  &__subtitle {
    font-size: 1.2rem;
    margin-top: 1rem;
    color: $yellow;
    font-weight: 500;
    opacity: 0.9;

    @media (max-width: 768px) {
      font-size: 1.4rem;
    }
  }

  &__highlight {
    font-size: 1.5rem;
    margin: auto;
    background: $background-gray;
    border-radius: 6px;
    padding: 2rem;
    font-weight: 500;
    color: $text-light;
    border-left: 4px solid $yellow;
  }
}

@media (max-width: 768px) {
  .hero {
    padding: 3rem 0 2rem;

    &__title {
      font-size: 2rem;
    }

    &__highlight {
      padding: 1.5rem;
    }
  }
}
</style>