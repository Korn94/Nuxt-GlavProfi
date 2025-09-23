<template>
  <section class="ps">
    <div class="container">
      <div class="ps-content">
        <p><strong>P.S.</strong> Если вы дочитали до этого места — вы серьёзно относитесь к ремонту. Поэтому скажем прямо: мы не берёмся за проекты, где бюджет меньше 1 млн рублей на работы. Наша специализация — ремонт, который работает на ваш бизнес, а не просто "сделать красиво". Если это про вас — ждём вашу заявку.</p>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.ps {
  padding: 3rem 0;

  .container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
  }
  
  .ps-content {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    background: rgba(2, 254, 255, 0.1);
    border-radius: $border-radius;
    border: 1px solid $blue20;
    
    p {
      line-height: 1.8;
      font-size: 1.1rem;
      
      strong {
        color: $blue;
      }
    }
  }
}
</style>