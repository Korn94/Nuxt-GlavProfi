<template>
  <div class="wrap">
    <div class="intro">
      <div class="content">
        <p class="title-info">Результат</p>
        <p class="info" v-if="caseData.result">
          {{ caseData.result }}
        </p>
        <p class="info" v-else>
          Объект сдан в срок. Полгода — и фитнес центр уже принимает посетителей.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  caseData: {
    type: Object,
    required: true
  }
})
</script>

<style lang="scss" scoped>
.wrap {
  .intro {
    background: #fff;
    position: relative;
    z-index: 1;
    padding: 10em 5em;
    width: 100%;

    @media (max-width: 768px) {
      padding: 8em 2em;
    }

    p {
      line-height: 1.6;
    }

    .content {
      display: flex;
      margin: auto;
      justify-content: center;
      align-items: center;
      position: relative;
      padding-left: 20%;

        @media (max-width: 768px) {
          flex-direction: column;
          align-items: start;
          padding: unset;
          gap: 2em;
        }

      .info {
        font-weight: 600;
        font-size: 2em;
        line-height: 46px;
        max-width: 600px;
      }
    }
  }
}

.title-info {
  position: absolute;
  left: 0;
  letter-spacing: 0.2em;
  color: $text-gray;
  text-transform: uppercase;
  transform: rotate(-90deg) translateX(0%);
  margin-right: 10%;

  @media (max-width: 768px) {
    position: unset;
    transform: unset;
    margin: 2em 0 0;
  }
}
</style>