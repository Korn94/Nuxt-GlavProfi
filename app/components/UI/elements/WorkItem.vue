<template>
  <li class="work-item">
    <Icon name="fluent:copy-16-filled" width="16" height="16" @click="$emit('copy', item.title)" />
    <p class="work-title" v-html="highlightText(item.title)"></p>
    <p class="work-unit">{{ item.unit }}</p>
    <p class="work-price">{{ item.price }} ₽</p>

    <!-- Рекурсивное отображение вложенных элементов -->
    <ul v-if="item.subItems && item.subItems.length">
      <WorkItem
        v-for="subItem in item.subItems"
        :key="subItem.id"
        :item="subItem"
        @copy="$emit('copy', subItem.title)"
      />
    </ul>
  </li>
</template>

<script>
export default {
  props: {
    item: {
      type: Object,
      required: true,
      default: () => ({}),
    },
  },
  methods: {
    highlightText(text) {
      const query = this.$parent.searchQuery.trim();
      if (!query) return text;

      const regExp = new RegExp(`(${query})`, "gi");
      return text.replace(regExp, `<span class="highlight">$1</span>`);
    },
  },
};
</script>

<style lang="scss" scoped>
.work-item {
  display: flex;
  justify-content: space-between;
  padding: 5px 10px;
  border-bottom: 1px solid #ddd;

  &:last-child {
    border-bottom: none;
  }

  .work-title {
    flex: 1;
    white-space: pre-wrap;
  }

  .highlight {
    background-color: #ff9800;
    color: white;
    font-weight: bold;
  }

  .work-unit, .work-price {
    display: inline-flex;
    align-items: center;
    width: 50px;
  }
}
</style>