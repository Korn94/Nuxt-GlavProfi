<template>
  <div class="wrap">
    <LayaoutCabinetHeader />
    <main>
      <NuxtPage />
    </main>
  </div>
</template>

<style lang="scss" scoped>
.wrap {
  display: flex;
  background-color: #f7fafc;

  main {
    margin: 5em auto;
    width: 100%;
    max-width: 1000px;
  }
}
</style>