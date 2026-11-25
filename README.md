# 🏗️ ГлавПрофи — CRM для строительной компании

<div align="center">

![Nuxt](https://img.shields.io/badge/Nuxt-4.0.3-00DC82?style=for-the-badge&logo=nuxt.js)
![Vue](https://img.shields.io/badge/Vue-3-4FC08D?style=for-the-badge&logo=vue.js)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0.3-3178C6?style=for-the-badge&logo=typescript)
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
- Node.js 24.21.0 (LTS Krypton) — одна и та же версия локально и на проде (см. `.nvmrc`)
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

## 🤖 LLM-документация (`/llms.txt`)

Для ИИ-агентов на сайте есть два текстовых документа:

| URL | Что внутри |
|---|---|
| `/llms.txt` | Краткая документация + сводка цен по разделам прайса |
| `/llms-full.txt` | Полная документация + **все 800+ позиций прайса из БД** |

**Как это работает**
- Шаблоны лежат в `server/assets/llms/*.txt` (доступны как `assets:server`).
- Блок между `<!-- PRICE:START -->` и `<!-- PRICE:END -->` собирается из таблиц
  `price_pages → price_categories → price_sub_categories → price_items`
  (`server/utils/llmsPrice.ts`) — вручную цены больше не поддерживаются.
- Роуты: `server/routes/llms.txt.ts`, `server/routes/llms-full.txt.ts`
  (имена **без** `.get.ts`, чтобы работал и `HEAD`).
- Ответ кэшируется в памяти Nitro на 5 минут (+SWR до часа), поэтому правки
  цен в кабинете попадают в файлы без пересборки и деплоя.
- В начале блока агенты видят три даты: «Актуально на» (момент генерации),
  «Сайт собран» (`runtimeConfig.buildTime`, запекается при `nuxt build`),
  «Цены в базе изменены» (`MAX(updated_at)` по таблицам прайса).
- Заголовки ответа: `X-LLMS-Generated`, `X-LLMS-Build`, `X-LLMS-Price-Updated`.

**Обнаружение агентами (llmstxt.org v2)**
- HTML: `<link rel="describedby" href="https://glavprofi.ru/llms.txt">` на всех страницах —
  `app/app.vue` (`useHead` → `link`; `linkTags` приходят из `app/config/meta.config.ts`).
- HTTP: `Link: </llms.txt>; rel="describedby"` в заголовках HTML-ответов —
  `server/plugins/llms-link-header.ts` (хук Nitro `render:response`; ответы API не затрагивает).
- Внутри документов: `/llms.txt` отдаёт `Link: </llms-full.txt>; rel="alternate"`,
  `/llms-full.txt` — `Link: </llms.txt>; rel="describedby"` (`server/utils/llmsHttp.ts`).
- В `robots.txt` и `sitemap.xml` llms-файлы не добавляем: стандартных директив для них
  нет, а sitemap — карта только HTML-страниц.

**Проверка**
```bash
curl -s https://glavprofi.ru/llms.txt | head -40
curl -sI https://glavprofi.ru/llms.txt            # X-LLMS-*
curl -sI https://glavprofi.ru/            | grep -i '^link'  # Link на HTML-страницах
curl -sI https://glavprofi.ru/llms.txt    | grep -i '^link'  # Link на самом документе
curl -sI https://glavprofi.ru/llms.txt    | grep -i 'x-llms-generated'  # есть → отдаёт Nitro, а не статика
curl -s "https://glavprofi.ru/llms.txt?refresh=1" # обойти кэш
```

⚠️ Нельзя хранить копии `llms*.txt` в `public/`: public-ассеты отдаёт middleware
Nitro **раньше** серверных роутов, и файл перекрыл бы генерацию из БД.

**Как это отдаётся на проде (nginx)**
- В конфиге nginx (копия — `.devops/nginx/last nginx.txt`; сама папка `.devops` в
  `.gitignore`, поэтому знания ниже живут только здесь) статический regex
  `location ~* \.(png|jpg|…)$` **не содержит `txt`**. Поэтому `/llms.txt` и
  `/llms-full.txt` попадают в `location /` → `try_files $uri $uri/ @fallback` →
  `@fallback` (proxy на `127.0.0.1:3000`) → роут Nitro.
- ⛔ **Не добавляйте `txt` и `md` в regex статики.** Тогда nginx начнёт искать файл
  на диске, и копия `llms.txt`, оставшаяся в `.output/public`, молча перекроет
  генерацию из БД (симптом: в ответе нет `X-LLMS-*`).
- `rsync --delete-after` (`.devops/deploy/deploy.sh`) удаляет старые `public/llms*.txt`
  из `.output/public`, поэтому штатный деплой коллизий не создаёт. При `--skip-build`
  или ручной заливке — проверьте, что файлов там нет.
- `gzip_types` в nginx уже содержит `text/plain` (+ `gzip_proxied any`) → документы
  отдаются сжатыми. `text/markdown` для `.md`-версий в `gzip_types` уже есть.
- `@fallback` не задаёт собственных `add_header`, поэтому security-заголовки с уровня
  `server` наследуются. Если добавляете локейшены с `add_header` — продублируйте
  `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security`.
  На статике (`/_nuxt/`, картинки/шрифты/видео) дублируются два заголовка
  (`X-Content-Type-Options` + `Referrer-Policy`), в `/uploads/` — все четыре
  (там пользовательские файлы любого типа, включая html/svg).
- Признак, что отдаёт именно роут, а не статика: в ответе есть `X-LLMS-Generated`.

### 📄 Markdown-версии страниц (`<url>.md`)

Вторая половина llmstxt.org v2: у значимых страниц есть «чистая» markdown-версия
по тому же URL с расширением `.md`, ссылки на неё — `rel="alternate" type="text/markdown"`
(ровно так сделано в справке Яндекса: `<link rel="alternate" type="text/markdown">`
+ HTTP `Link` с `alternate` и `describedby`).

| Что | Где |
|---|---|
| Движок матчера (статические пути, регэкспы, нормализация) | `shared/constants/llmsMarkdown.ts` |
| Клиентский матчер (списки slug'ов из данных) | `app/utils/llmsMarkdown.ts` |
| Серверный матчер, рендереры и кэш | `server/utils/llmsMarkdown.ts` |
| Отдача `.md` (middleware) | `server/middleware/llms-markdown.ts` |
| HTML `<link rel="alternate">` | `app/app.vue` (только если `.md` существует) |
| HTTP `Link` на HTML-страницах | `server/plugins/llms-link-header.ts` |

**Какие страницы есть сейчас**

- `/index.md` — главная (в спеке URL без имени файла = `index.md`);
- `/remont-pomescheniy.md` и 11 × `/remont-pomescheniy/<slug>.md`;
- 5 × `/vidy-rabot/<slug>.md`;
- 3 × `/prices/<slug>.md` — полный прайс раздела из БД (динамически);
- `/projects.md` и `/projects/<slug>.md` — кейсы из БД (динамически);
- `/contacts.md`, `/requisites-ip.md`;
- `/about.md` — о компании (компактное представление: цифры, направления, виды
  работ, часть кейсов со ссылкой на полное портфолио);
- `/privacy-policy.md`, `/terms-of-service.md` — юридические документы целиком.

У `/partner` markdown-версии намеренно нет: запрос `/partner.md` → 404.

**Откуда берётся контент** (никакой конвертации HTML → markdown):

- цены — `loadPriceData()` (та же выборка, что для `/llms.txt`);
- страницы типов помещений — `pageTypes/data/premisesCatalog.ts` +
  `pageTypes/data/premisesSeo.ts` (title/description/FAQ; раньше лежали прямо в
  `<script setup>` 11 страниц — сервер до них добраться не мог);
- страницы видов работ — `workTypes/data/pages/*.ts` (те же данные, что рендерит UI);
- проекты — таблицы `portfolio_cases` / `portfolio_case_works`;
- реквизиты — `shared/constants/company.ts`;
- юридические страницы — `app/components/pages/public/legal/data/*.ts`
  (те же данные рендерит HTML-страница, поэтому тексты не расходятся);
- `/about.md` — из `COMPANY`, `PREMISES_CATALOG`, `WORK_TYPES`, кейсов из БД и
  общих блоков рендерера: это компактное представление страницы, а не дословный
  перенос текстов визуальных блоков `about/blocks/*`.

**Заголовки `.md`-ответа**

```
Content-Type: text/markdown; charset=utf-8
Cache-Control: public, max-age=300, stale-while-revalidate=3600
X-Robots-Tag: noindex, follow
X-LLMS-Generated: <ISO>
Link: <https://glavprofi.ru/page>; rel="canonical", <https://glavprofi.ru/llms.txt>; rel="describedby"
```

`rel="canonical"` + `noindex` обязательны: канонической остаётся HTML-страница,
иначе `.md` начнёт индексироваться как дубль.

**404 для `.md`** формирует само middleware, а не error-handler Nitro: тот в проде
всегда отдаёт `application/json`, а в dev выбирает JSON или HTML `youch` по
заголовку `Accept`. Ответ одинаков в dev и в проде и не зависит от `Accept`:

```
404
Content-Type: text/plain; charset=utf-8
Cache-Control: no-store
X-Robots-Tag: noindex
Link: <https://glavprofi.ru/llms.txt>; rel="describedby"

Markdown-версия недоступна: /partner.md
Индекс документации: https://glavprofi.ru/llms.txt
```

**Как добавить новую `.md`-страницу**: реестра путей больше нет — списки slug'ов
собираются из данных (`app/utils/llmsMarkdown.ts` на клиенте, тот же расчёт в
`server/utils/llmsMarkdown.ts` на сервере), поэтому обычно достаточно самих данных:

- **новый тип помещения** — карточка в `pageTypes/data/premisesCatalog.ts`
  с `isReady: true` + SEO-запись в `pageTypes/data/premisesSeo.ts` →
  `/remont-pomescheniy/<slug>.md` и `rel="alternate"` появляются сами;
- **новый вид работ** — slug в `WORK_TYPES` (`pageTypes/data/workTypesByCategory.ts`)
  + data-модуль в карту `WORK_TYPE_PAGES` (`server/utils/llmsMarkdown.ts`).
  Если модуль забыть, Nitro при старте напишет `console.warn`;
- **новый прайс или кейс** — только запись в БД: `/prices/<slug>.md` и
  `/projects/<slug>.md` матчатся регэкспом;
- **принципиально новая страница** (свой рендер в `renderBody()`) — путь в
  `LLMS_MD_STATIC_PATHS` (`shared/constants/llmsMarkdown.ts`), иначе `<link>`
  и HTTP `Link` её не увидят.

`console.warn` при старте Nitro предупредит и об обратном рассинхроне: готовый тип
помещения без записи в `premisesSeo.ts`.

⚠️ nginx: `md` **нельзя** добавлять в regex статики (см. раздел про nginx выше) —
иначе файлы пойдут мимо Nitro. `text/markdown` в `gzip_types` уже покрыт
(`text/plain` + `text/markdown`).

### 🏢 JSON-LD организации (адресный сниппет Яндекса)

Узел организации теперь **один на весь сайт** — `app/utils/organizationSchema.ts`
(`buildOrganizationSchema`), данные — `shared/constants/company.ts`.

Было (и почему это ломалось):
- `app.vue` отдавал `Organization` без `streetAddress` и без прямого `telephone`
  (телефон лежал в `contactPoint`, который Яндекс не читает);
- `usePageSeo` / `useWorkTypeSeo` переопределяли тот же `@id=#organization` как
  `LocalBusiness` с другим набором полей — два разных описания одной сущности;
- `app/pages/remont-pomescheniy/index.vue` содержал **чужой телефон**
  `+7-900-123-45-67` и несуществующий `logo.png`.

Стало: `GeneralContractor` с `name`, `legalName`, `url`, `logo`, `image`,
`telephone` (прямое свойство), `email`, `address.streetAddress`,
`openingHours`, `sameAs`, `areaServed`, `priceRange`, `foundingDate`.
Страницы-потребители ссылаются на него через `{ '@id': organizationId(url) }`.

Что именно читает Яндекс (справка «Адреса и организации»):
- обязательные поля для адресного сниппета — `name`, `url`, `address` (со
  `streetAddress`), `telephone`;
- `openingHours` строкой `"Mo-Fr 09:00-18:00"`; **`openingHoursSpecification`
  Яндекс не поддерживает**;
- `GeneralContractor` входит в список поддерживаемых типов;
- `sameAs` в этой доке не описан — он полезен Google/LLM, но не для сниппета;
- сниппет показывается, только если сайт в топ-30, и учитывает карточку
  Яндекс Бизнеса (телефон/адрес меняются через неё).

### 🖼️ Картинки для OG и логотип

`scripts/generate-brand-images.mjs` собирает из существующих фото:
`public/og-<slug>.jpg` (11 страниц типов помещений, 1200×630),
`public/og-default.jpg` и `public/logo.png` (512×512).
Нужны, потому что `og-ofisy.jpg`, `logo.png` и др. были прописаны в коде,
но физически отсутствовали (404).

Запуск (повторный безопасен): `node scripts/generate-brand-images.mjs`.

### 🧾 Реквизиты в llms-документах

Реквизиты ИП (ИНН, ОГРНИП, юр. адрес, банк, БИК, счета, ОКВЭД) — единый блок из
`shared/constants/company.ts` (`requisitesBlock()`). В шаблонах
`server/assets/llms/*.txt` вместо него стоят маркеры:

- `<!-- REQUISITES -->` — блок реквизитов;
- `<!-- PREMISES -->` — цены «от … ₽/м²» по типам помещений
  (из `premisesCatalog.priceFrom`; раньше были вписаны руками и устарели:
  «Офисы от 8 500 ₽/м²» при актуальных 11 000 ₽/м²).

Подстановка — `composeDocument()` в `server/utils/llmsContent.ts`.
При переходе ИП → ООО менять нужно два места: этот файл и страницу
`/requisites-ip` (`app/components/pages/public/requisites/ip.vue`).

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

### Трекинг активности (activity / AFK)

Трекинг **глобальный** — работает на всех маршрутах (публичные страницы + кабинет):

- композабл `app/composables/useActivityTracker.ts` монтируется один раз в корневом
  компоненте `app/app.vue` (`if (process.client) useActivityTracker()`), а не в layout кабинета;
- сессию поднимает сокет на любой странице при наличии cookie `auth_token`
  (`app/plugins/socket.client.ts` → `server/socket/handlers/user.ts`);
- трекер стартует по «живой сессии» (`socketStore.isConnected` + cookie `session_id`
  из `session:initialized`) и останавливается при её потере, отправляя `activity`
  со `status: 'offline'`;
- AFK определяется после 5 минут бездействия; `last_activity` в `user_sessions`
  обновляется heartbeat'ом не чаще 1 раза в минуту (троттлинг).

### События клиента → сервер
- `join` / `leave` — подписка/отписка от комнаты `board:{id}` (с ACL-проверкой на `join`)
- `activity` — активность пользователя (`online`/`afk`/`offline`, троттлинг 1 минута)
- `activity:resume` / `activity:afk` — возврат из AFK / уход в AFK (сразу broadcast)
- `tab:register` — регистрация вкладки (мультивкладочность)
- `tab:navigate` — навигация вкладки (обновляет `current_path` сессии)
- `permissions:check` — запрос переиндексации кэша прав (опциональный «ручной» API)

### События сервера → клиент
- `session:initialized` — сессия создана/восстановлена (приходит `sessionId`)
- `online-users:update` — список онлайна (комната `online:viewers`, право `users:view`)
- `user:status` — смена статуса другого пользователя (online/afk/offline)
- `permissions:changed` — права пользователя изменились (комната `user:{id}`)
- `force:disconnect` — принудительное отключение (блокировка/отзыв прав)
- `board:task:*`, `board:subtask:*`, `board:column:*` — изменения на доске (комната `board:{id}`)

### Переменные окружения сокета
| Переменная | Назначение | По умолчанию |
|---|---|---|
| `SOCKET_PORT` | Порт отдельного сокет-сервера в dev (`server/socket/dev.ts`) | `3001` |
| `NUXT_PUBLIC_SOCKET_PORT` | Порт для клиента (`runtimeConfig.public.socketPort`) | = `SOCKET_PORT` |
| `NUXT_PUBLIC_SOCKET_URL` | Явный адрес сокет-сервера, если он не на том же origin | пусто |

В dev Socket.IO поднимается отдельным HTTP-процессом на `SOCKET_PORT`; в production —
привязывается к серверу Nitro (`server/socket/prod.ts`), nginx проксирует `/socket.io/`.
Адрес на клиенте вычисляется в `services/socket.service.ts → resolveSocketUrl()`.

### Пример подключения
```typescript
// Сервис-синглтон: services/socket.service.ts (плагин app/plugins/socket.client.ts
// подключает его автоматически при наличии auth_token в cookie)
import { socketService } from 'services/socket.service'

socketService.init()          // создаёт соединение (адрес — из runtimeConfig)
socketService.connect(token)  // переподключает с актуальным JWT

socketService.on('connect', () => console.log('Connected to WebSocket'))
socketService.on('session:initialized', ({ sessionId }) => {
  console.log('sessionId:', sessionId)
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
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_WEBHOOK_URL=https://yourdomain.com/api/telegram
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
| `npm run build` | Сборка для продакшена (+ `postbuild` — подготовка Linux-бинарников sharp) |
| `npm run postbuild` | Готовит Linux-сборку sharp в `.output` (вызывается автоматически после `build`) |
| `npm run start` | Запуск продакшен-сборки |
| `npm run generate` | Генерация статического сайта |
| `npm run preview` | Предпросмотр сборки |
| `npm run postinstall` | Подготовка Nuxt после установки |
| `npm run migrate` | Применение миграций БД |
| `npm run migrate:generate` | Генерация миграций |
| `npm run migrate:push` | Push схемы в БД |
| `npm run migrate:all` | Генерация + применение миграций |
| `npm run typecheck` | Проверка типов (`nuxt typecheck` → `vue-tsc --noEmit`) |
| `npm run images:optimize` | Webp-варианты 480/960/1600 px для `public/main/**` и `public/brands/**` + манифест `shared/constants/responsiveImages.json` |
| `npm run perf:baseline` | Замер первой загрузки по боевому сайту → `logs/perf-baseline.md` |
| `npm run perf:local` | То же по локальному серверу `:3000` → `logs/perf-local.md` |

---

## ⚡ Производительность первой загрузки

Замеры (`npm run perf:baseline` по https://glavprofi.ru, размеры сетевые, gzip):

| Страница | JS | CSS | Медиа из разметки |
|---|---|---|---|
| `/` | 194 → **181 КБ** | 8.0 → **4.4 КБ** | 11.0 → **1.7 МБ** |
| `/about` | 195 → **181 КБ** | 8.0 → **5.9 КБ** | 5.0 → **1.2 МБ** |
| `/remont-pomescheniy` | 191 → **177 КБ** | 8.0 → **4.4 КБ** | 1.34 → **0.66 МБ** |

> ⚠️ Методика: в JS/CSS попадают только теги из SSR-HTML (`<script>`, `modulepreload`,
> `stylesheet`) — см. `scripts/perf-baseline.mjs`. Чанки, которые плагины запрашивают уже
> в рантайме через `import()`, в эти цифры **не входят** (до изоляции так грузился
> `@telegram-apps/sdk` — 22.5 КБ gzip на каждой странице).
> HTML главной: 58.4 → 29.9 КБ gzip (`logs/perf-after.md`, сборка до изоляции Telegram —
> на размер HTML это не влияет); в `logs/perf-after-home.md` — 28.1 КБ от другой сборки
> (иные хэши чанков).

### Что сделано

**Медиа (главный вес)**
- `scripts/optimize-public-images.mjs` готовит webp-варианты 480/960/1600 px (162 картинки →
  банк `public/main`/`public/brands` уменьшился в 3–8 раз на кадр, например `banki.webp`
  421 КБ → `banki-960.webp` 50 КБ).
- `app/utils/responsiveImage.ts` → `responsiveImageAttrs(src, { sizes })` собирает
  `srcset`/`width`/`height` для обычного `<img>` (без компонента-обёртки, чтобы не ломать
  scoped-CSS). Подключено на главной, `/remont-pomescheniy`, страницах типов помещений.
- Hero-видео (6.4 МБ) больше не грузится на первой загрузке: `autoplay` убран из разметки,
  источник подставляется после `window.load` + `requestIdleCallback` и только если
  пользователь не просил экономить трафик (`saveData` / 2G-3G / `prefers-reduced-motion`).
  Постер (23 КБ) предзагружается как LCP-кандидат.

**Кэш и TTFB**
- `/**`: `no-store` → `public, max-age=0, must-revalidate` (возвращает bfcache, разрешает
  прокси-кэш). `/cabinet/**`, `/login`, `/api/**` — явный `private, no-store`.
- Опциональный микро-кэш SSR: `NUXT_HTML_SWR=60 npm run build` (по умолчанию выключен,
  см. комментарий в `nuxt.config.ts` и `proxy_cache` в `.devops/nginx/last nginx.txt`).
- nginx: `ssl_session_cache shared:glavprofi_ssl:10m` + `ssl_session_tickets on` (без них каждый
  новый коннект — полный TLS-handshake), security-заголовки продублированы в локациях
  со своим `add_header` (`/_nuxt/`, regex статики, `/uploads/`).
  ⚠️ Имя зоны **не `SSL`**: FastPanel сам объявляет `ssl_session_cache shared:SSL:1m;` в
  `/etc/nginx/conf.d/ssl.conf` (файл генерируется панелью, подключается в `http{}` раньше
  vhost'а), а nginx не даёт переопределить зону тем же именем с другим размером —
  `[emerg] the size 10485760 of shared memory zone "SSL" conflicts with already declared
  size 1048576`. Своё имя зоны = независимый кэш на 10 МиБ, конфиг не ломается даже если
  панель перегенерирует `ssl.conf`.
- `/api/portfolio?slugs=ddx,fora-bank` — главная тянет 2 кейса вместо 12 (5 SQL → 3,
  HTML уменьшился с 58.4 до 29.9 КБ gzip).
- Статику отдаёт сам nginx (`/_nuxt/*`, картинки, `offers/*.html`), **но только если каталоги
  `.output/**` на сервере доступны воркерам (`www-data`) на чтение**. Windows-rsync приносил
  их как `drwxrwx--- glavprofi_ru_usr40` → в логе `[crit] stat() ".../.output/public/" failed
  (13: Permission denied)` и весь JS/CSS шёл через Node.js. Теперь `deploy.sh` передаёт
  `--chmod=D755,F644`; разово для текущего деплоя: `chmod o+x .output && chmod -R o+rX
  .output/public`. ⚠️ В `location /` из-за этого стоит `try_files $uri $uri/index.html
  $uri.html @fallback` (без `$uri/`: `index.html` в `.output/public` нет, и проверка каталога
  увела бы `/` в index-модуль → 403/500).

**JS/CSS**
- `@telegram-apps/sdk` (~22.5 КБ gzip) вынесен из entry в отдельный async-чанк. Плагин теперь
  сначала делает дешёвую проверку Telegram **без импорта SDK** (`window.Telegram.WebApp.initData`
  или параметры `tgWebApp*` в hash) и грузит SDK только внутри Mini App, не блокируя
  монтирование (`void initTelegramSdk()`). Раньше `await import()` выполнялся на каждой
  странице и задерживал гидратацию на один RTT у всех посетителей.
  ⚠️ Нюанс: Nuxt добавляет `<link rel="prefetch">` для всех async-чанков entry
  (`vue-bundle-renderer` → `getPrefetchLinks`, опцией это не отключается), поэтому браузер
  может подтянуть чанк SDK в простое. Но он больше не блокирует mount и не исполняется
  вне Telegram. Полностью убрать этот чанк можно только отказавшись от SDK — в плагине уже
  есть разбор `tgWebAppData` из hash как фолбэк.
  🔗 Синхронизация со страницей входа: по завершении инициализации плагин ставит
  `window.__telegramReady` и шлёт событие `telegram:ready`; `app/pages/telegram/index.vue`
  ждёт его (`waitForTelegramReady`, максимум 1.5 с) вместо прежней фиксированной паузы 100 мс —
  иначе на медленной сети страница успевала уйти в фолбэк разбора хеша.
- `buffer` (7.9 КБ gzip) переведён на динамический импорт, но из первой загрузки он **не ушёл**:
  его статически импортирует чанк `socket.io-client`, и он качается вместе с сокетом.
  Экономия — только в размере entry-чанка.
- `socket.io-client` (16.5 КБ gzip) + `buffer` (7.9 КБ gzip) остаются в первой загрузке
  **осознанно**: сокет поднимает сессию и трекинг активности (`activity` / AFK / `tab:navigate`)
  для авторизованных на всех маршрутах, включая публичные (см. «WebSocket и Real-time»).
  Анонимных посетителей это не касается — они трекаются по HTTP (`POST /api/visitors/ping`),
  сокет им недоступен (сервер отклоняет подключение без JWT).
- `yandexMetrica` → `.client.js` (не собирается в серверный бандл).
- `kp.scss` (33 КБ) вынесен из глобальных стилей в `KpPage.vue` — entry-CSS 31.2 → 12.3 КБ (raw).
- `@nuxt/icon`: `clientBundle.scan` — клиентский бандл иконок стал реальным (167 КБ вместо
  пустого `init() {}`), запросов к `api.iconify.design` в рантайме нет. `serverBundle.collections`
  ограничил набор 8 коллекциями из 11 установленных, но иконки всё ещё занимают **29 МБ**
  из 66.5 МБ серверного бандла (без source maps); крупнейший чанк — 12.1 МБ.
- Шапка рендерится на сервере (было: пустой `<div>` до гидрации → CLS и отсутствие
  навигации в HTML); preload добавлен для `Rubik-Bold`, которым набран H1.
- Проверено по сборке: на публичных страницах грузятся только `entry.css` (3.0 КБ gzip) и
  стили компонентов (ContactForm 0.8 + forms 0.7); `cabinet.*.css` в HTML публичных страниц
  не попадает.

**Размер `.output`**
- `server` — 74.2 МБ (66.5 МБ без source maps), из них иконки 29 МБ.
- `public` — 139.6 МБ, в том числе webp-банк 39.7 МБ (457 файлов).

### Что осталось за кадром
- Hero-видео на мобильных: `MOBILE_VIDEO_SRC` не задан, поэтому телефон после `load` + idle
  скачивает тот же `main-pk.mp4` (6.4 МБ). Ограничитель — только `saveData` / 2G-3G.
  Нужен отдельный файл ~1 МБ (720p) — тогда прописать путь в `MOBILE_VIDEO_SRC`
  (`app/components/pages/public/homePage/index.vue`).
- Шрифты не сабсеттились: 5 весов Rubik × ~63 КБ + 3 × ~38 КБ Comfortaa. Сабсеттинг
  с `unicode-range` даст ~25 КБ на вес (нужен fonttools). Comfortaa удалять нельзя:
  она используется в шапке, подвале и `kp.scss`.
- `socket.io-client` + `buffer` (24.4 КБ gzip) можно убрать из публичного бандла динамическим
  импортом по cookie `auth_token`, но это требует разрыва статической цепочки
  `app.vue → useActivityTracker → stores/socket → socket.service`. Пока оставлено осознанно.
- Иконки на сервере: 8 коллекций, 29 МБ. Ревизия реально используемых коллекций может снять
  до ~10 МБ (память процесса и вес деплоя), на клиента не влияет.

---

## 🚢 Деплой и зависимости

Сборка выполняется на Windows-машине, на сервер уезжает только `.output/`
(`./deploy.sh` → `npm run build` + rsync + `pm2 reload`). Сервер сборку не тянет.

- **`.output` самодостаточен.** После `nuxt build` автоматически выполняется
  `postbuild` → `scripts/prepare-sharp-linux.mjs`: докачивает Linux-сборку sharp
  (`npm --os=linux --cpu=x64 --libc=glibc`), кладёт `@img/sharp-linux-x64` и
  `@img/sharp-libvips-linux-x64` в `.output/server/node_modules/@img` и удаляет
  win32-бинарники (`sharp-win32-x64` — это 19 МБ DLL, на Linux они не нужны).
  Без этого sharp на сервере не загружается и загрузка фото в портфолио падает.
  Путь к нативному биндингу не хардкодится: с sharp 0.35 файл называется
  `lib/sharp-linux-x64-<version>.node` и грузится через `index.cjs`, поэтому скрипт
  берёт точку входа из `exports["./sharp.node"]` в `package.json` пакета
  (с 0.34 там был `lib/sharp-linux-x64.node`). Скрипт падает на сборке, если
  биндинг или `libvips` — не настоящий ELF.
- **`node_modules` внутри `.output/server` синхронизируется rsync'ом** — не
  исключайте его из деплоя. Иначе на сервере остаётся устаревшая копия зависимостей
  (в разное время это давало расхождение `vue`/`zod`/`mysql2`/`socket.io` и
  отсутствующие `busboy`, `minisearch`, `uqr`).
- **Smoke-check после перезапуска.** `deploy.sh` прогоняет
  `scripts/post-deploy-check.mjs` (sharp с реальной генерацией JPEG, busboy,
  drizzle-orm/mysql2, minisearch) и завершается с ошибкой, если зависимости
  не загружаются — вместо тихих 500 в проде.
- Корневой `node_modules` на сервере рантайму больше не нужен (нужен только для
  ручного запуска `drizzle-kit`/скриптов).
- **Версия Node — 24.21.0 локально и на проде** (`.nvmrc`). На сервере её держит nvm,
  а PM2 запоминает путь к интерпретатору в своём дампе. После `nvm install`/`nvm use`
  процесс нужно пересоздать, иначе он останется на старом Node:
  ```bash
  pm2 delete glavprofi-app && pm2 start ecosystem.config.cjs --update-env && pm2 save
  ```
- **TypeScript зафиксирован на `~6.0.3` — не обновляйте до 7.x.** 6.0.3 — последняя
  версия на JS-кодбазе и верхняя граница, которую поддерживает Volar
  (`@volar/language-service` объявляет peer `typescript: <7`), поэтому `vue-tsc` и
  `npm run typecheck` работают. TypeScript 7 (нативный порт на Go) не отдаёт
  классический JS-API — `exports["."]` в пакете указывает на `lib/version.cjs`,
  API доступен только как `typescript/unstable/*`, — на нём vue-tsc/Volar падают.
  Сама сборка, `tsx` и `drizzle-kit` от версии TypeScript не зависят
  (транспиляция идёт через esbuild/oxc), так что апгрейд влияет только на
  проверку типов в IDE и `npm run typecheck`.

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
- **Телефон**: +7 (910) 909-69-47

---

<div align="center">

**ГлавПрофи** — Профессиональный подход к строительству 🏗️

*Сделано с ❤️ на Nuxt + Vue 3 + TypeScript*

</div>