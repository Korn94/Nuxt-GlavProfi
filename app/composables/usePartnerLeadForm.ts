// app\composables\usePartnerLeadForm.ts
//
// Единое состояние модальной формы заявки для лендинга /partner.
// Используется компонентами PartnerHero (кнопка "Стать партнёром")
// и PartnerClosing (CTA-секция #join + сама модалка), чтобы обе кнопки
// открывали одну и ту же форму. Отправка — на реальный эндпоинт /api/send-message.

import { ref, reactive } from 'vue'
import { useNotifications } from '~/composables/useNotifications'

// Синглтон-состояние на уровне модуля, чтобы все вызовы композабла
// разделяли одно и то же окно/данные формы.
const isModalOpen = ref(false)
const isSubmitted = ref(false)
const isSubmitting = ref(false)
const phoneError = ref(false)

const form = reactive({
  name: '',
  phone: '+7 ',
  company: '',
  comment: '',
})

export function usePartnerLeadForm() {
  const notifications = useNotifications()

  // Авто-форматирование имени: только буквы, каждое слово с заглавной
  function textFilter() {
    form.name = form.name
      .replace(/\d/g, '')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .slice(0, 40)
  }

  function open() {
    isModalOpen.value = true
  }

  function close() {
    isModalOpen.value = false

    window.setTimeout(() => {
      isSubmitted.value = false
      phoneError.value = false
    }, 300)
  }

  function triggerYandexGoal(goal: string) {
    const ym = (window as unknown as { $ym?: (g: string) => void }).$ym
    if (typeof ym === 'function') {
      ym(goal)
    }
  }

  // Отправка через безопасный API-эндпоинт (токены хранятся на сервере)
  async function submit() {
    const phoneCleaned = form.phone.replace(/\D/g, '')

    // Валидация телефона
    if (phoneCleaned.length < 11) {
      phoneError.value = true
      notifications.error('Введите корректный номер телефона')
      return
    }
    phoneError.value = false

    if (isSubmitting.value) return
    isSubmitting.value = true

    const companyLine = form.company.trim() ? `Агентство/компания: ${form.company.trim()}\n` : ''
    const commentLine = form.comment.trim() ? `Комментарий: ${form.comment.trim()}\n` : ''
    const sourceLine = 'Источник: Партнёрская программа (/partner)\n'

    const formData = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      company: form.company.trim(),
      comment: `${sourceLine}${companyLine}${commentLine}`.trim(),
      // Дублируем message для обратной совместимости с backend
      message: `Заявка: ${form.name || 'Аноним'}, тел: ${form.phone.trim()}\n${sourceLine}${companyLine}${commentLine}`.trim(),
    }

    try {
      const response = await fetch('/api/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.statusMessage || result.description || 'Ошибка отправки формы')
      }

      // Успех: показываем "спасибо" и уведомление
      isSubmitted.value = true
      notifications.success('Заявка успешно отправлена! Мы свяжемся с вами.')
      triggerYandexGoal('FORM_SUBMITTED')

      // Очистка полей
      form.name = ''
      form.phone = '+7 '
      form.company = ''
      form.comment = ''
    } catch (error) {
      console.error('Ошибка при отправке формы:', error)
      notifications.error('Не удалось отправить заявку. Попробуйте позже.')
      triggerYandexGoal('FORM_ERROR')
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    // состояние
    isModalOpen,
    isSubmitted,
    isSubmitting,
    phoneError,
    form,
    // методы
    open,
    close,
    submit,
    textFilter,
  }
}