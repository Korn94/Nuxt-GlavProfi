<!-- app/components/pages/cabinet/objects/documents/index.vue -->
<template>
  <div class="documents-tab">
    <!-- Договор -->
    <PagesCabinetObjectsDocumentsContractStatus
      :object="object"
      :is-admin="isAdmin"
      @refresh="$emit('refresh')"
    />

    <!-- Смета -->
    <PagesCabinetObjectsDocumentsBudget
      :object-id="objectId"
      :is-admin="isAdmin"
      :object-income="object.finances?.totalIncome || 0"
    />

    <!-- Счета -->
    <PagesCabinetObjectsDocumentsInvoices
      :object-id="objectId"
      :invoices="object.invoices"
      :is-admin="isAdmin"
      @add="$emit('refresh')"
      @update="$emit('refresh')"
      @delete="$emit('refresh')"
    />
  </div>
</template>

<script setup>
defineProps({
  object: Object,
  objectId: Number,
  isAdmin: Boolean
})

// Пробрасываем событие наверх
defineEmits(['refresh'])
</script>

<style lang="scss" scoped>
.documents-tab {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
</style>