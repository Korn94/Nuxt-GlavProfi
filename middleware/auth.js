export default defineNuxtRouteMiddleware((to, from) => {
  // Проверяем, что мы находимся на стороне клиента
  if (process.client) {
    const userData = localStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : null;

    // Если пользователь не авторизован, перенаправляем на страницу входа
    if (!user) {
      return navigateTo('/cabinet/login');
    }

    // Если пользователь авторизован, но пытается попасть на страницу логина, перенаправляем на главную - не работает
    if (user && to.path === '/cabinet/login') {
      return navigateTo('/cabinet');
    }

    // Проверяем роли пользователя
    const allowedRoles = to.meta.allowedRoles || [];
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return abortNavigation('У вас нет доступа к этой странице.');
    }
  } else {
    // Если middleware выполняется на сервере, перенаправляем на страницу входа
    return navigateTo('/cabinet/login');
  }
});

// Функция выхода из системы
export function logout() {
  if (process.client) {
    localStorage.removeItem('user'); // Удаляем данные пользователя
    navigateTo('/cabinet/login');   // Перенаправляем на страницу входа
  }
}