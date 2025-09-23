<template>
  <header :class="{ scrolled: data.isScrolled, home: isHomePage }">
    <div class="container">
      <div class="logo">
        <NuxtLink to="/">
          <p><span>Г</span>лав<span>П</span>рофи</p>
        </NuxtLink>
      </div>
      <nav>
        <ul>
          <li>
            <nuxt-link
              to="/"
              :class="{ active: route.path === '/' }"
              @click.prevent="navigateTo('/')"
            >
              Главная
            </nuxt-link>
          </li>
          <li>
            <nuxt-link
              to="/projects"
              :class="{ active: route.path === '/projects' }"
              @click.prevent="navigateTo('/projects')"
            >
              Портфолио
            </nuxt-link>
          </li>
          <li>
            <nuxt-link
              to="/remont-pomescheniy"
              :class="{ active: route.path === '/remont-pomescheniy' }"
              @click.prevent="navigateTo('/remont-pomescheniy')"
            >
              Услуги
            </nuxt-link>
          </li>
          <!-- <li class="dropdown">
            <nuxt-link to="/remont-pomescheniy" :class="{ active: isServiceActive }">Услуги</nuxt-link>
            <ul class="dropdown-menu">
              <li>
                <nuxt-link to="/remont-pomescheniy" :class="{ active: route.path === '/remont-pomescheniy' }" @click.prevent="navigateTo('/remont-pomescheniy')">
                  <Icon name="mdi:home-edit-outline" size="24px" class="icon" />
                  Ремонт помещений
                </nuxt-link>
              </li>
              <li>
                <nuxt-link to="/otdelochnye-i-stroitelnye-raboty" :class="{ active: route.path === '/otdelochnye-i-stroitelnye-raboty' }" @click.prevent="navigateTo('/otdelochnye-i-stroitelnye-raboty')">
                  <Icon name="material-symbols-light:construction-rounded" size="24px" class="icon" />
                  Отделочные и строительные работы
                </nuxt-link>
              </li>
            </ul>
          </li> -->
          <li>
            <nuxt-link
              to="/prices/floor"
              :class="{ active: route.path === '/prices/floor' || isPricesActive }"
              @click.prevent="navigateTo('/prices/floor')"
            >
              Цены
            </nuxt-link>
          </li>
          <li>
            <nuxt-link
            to="/about"
            :class="{ active: route.path === '/about' }"
            @click.prevent="navigateTo('/about')"
            >
            О нас
          </nuxt-link>
        </li>
        <li>
          <nuxt-link
            to="/#feedback"
            :class="{ active: route.path === '/#feedback' }"
            @click.prevent="navigateTo('/#feedback')"
          >
            Отзывы
          </nuxt-link>
        </li>
        <li>
          <nuxt-link
            to="/contacts"
            :class="{ active: route.path === '/contacts' }"
            @click.prevent="navigateTo('/contacts')"
          >
            Контакты
          </nuxt-link>
        </li>
        </ul>
      </nav>
      <div class="phone-box">
        <p class="txt-phone">Звоните Пн-Вс с 9:00 до 21:00</p>
        <p class="phone" @click="copyPhoneNumber">+7 910 909 69 47</p>
      </div>
    </div>
    <!-- Попап уведомления -->
    <UiAlerts
      :visible="data.isNotificationVisible"
      message="Номер скопирован!"
      color="green"
      @update:visible="data.isNotificationVisible = false"
    />
  </header>
</template>

<script setup>
import { useRoute, useRouter } from "vue-router";
import { ref, computed, reactive, onMounted, onBeforeUnmount } from "vue";

const route = useRoute();
const router = useRouter();

// Состояние для главной страницы
const isHomePage = computed(() => {
  return route.path === "/";
});

// Состояние для активности раздела "Услуги"
const isServiceActive = computed(() => {
  return (
    route.path.startsWith("/services/repair") ||
    route.path.startsWith("/services/decoration")
  );
});

// Состояние для активности кнопки "Цены"
const isPricesActive = ref(false);

// Метод для плавной прокрутки
const scrollToSection = (sectionId) => {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
};

// Обработчик прокрутки для выделения активного раздела
const handleScroll = () => {
  // Логика для фона при прокрутке
  data.isScrolled = window.scrollY > 50;

  // Логика для активности кнопки "Цены"
  if (isHomePage.value) {
    const pricesSection = document.getElementById("prices");
    if (pricesSection) {
      const rect = pricesSection.getBoundingClientRect();
      isPricesActive.value = rect.top <= 50 && rect.bottom >= 50;
    }
  }
};

// Навигация по ссылкам
const navigateTo = (path) => {
  router.push(path);
};

// Состояние для данных
const data = reactive({
  isScrolled: false,
  isNotificationVisible: false,
});

// Копирование номера телефона
const copyPhoneNumber = () => {
  const phoneNumber = "+79109096947";
  navigator.clipboard.writeText(phoneNumber).then(() => {
    data.isNotificationVisible = true;
  });
};

// Добавление обработчика прокрутки
onMounted(() => {
  window.addEventListener("scroll", handleScroll);
});

// Удаление обработчика прокрутки
onBeforeUnmount(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<style lang="scss" scoped>
header {
  position: fixed;
  top: 0;
  width: 100%;
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
  z-index: 100;

  // Начальный фон для главной страницы
  &.home {
    background-color: transparent; // Прозрачный фон для главной страницы
  }

  // Начальный фон для всех остальных страниц
  &:not(.home) {
    background-color: $background-dark;
  }

  // Цвет текста при прокрутке
  &.scrolled {
    background-color: $background-light;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);

    p,
    nav ul li a,
    .phone p {
      color: $color-dark;
    }
  }

  p,
  nav ul li a,
  .phone p {
    color: $text-light;
  }

  nav ul {
    display: flex;
    gap: 20px;

    li {
      position: relative;

      a {
        text-decoration: none;
        font-family: "Comfortaa", sans-serif;
        font-size: 16px;
        font-weight: 900;
        color: $text-light;
        transition: color 0.3s;

        &:hover {
          color: #00c3f5;
        }

        &.active {
          color: #00c3f5;
        }
      }

      &.dropdown {
        position: relative;

        > a {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: "Comfortaa", sans-serif;
          font-weight: 900;
          font-size: 16px;
          /* color: #fff; */
          transition: color 0.3s ease;

          &:hover,
          &.active {
            color: $blue;
          }

          &::after {
            content: '⮟';
            font-size: 10px;
            color: $color-dark;
            transition: transform 0.3s ease;
          }
        }

        &:hover > a::after {
          transform: rotate(180deg);
        }

        .dropdown-menu {
          display: none;
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          width: 420px;
          background: $background-light;
          border-radius: 12px;
          box-shadow: 0 10px 30px $shadow-color;
          overflow: hidden;
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition: all 0.3s ease;

          // Анимация появления
          @keyframes dropdownSlideDown {
            from {
              opacity: 0;
              transform: translateX(-50%) translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateX(-50%) translateY(0);
            }
          }

          li {
            list-style: none;

            a {
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 14px 20px;
              color: #111;
              text-decoration: none;
              font-size: 15px;
              font-weight: 600;
              transition: all 0.2s ease;

              &:hover {
                background: $border-color;
                /* color: #00a8d9; */
                transform: translateX(6px);
              }

              &.active {
                background: linear-gradient(90deg, #fff, #d0f4fb);
                font-weight: 700;
                background-color: #f0f9fc;
              }
            }
          }

          // Граница между пунктами
          li:not(:last-child) a {
            border-bottom: 1px solid #eee;
          }
        }

        &:hover .dropdown-menu {
          display: block;
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
          animation: dropdownSlideDown 0.3s ease forwards;
        }
      }
    }
  }

  .container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 20px;
    height: 80px;
  }

  .logo p {
    font-size: 20px;
    font-weight: 600;
    font-family: "Comfortaa", sans-serif;
    transition: 0.3s;

    span {
      color: #00c3f5;
    }
    
    &:hover {
      color: $blue;
    }
  }

  .phone-box {
    text-align: center;

    .phone {
      cursor: pointer;

      &:hover {
        color: $blue;
      }
    }

    .txt-phone {
      font-size: 10px;
    }
  }
}
</style>