<template>
  <div
    class="copy-row"
    :class="rowClasses"
    role="button"
    tabindex="0"
    :aria-label="`Скопировать: ${label}`"
    @click="handleCopy"
    @keydown.enter.prevent="handleCopy"
    @keydown.space.prevent="handleCopy"
  >
    <div class="copy-row__label">
      {{ label }}
    </div>

    <div class="copy-row__value-wrap">
      <Icon
        v-if="icon"
        :name="icon"
        size="15"
        class="copy-row__icon"
      />

      <a
        v-if="link && href"
        :href="href"
        class="copy-row__value copy-row__link"
        @click.stop
      >
        {{ displayValue || value }}
      </a>

      <span
        v-else
        class="copy-row__value"
      >
        {{ displayValue || value }}
      </span>

      <div class="copy-row__action">
        <Transition
          name="copy-fade"
          mode="out-in"
        >
          <Icon
            v-if="copied"
            key="check"
            name="mdi:check-circle"
            size="17"
            class="is-check"
          />

          <Icon
            v-else
            key="copy"
            name="mdi:content-copy"
            size="15"
            class="is-copy"
          />
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useNotifications } from '~/composables/useNotifications'
import { copyToClipboard } from '~/utils/clipboard'

const notifications = useNotifications()

const props = defineProps({
  label: {
    type: String,
    required: true
  },

  value: {
    type: String,
    required: true
  },

  displayValue: {
    type: String,
    default: null
  },

  mono: {
    type: Boolean,
    default: false
  },

  link: {
    type: Boolean,
    default: false
  },

  href: {
    type: String,
    default: null
  },

  highlight: {
    type: Boolean,
    default: false
  },

  icon: {
    type: String,
    default: null
  }
})

const copied = ref(false)

let timeout = null

const rowClasses = computed(() => ({
  'is-copied': copied.value,
  'is-mono': props.mono,
  'is-link': props.link,
  'is-highlight': props.highlight
}))

const handleCopy = async () => {
  const ok = await copyToClipboard(props.value)

  if (!ok) {
    notifications.error(
      'Не удалось скопировать',
      'Проверьте разрешения браузера'
    )

    return
  }

  copied.value = true

  notifications.success(
    'Скопировано',
    props.value.length > 40
      ? props.label
      : props.value
  )

  clearTimeout(timeout)

  timeout = setTimeout(() => {
    copied.value = false
  }, 2000)
}

onBeforeUnmount(() => {
  clearTimeout(timeout)
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.copy-row {
  position: relative;

  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  gap: 1rem;

  padding: 0.72rem 0.35rem;

  border-bottom: 1px solid rgba(0, 0, 0, 0.055);

  border-radius: 8px;

  cursor: pointer;

  transition:
    background-color 0.2s ease,
    padding-left 0.2s ease,
    padding-right 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    padding-left: 0.55rem;
    padding-right: 0.55rem;

    background: rgba(0, 195, 245, 0.045);

    .is-copy {
      opacity: 1;
      color: $blue;
      transform: scale(1.05);
    }

    .copy-row__value {
      color: $text-dark;
    }
  }

  &:active {
    transform: scale(0.995);
  }

  &:focus-visible {
    outline: 2px solid rgba(0, 195, 245, 0.4);
    outline-offset: 2px;
  }

  &.is-copied {
    background: rgba(0, 161, 42, 0.06);

    .copy-row__value {
      color: $green;
    }
  }

  &.is-highlight {
    margin: 0.25rem 0;
    padding: 0.8rem;

    background: rgba(0, 195, 245, 0.045);

    border: 1px solid rgba(0, 195, 245, 0.16);

    &:hover {
      background: rgba(0, 195, 245, 0.08);
    }
  }

  &__label {
    flex: 0 0 38%;
    max-width: 42%;

    padding-top: 1px;

    color: $text-gray;

    font-size: 0.76rem;
    line-height: 1.5;
  }

  &__value-wrap {
    min-width: 0;

    flex: 1;

    display: flex;
    align-items: flex-start;
    justify-content: flex-end;

    gap: 0.45rem;
  }

  &__icon {
    flex-shrink: 0;

    margin-top: 3px;

    color: $text-gray;
  }

  &__value {
    min-width: 0;

    color: $text-dark;

    font-size: 0.82rem;
    font-weight: 500;
    line-height: 1.5;

    text-align: right;

    word-break: break-word;

    transition: color 0.2s ease;
  }

  &__link {
    color: $blue;

    &:hover {
      color: #008baa;
      text-decoration: underline;
      text-underline-offset: 3px;
    }
  }

  &.is-mono &__value {
    font-family:
      'JetBrains Mono',
      'Courier New',
      monospace;

    font-size: 0.79rem;
    font-variant-numeric: tabular-nums;

    letter-spacing: 0.015em;
  }

  &__action {
    width: 22px;
    height: 22px;

    display: flex;
    align-items: center;
    justify-content: center;

    flex-shrink: 0;

    margin-top: 1px;
  }

  .is-copy {
    color: $text-gray;

    opacity: 0;

    transition:
      opacity 0.2s ease,
      color 0.2s ease,
      transform 0.2s ease;
  }

  .is-check {
    color: $green;

    animation:
      pop
      0.3s
      cubic-bezier(0.34, 1.56, 0.64, 1);
  }
}

/* ==========================================
   COPY ANIMATION
========================================== */

.copy-fade-enter-active,
.copy-fade-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.copy-fade-enter-from,
.copy-fade-leave-to {
  opacity: 0;
  transform: scale(0.55);
}

@keyframes pop {
  0% {
    transform: scale(0);
  }

  60% {
    transform: scale(1.25);
  }

  100% {
    transform: scale(1);
  }
}

/* ==========================================
   MOBILE
========================================== */

@media (max-width: 640px) {
  .copy-row {
    flex-direction: column;

    gap: 0.25rem;

    padding: 0.65rem 0.25rem;

    &__label {
      flex: none;

      max-width: 100%;

      font-size: 0.68rem;
      font-weight: 500;

      letter-spacing: 0.025em;
      text-transform: uppercase;
    }

    &__value-wrap {
      width: 100%;

      justify-content: flex-start;
    }

    &__value {
      text-align: left;

      font-size: 0.84rem;
    }

    &.is-mono &__value {
      font-size: 0.8rem;
    }

    .is-copy {
      opacity: 0.55;
    }
  }
}

@media print {
  .copy-row {
    cursor: default;

    &:hover {
      padding-left: 0.35rem;
      padding-right: 0.35rem;

      background: transparent;

      .is-copy {
        opacity: 0;
      }
    }

    &__action {
      display: none;
    }

    &__link {
      color: #333 !important;
      text-decoration: none !important;
    }
  }
}
</style>