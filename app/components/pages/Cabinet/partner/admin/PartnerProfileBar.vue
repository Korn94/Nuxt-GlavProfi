<!-- app/components/pages/Cabinet/partner/admin/PartnerProfileBar.vue -->
<template>
  <div v-if="partner" class="profile-bar">
    <div class="avatar" :style="{ backgroundColor: avatarColor }">{{ initials }}</div>
    <div class="profile-bar__info">
      <div class="profile-bar__name">
        {{ partner.companyName || partner.contactPerson || `Партнёр #${partner.id}` }}
        <span v-if="!partner.isActive" class="archive-badge">Архив</span>
      </div>
      <div class="profile-bar__meta">
        <span v-if="partner.contactPerson && partner.companyName">{{ partner.contactPerson }}</span>
        <span v-if="partner.phone"><Icon name="mdi:phone" size="13" /> {{ partner.phone }}</span>
        <span v-if="partner.email"><Icon name="mdi:email" size="13" /> {{ partner.email }}</span>
        <span v-if="partner.login"><Icon name="mdi:account-key" size="13" /> @{{ partner.login }}</span>
      </div>
      <p v-if="partner.comment" class="profile-bar__comment">{{ partner.comment }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Partner } from '~/types/partners'

const props = defineProps<{ partner: Partner | null }>()

const title = computed(() =>
  props.partner?.companyName || props.partner?.contactPerson || 'Партнёр'
)

const initials = computed(() => {
  return title.value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('') || '?'
})

const avatarColor = computed(() => {
  const colors = ['#00c3f5', '#3dd68c', '#f5a623', '#5b8def', '#f25f5c', '#8e44ad']
  return colors[(props.partner?.id || 0) % colors.length] || '#00c3f5'
})
</script>

<style lang="scss" scoped>
.profile-bar {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 24px;
  background: var(--crm-bg-surface);
  border-bottom: 1px solid var(--crm-border);

  &__info {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  &__name {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    font-size: var(--crm-text-lg);
    font-weight: 600;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    font-size: 13px;
    color: var(--crm-text-secondary);

    span {
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
  }

  &__comment {
    margin: 0;
    font-size: var(--crm-text-sm);
    color: var(--crm-text-muted);
  }
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: var(--crm-text-md);
  flex-shrink: 0;
}

.archive-badge {
  padding: 1px 6px;
  background: var(--crm-warning-dim);
  border: 1px solid rgba(245, 166, 35, 0.3);
  border-radius: 10px;
  font-size: 10px;
  font-weight: 700;
  color: var(--crm-warning);
  text-transform: uppercase;
}

@media (max-width: 767.98px) {
  .profile-bar {
    padding-left: 16px;
    padding-right: 16px;
  }
}
</style>
