<!-- app/components/pages/cabinet/Boards/ui/BoardTag.vue -->
 <template>
  <span class="board-tag" :style="{ backgroundColor: tag.color || '#6b7280' }">
    {{ tag.name }}
    <button v-if="showRemove" class="board-tag-remove" @click.stop="$emit('remove')">
      ×
    </button>
  </span>
</template>

<script setup lang="ts">
// Props
const props = defineProps<{
  tag: {
    id: number
    name: string
    color: string
  }
  showRemove?: boolean
}>()

// Emits
const emit = defineEmits<{
  remove: []
}>()
</script>

<style scoped lang="scss">
.board-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 13px;
  color: #fff;
  border-radius: 6px;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.board-tag-remove {
  background: rgba(0, 0, 0, 0.2);
  border: none;
  color: #fff;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  margin-left: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(0, 0, 0, 0.4);
  }
}
</style>