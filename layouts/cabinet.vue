<template>
  <div class="wrap">
    <LayaoutCabinetHeader />
    <main>
      <NuxtPage />
    </main>
    <!-- <footer>Подвал макета Cabinet</footer> -->
  </div>
</template>

<style lang="scss" scoped>
.wrap {
  display: flex;
  // background-color: #111;

  main {
    margin: 5em auto;
  }
}
</style>