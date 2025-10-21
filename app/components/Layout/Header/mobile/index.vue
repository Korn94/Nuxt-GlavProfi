<template>
  <div class="mobile-bottom-nav">
    <!-- Нижнее меню -->
    <nav>
      <ul>
        <li :class="{ active: !isMenuActive && currentRoute === 'index' }">
          <nuxt-link to="/" @click.native="closeMenus">
            <Icon name="solar:home-angle-broken" size="22px" />
            <span class="label">Главная</span>
          </nuxt-link>
        </li>
        <li :class="{ active: !isMenuActive && isPriceRoute }">
          <nuxt-link to="/prices/floor" @click.native="closeMenus">
            <Icon name="solar:tag-price-broken" size="22px" />
            <span class="label">Прайс-лист</span>
          </nuxt-link>
        </li>
        <li :class="{ active: !isMenuActive && currentRoute === 'contacts' }">
          <a href="tel:+79109096947" @click="closeMenus">
            <Icon name="solar:phone-line-duotone" size="22px" />
            <span class="label">Позвонить</span>
          </a>
        </li>
        <li :class="{ active: isMenuActive }" @click="toggleMenu">
          <Icon name="stash:burger-classic" size="22px" />
          <span class="label">Меню</span>
        </li>
      </ul>
    </nav>

    <!-- Модальное окно для "Меню" -->
    <div v-if="isMenuOpen" class="menu-overlay" @click="closeMenus">
      <div class="menu-background"></div>
      <div class="menu" @click.stop>
        <ul>
          <li :class="{ active: currentRoute === 'index' }">
            <nuxt-link to="/" @click.native="closeMenus">Главная</nuxt-link>
          </li>
          <!-- <li :class="{ active: isServiceActive }">
            <nuxt-link to="/services" @click.native="closeMenus">Услуги</nuxt-link>
          </li> -->
          <li :class="{ active: currentRoute === 'projects' }">
            <nuxt-link to="/projects" @click.native="closeMenus">Портфолио</nuxt-link>
          </li>
          <li :class="{ active: currentRoute === 'prices' }">
            <nuxt-link to="/prices/floor" @click.native="closeMenus">Цены</nuxt-link>
          </li>
          <li :class="{ active: currentRoute === 'feedback' }">
            <nuxt-link to="/#feedback" @click.native="closeMenus">Отзывы</nuxt-link>
          </li>
          <li :class="{ active: currentRoute === 'about' }">
            <nuxt-link to="/about" @click.native="closeMenus">О нас</nuxt-link>
          </li>
          <li :class="{ active: currentRoute === 'contacts' }">
            <nuxt-link to="/contacts" @click.native="closeMenus">Контакты</nuxt-link>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

// Текущий маршрут
const currentRoute = ref(route.name);

// Состояние модальных окон
const isServiceMenuOpen = ref(false);
const isMenuOpen = ref(false);

// Проверка активности пункта "Меню"
const isMenuActive = computed(() => {
  return isMenuOpen.value;
});

// Проверка, является ли текущий маршрут частью /prices/
const isPriceRoute = computed(() => {
  return route.path.startsWith('/prices/');
});

// Отслеживание изменения маршрута
watch(
  () => route.name,
  (newRoute) => {
    currentRoute.value = newRoute;
    closeMenus();
  }
);

// Открытие/закрытие модального окна "Меню"
const toggleMenu = () => {
  if (isServiceMenuOpen.value) {
    isServiceMenuOpen.value = false; // Закрываем услуги, если они открыты
  }
  isMenuOpen.value = !isMenuOpen.value;
};

// Закрытие всех модальных окон
const closeMenus = () => {
  isServiceMenuOpen.value = false;
  isMenuOpen.value = false;
};
</script>

<style lang="scss" scoped>
.mobile-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 300;
  // transform: translateZ(0);

  span {
    color: unset;
  }

  li, a, p {
    font-family: "Comfortaa", sans-serif;
  }

  nav {
    border-top: 1px solid $color-muted;
    background: $text-dark;
    
    ul {
      display: flex;
      justify-content: space-around;
      align-items: center;
      padding: 0;
      margin: 0;
      list-style: none;

      li {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 10px 0;
        cursor: pointer;
        transition: color 0.3s ease;
        color: $text-light;
        
        &.active {
          color: $blue;
        }

        .label {
          font-size: 10px;
          margin-top: 4px;
        }

        a {
          text-decoration: none;
          color: inherit;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
      }
    }
  }
}

/* Добавляем стили для модального окна "Меню" */
.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  z-index: -1;

  /* Затемнённый фон */
  .menu-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(5px);
    z-index: 1;
  }

  /* Само модальное окно */
  .menu {
    position: relative;
    z-index: 2;
    background: $background-gray;
    // backdrop-filter: blur(5px);
    width: 100%;
    // max-height: 50%;
    overflow-y: auto;
    border-top-left-radius: $border-radius;
    border-top-right-radius: $border-radius;
    padding: 20px 20px 70px;
    opacity: 0;
    animation: fadeIn 0.3s forwards;

    ul {
      list-style: none;
      padding: 0;
      margin: 0;

      li {
        padding: 10px;
        cursor: pointer;
        color: $text-light;
        transition: background-color 0.3s ease;
        border-radius: $border-radius;

        &.active {
          background-color: $blue;
        }
        
        &:hover {
          background-color: $background-light;
          color: $text-dark;
        }

        a {
          text-decoration: none;
          color: inherit;
          display: block;
        }
      }
    }
  }
}
</style>