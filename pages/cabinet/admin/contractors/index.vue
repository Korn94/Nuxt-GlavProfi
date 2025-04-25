<template>
  <div class="container">
    <LayaoutCabinetHeaderWorkersMenu />
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'auth',
  allowedRoles: ['admin'],
  layout: 'cabinet',
});
</script>

<style lang="scss" scoped>
.container {
  margin: 0 auto;
  padding: 20px;
}
</style>