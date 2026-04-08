# 🏗️ ГлавПрофи — CRM для строительной компании

<div align="center">

![Nuxt](https://img.shields.io/badge/Nuxt-4.0.3-00DC82?style=for-the-badge&logo=nuxt.js)
![Vue](https://img.shields.io/badge/Vue-3-4FC08D?style=for-the-badge&logo=vue.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?style=for-the-badge&logo=typescript)
![Pinia](https://img.shields.io/badge/Pinia-3.0.4-ffe975?style=for-the-badge&logo=pinia)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8.3-010101?style=for-the-badge&logo=socket.io)

**Версия 3.1** | [glavprofi.ru](https://glavprofi.ru)

</div>

---

## 📋 О проекте

**ГлавПрофи** — современная CRM-система для управления строительной компанией с публичным сайтом и административной панелью. Система обеспечивает полный цикл управления: от привлечения клиентов до завершения объектов и аналитики.

### ✨ Ключевые возможности

| Модуль | Описание |
|--------|----------|
| 🏢 **Объекты** | Управление строительными объектами, статусы, сроки, финансы |
| 📋 **Доски задач (Kanban)** | Гибкое управление задачами с подзадачами, тегами, комментариями |
| 👥 **Контрагенты** | База заказчиков, подрядчиков, исполнителей |
| 💰 **Финансы** | Учёт доходов, расходов, балансов, зарплатных отчислений |
| 📦 **Материалы** | Контроль закупок и использования материалов |
| 📊 **Аналитика** | Отчёты, дашборды, метрики эффективности |
| 🔔 **Уведомления** | Real-time уведомления через WebSocket + Telegram-интеграция |
| 👤 **Онлайн-статусы** | Отслеживание активности пользователей в системе |

---

## 🛠️ Технологический стек

### Frontend
- **Nuxt 4** — Vue-фреймворк с SSR
- **Vue 3** — реактивный фреймворк
- **TypeScript** — типобезопасность
- **Pinia** — управление состоянием
- **Socket.IO Client** — WebSocket-соединение
- **Vue3-DnD** — drag-and-drop для Kanban
- **ECharts** — визуализация данных
- **Sass** — стилизация
- **Nuxt Icon** — иконки (Material Symbols, FontAwesome, Solar)

### Backend
- **Nuxt Server** — API-сервер
- **Drizzle ORM** — работа с БД
- **MySQL** — реляционная база данных
- **Socket.IO** — WebSocket-сервер
- **JWT** — аутентификация
- **bcryptjs** — хеширование паролей
- **node-cron** — планировщик задач
- **LRU Cache** — кэширование

### DevOps & Tools
- **Drizzle Kit** — миграции БД
- **Vite** — сборка
- **Vue TSC** — проверка типов

---

## 📁 Структура проекта

```
/workspace
├── app/                      # Frontend (Nuxt)
│   ├── assets/              # Стили, шрифты, изображения
│   ├── components/          # Vue-компоненты
│   ├── composables/         # Композаблы
│   ├── layouts/             # Макеты страниц
│   ├── middleware/          # Middleware навигации
│   ├── pages/               # Страницы приложения
│   │   ├── cabinet/         # Админ-панель (CRM)
│   │   ├── prices/          # Страница цен
│   │   ├── projects/        # Портфолио
│   │   └── ...              # Публичные страницы
│   ├── plugins/             # Плагины Nuxt
│   └── types/               # TypeScript-типы
│
├── server/                   # Backend
│   ├── api/                 # REST API endpoints
│   │   ├── auth/            # Аутентификация
│   │   ├── boards/          # Доски и задачи
│   │   ├── objects/         # Объекты
│   │   ├── contractors/     # Контрагенты
│   │   ├── expenses/        # Расходы
│   │   ├── materials/       # Материалы
│   │   ├── analytics/       # Аналитика
│   │   └── ...              # Другие модули
│   ├── db/                  # Работа с БД
│   │   ├── schema.ts        # Схема Drizzle (30+ таблиц)
│   │   ├── relations.ts     # Связи между таблицами
│   │   └── index.ts         # Подключение к БД
│   └── sockets/             # WebSocket обработчики
│
├── stores/                   # Pinia stores
│   ├── auth/                # Аутентификация
│   ├── boards/              # Доски задач
│   ├── settings/            # Настройки
│   ├── notifications.ts     # Уведомления
│   ├── online.ts            # Онлайн-статусы
│   ├── socket/              # WebSocket store
│   └── users.ts             # Пользователи
│
├── services/                 # Сервисы
│   ├── helpers/             # Вспомогательные функции
│   └── socket.service.ts    # WebSocket сервис
│
├── migrations/               # Миграции БД (30+ миграций)
├── public/                   # Статические файлы
├── drizzle.config.ts         # Конфигурация Drizzle
├── nuxt.config.ts           # Конфигурация Nuxt
├── package.json             # Зависимости
└── tsconfig.json            # TypeScript конфиг
```

---

## 🚀 Быстрый старт

### Требования
- Node.js >= 18.0.0
- MySQL >= 8.0
- npm или yarn

### Установка

1. **Клонирование репозитория**
```bash
git clone <repository-url>
cd glavprofi
```

2. **Установка зависимостей**
```bash
npm install
```

3. **Настройка переменных окружения**

Создайте файл `.env` в корне проекта:

```env
# Database
NUXT_DB_HOST=localhost
NUXT_DB_PORT=3306
NUXT_DB_USER=root
NUXT_DB_PASSWORD=your_password
NUXT_DB_NAME=glavprofi

# JWT Secret
NUXT_JWT_SECRET=your_super_secret_jwt_key

# Telegram Bot (опционально)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/telegram

# App
NUXT_PUBLIC_SITE_URL=https://glavprofi.ru
NODE_ENV=development
```

4. **Миграции базы данных**
```bash
# Создать миграции
npm run migrate:generate

# Применить миграции
npm run migrate

# Или всё сразу
npm run migrate:all
```

5. **Запуск в режиме разработки**
```bash
npm run dev
```

Приложение будет доступно по адресу: `http://localhost:3000`

6. **Сборка для продакшена**
```bash
npm run build
npm run start
```

---

## 📡 API Endpoints

### Аутентификация
| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/api/auth/login` | Вход пользователя |
| POST | `/api/auth/logout` | Выход из системы |
| GET | `/api/me` | Получить текущий профиль |

### Доски задач (Kanban)
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/boards` | Все доски |
| POST | `/api/boards` | Создать доску |
| GET | `/api/boards/:id` | Доска по ID |
| PUT | `/api/boards/:id` | Обновить доску |
| DELETE | `/api/boards/:id` | Удалить доску |
| GET | `/api/boards/:id/tasks` | Задачи доски |
| POST | `/api/boards/:id/tasks` | Создать задачу |

### Задачи
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/tasks/:id` | Получить задачу |
| PUT | `/api/tasks/:id` | Обновить задачу |
| DELETE | `/api/tasks/:id` | Удалить задачу |
| POST | `/api/tasks/:id/subtasks` | Создать подзадачу |
| GET | `/api/tasks/:id/comments` | Комментарии задачи |
| POST | `/api/tasks/:id/comments` | Добавить комментарий |
| POST | `/api/tasks/:id/tags` | Добавить теги |
| POST | `/api/tasks/:id/attachments` | Загрузить вложение |

### Объекты
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/objects` | Список объектов |
| POST | `/api/objects` | Создать объект |
| GET | `/api/objects/:id` | Объект по ID |
| PUT | `/api/objects/:id` | Обновить объект |
| DELETE | `/api/objects/:id` | Удалить объект |

### Контрагенты
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/contractors` | Список контрагентов |
| POST | `/api/contractors` | Создать контрагента |
| GET | `/api/contractors/:id` | Контрагент по ID |
| PUT | `/api/contractors/:id` | Обновить контрагента |
| DELETE | `/api/contractors/:id` | Удалить контрагента |

### Финансы
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/expenses` | Расходы |
| POST | `/api/expenses` | Создать расход |
| GET | `/api/balance` | Баланс объекта |
| GET | `/api/salary-deductions` | Зарплатные отчисления |

### Другое
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/online` | Онлайн-пользователи |
| POST | `/api/send-message` | Отправить сообщение |
| GET | `/api/analytics/*` | Аналитические данные |
| POST | `/api/telegram` | Telegram webhook |

---

## 🗄️ База данных

### Основные таблицы (30+)

#### Пользователи и доступ
- `users` — пользователи системы (admin, manager, foreman, master, worker)
- `user_sessions` — сессии для отслеживания онлайн-статуса
- `roles_permissions` — роли и права доступа

#### Объекты и проекты
- `objects` — строительные объекты
- `object_contracts` — договоры по объектам
- `object_phases` — этапы объектов

#### Задачи (Kanban)
- `boards` — доски задач
- `tasks` — задачи
- `subtasks` — подзадачи
- `tags` — теги
- `task_tags` — связь задач с тегами
- `comments` — комментарии
- `attachments` — вложения

#### Контрагенты
- `contractors` — контрагенты (мастера, рабочие, прорабы)
- `contractor_objects` — связь контрагентов с объектами

#### Финансы
- `expenses` — расходы
- `income` — доходы
- `salary_deductions` — зарплатные отчисления
- `balances` — балансы объектов

#### Материалы
- `materials` — материалы
- `material_usage` — использование материалов

#### Работы и цены
- `works` — виды работ
- `prices` — расценки
- `work_categories` — категории работ

#### Портфолио
- `portfolio` — выполненные проекты
- `portfolio_images` — изображения проектов

#### Уведомления
- `notifications` — уведомления пользователей

---

## 🔐 Ролевая модель

| Роль | Описание | Права |
|------|----------|-------|
| **Admin** | Полный доступ | Все права системы |
| **Manager** | Управление объектами | Объекты, задачи, финансы, контрагенты |
| **Foreman** | Прораб | Свои объекты, задачи, материалы |
| **Master** | Мастер | Свои задачи, отчетность |
| **Worker** | Рабочий | Просмотр задач, отметка выполнения |

---

## 🔔 WebSocket и Real-time

Система использует **Socket.IO** для real-time обновлений:

### События клиента → сервер
- `join-room` — подключение к комнате (объект, доска)
- `leave-room` — выход из комнаты
- `update-status` — обновление статуса задачи
- `send-notification` — отправка уведомления
- `typing-start` / `typing-end` — индикация набора текста

### События сервера → клиент
- `task-updated` — задача обновлена
- `task-created` — создана новая задача
- `notification` — новое уведомление
- `user-online` / `user-offline` — статус пользователя
- `comment-added` — добавлен комментарий

### Пример подключения
```typescript
// stores/socket/index.ts
import { io } from 'socket.io-client'

const socket = io(process.env.NUXT_PUBLIC_SOCKET_URL, {
  transports: ['websocket'],
  auth: { token: userToken }
})

socket.on('connect', () => {
  console.log('Connected to WebSocket')
})

socket.on('notification', (data) => {
  // Обработка уведомления
})
```

---

## 📱 Telegram-интеграция

### Возможности
- Уведомления о новых задачах
- Уведомления об изменениях статусов
- Команды через бота
- Webhook для входящих сообщений

### Настройка
```env
TELEGRAM_BOT_TOKEN=1234567890:AABBccDDeeFFggHHiiJJkkLLmmNNooP
TELEGRAM_WEBHOOK_URL=https://glavprofi.ru/api/telegram
```

---

## 🎨 Особенности архитектуры

### ✅ Принципы
- **DRY** (Don't Repeat Yourself) — переиспользование кода
- **TypeScript-first** — полная типизация
- **Modular** — модульная структура
- **Real-time** — WebSocket для мгновенных обновлений
- **SSR** — серверный рендеринг для SEO

### 📦 Компоненты
- Централизованная система компонентов
- Переиспользуемые composables
- Типобезопасные API-клиенты
- Адаптивный дизайн (mobile-first)

### 🔒 Безопасность
- JWT-аутентификация
- Хеширование паролей (bcrypt)
- Ролевой доступ (RBAC)
- Валидация данных
- Защита от CSRF/XSS

---

## 🧪 Скрипты npm

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск в режиме разработки |
| `npm run build` | Сборка для продакшена |
| `npm run start` | Запуск продакшен-сборки |
| `npm run generate` | Генерация статического сайта |
| `npm run preview` | Предпросмотр сборки |
| `npm run postinstall` | Подготовка Nuxt после установки |
| `npm run migrate` | Применение миграций БД |
| `npm run migrate:generate` | Генерация миграций |
| `npm run migrate:push` | Push схемы в БД |
| `npm run migrate:all` | Генерация + применение миграций |

---

## 📸 Скриншоты

### Публичный сайт
- Главная страница с услугами
- Каталог цен с фильтрацией
- Портфолио выполненных работ
- Форма обратной связи

### Админ-панель (CRM)
- Дашборд с аналитикой
- Kanban-доска задач
- Карточка объекта
- Финансовые отчёты
- Список контрагентов

---

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте ветку (`git checkout -b feature/AmazingFeature`)
3. Закоммитьте изменения (`git commit -m 'Add some AmazingFeature'`)
4. Push в ветку (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

---

## 📄 Лицензия

Проект является собственностью компании **ГлавПрофи**.  
Все права защищены.

---

## 📞 Контакты

- **Сайт**: [glavprofi.ru](https://glavprofi.ru)
- **Email**: info@glavprofi.ru
- **Телефон**: +7 (XXX) XXX-XX-XX

---

<div align="center">

**ГлавПрофи** — Профессиональный подход к строительству 🏗️

*Сделано с ❤️ на Nuxt + Vue 3 + TypeScript*

</div>