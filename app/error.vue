<!-- app/error.vue -->
<template>
  <div v-if="error.statusCode === 404" class="error-404">
    <!-- Контент страницы 404 -->
    <div class="content-wrapper">
      <h1 class="glitch" data-text="404">
        404
      </h1>

      <div class="text-container">
        <h2>Страница затерялась на стройплощадке</h2>
        <p>Не переживайте! Наши мастера уже ищут её с рулеткой и уровнем</p>

        <div class="button-group">
          <!-- Кнопка "Вернуться" отображается только если есть куда вернуться -->
          <button 
            v-if="canGoBack" 
            @click="goBack" 
            class="back-link"
          >
            <span class="arrow">←</span> Вернуться
          </button>
          
          <NuxtLink to="/" class="home-link">
            На главную
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const error = useError();
const router = useRouter()

// Проверяем, можно ли вернуться назад
const canGoBack = computed(() => {
  if (typeof window !== 'undefined') {
    return window.history.length > 1;
  }
  return false;
})

// Функция для возврата назад
const goBack = () => {
  if (canGoBack.value) {
    router.back()
  } else {
    router.push('/')
  }
}

// Формируем заголовок и описание в зависимости от кода ошибки
const getTitle = () => {
  if (error.value?.statusCode === 404) {
    return 'Страница не найдена | ГлавПрофи'
  }
  if (error.value?.statusCode === 403) {
    return 'Доступ запрещён | ГлавПрофи'
  }
  return 'Ошибка на сайте | ГлавПрофи'
}

const getDescription = () => {
  if (error.value?.statusCode === 404) {
    return 'Извините, запрашиваемая страница не найдена. Вернитесь на главную или свяжитесь с нами.'
  }
  if (error.value?.statusCode === 403) {
    return 'У вас нет доступа к этой странице. Возможно, вы не авторизованы.'
  }
  return 'Произошла ошибка при загрузке страницы. Мы уже работаем над её устранением.'
}

// Устанавливаем мета-теги
useHead({
  title: getTitle(),
  meta: [
    { name: 'description', content: getDescription() },
    { property: 'og:title', content: getTitle() },
    { property: 'og:description', content: getDescription() },
    // { property: 'og:image', content: 'https://glavprofi.ru/images/error.jpg' },
  ]
})
</script>

<style scoped lang="scss">
// Переменные (замените на ваши из дизайн-системы)
$background-dark: #0a0e17;
$blue-gradient: linear-gradient(90deg, #00c3f5, #0efffd, #6e45e2);
$text-light: #ffffff;
$blue-light: #0efffd;
$blue20: rgba(2, 254, 255, 0.2);
$blue50: rgba(2, 254, 255, 0.5);
$border-radius: 8px;

.error-404 {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: $background-dark;
  display: flex;
  align-items: center;
  justify-content: center;

  // Космический фон с движением звёзд
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: 
      radial-gradient(circle at 20% 30%, rgba(2, 254, 255, 0.05) 0%, transparent 30%),
      radial-gradient(circle at 80% 10%, rgba(0, 195, 245, 0.07) 0%, transparent 25%),
      radial-gradient(circle at 40% 70%, rgba(110, 69, 226, 0.06) 0%, transparent 35%);
    animation: stars-pulse 8s infinite alternate;
    z-index: -1;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: $blue-gradient;
    opacity: 0.05;
    transform: rotate(45deg);
    animation: gradient-drift 20s linear infinite;
    z-index: -1;
  }
}

.content-wrapper {
  text-align: center;
  padding: 2rem;
  max-width: 800px;
  z-index: 1;
  animation: fadeIn 1.5s ease-out;
}

.glitch {
  font-size: 12rem;
  font-weight: 800;
  line-height: 1;
  margin: 0;
  background: $blue-gradient;
  background-size: 200% 200%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 
    0 0 20px rgba(2, 254, 255, 0.3),
    0 0 40px rgba(2, 254, 255, 0.2);
  position: relative;
  animation: 
    glitch 2.5s infinite,
    color-shift 8s infinite alternate;

  &::before,
  &::after {
    content: attr(data-text);
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    background: $blue-gradient;
    -webkit-background-clip: text;
    background-clip: text;
    opacity: 0.8;
  }

  &::before {
    animation: 
      glitch-top 2.5s infinite,
      color-shift 8s infinite alternate-reverse;
    clip-path: polygon(0 0, 100% 0, 100% 33%, 0 33%);
    transform: translate(-3px, -3px);
  }

  &::after {
    animation: 
      glitch-bottom 2.5s infinite,
      color-shift 8s infinite alternate;
    clip-path: polygon(0 67%, 100% 67%, 100% 100%, 0 100%);
    transform: translate(3px, 3px);
  }
}

.text-container {
  margin-top: -2rem;

  h2 {
    font-size: 2.5rem;
    margin-bottom: 1.5rem;
    color: $text-light;
    text-shadow: 0 0 10px rgba(0, 195, 245, 0.5);
    animation: float 6s ease-in-out infinite;
  }

  p {
    font-size: 1.4rem;
    color: $blue-light;
    max-width: 600px;
    margin: 0 auto 2.5rem;
    line-height: 1.6;
    text-shadow: 0 0 5px rgba(2, 254, 255, 0.3);
  }
}

.button-group {
  display: flex;
  gap: 1rem;
  justify-content: center;

  .back-link,
  .home-link {
    display: inline-block;
    padding: 1rem 2.5rem;
    background: $blue20;
    color: $blue-light;
    text-decoration: none;
    border-radius: $border-radius;
    font-size: 1.2rem;
    font-weight: 600;
    transition: all 0.3s ease;
    border: 1px solid $blue50;
    box-shadow: 0 0 20px $blue50;
    cursor: pointer;
    
    &:hover {
      background: $blue50;
      transform: translateY(-3px);
      box-shadow: 0 5px 25px rgba(0, 195, 245, 0.4);
      color: $text-light;
    }
    
    .arrow {
      margin-right: 10px;
      animation: pulse 1.5s infinite;
    }
  }
}

/* Анимации */
@keyframes glitch {
  0% { transform: translate(0); }
  20% { transform: translate(-3px, 3px); }
  40% { transform: translate(-3px, -3px); }
  60% { transform: translate(3px, 3px); }
  80% { transform: translate(3px, -3px); }
  100% { transform: translate(0); }
}

@keyframes glitch-top {
  0% { transform: translate(0, -1px); }
  20% { transform: translate(-3px, -4px); }
  40% { transform: translate(-3px, 2px); }
  60% { transform: translate(3px, -1px); }
  80% { transform: translate(3px, 3px); }
  100% { transform: translate(0, -1px); }
}

@keyframes glitch-bottom {
  0% { transform: translate(0, 1px); }
  20% { transform: translate(3px, 4px); }
  40% { transform: translate(3px, -2px); }
  60% { transform: translate(-3px, 1px); }
  80% { transform: translate(-3px, -3px); }
  100% { transform: translate(0, 1px); }
}

@keyframes color-shift {
  0% { background-position: 0% 50%; }
  100% { background-position: 100% 50%; }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes stars-pulse {
  0% { opacity: 0.6; }
  100% { opacity: 1; }
}

@keyframes gradient-drift {
  0% { transform: rotate(45deg) translateX(0); }
  100% { transform: rotate(45deg) translateX(50px); }
}

/* Адаптивность */
@media (max-width: 768px) {
  .glitch {
    font-size: 8rem;
  }

  .text-container {
    h2 {
      font-size: 1.8rem;
    }

    p {
      font-size: 1.1rem;
    }
  }

  .home-link {
    padding: 0.8rem 1.8rem;
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .glitch {
    font-size: 6rem;
  }

  .text-container {
    h2 {
      font-size: 1.4rem;
    }

    p {
      font-size: 0.95rem;
    }
  }
}
</style>