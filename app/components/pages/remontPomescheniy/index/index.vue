<template>
  <div class="commercial-repair">
    <div class="wrap">
      <PagesRemontPomescheniyIndexHero />
      <PagesRemontPomescheniyIndexStats />
    </div>
    <PagesRemontPomescheniyIndexServices />
    <PagesRemontPomescheniyIndexGuarantees />
    <PagesRemontPomescheniyIndexTestimonials />
    <PagesRemontPomescheniyIndexCTA />
    <PagesRemontPomescheniyIndexPS />
  </div>
</template>

<style lang="scss" scoped>
.commercial-repair {
  color: $text-light;
  position: relative;
  overflow: hidden;

  .wrap {
    background: $background-dark;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle at 5% 0%, $blue20 0%, transparent 10%);
      pointer-events: none;
    }
  }
}
</style>