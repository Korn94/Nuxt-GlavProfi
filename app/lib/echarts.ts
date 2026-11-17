// app/lib/echarts.ts
// ⚠️ Только клиент. Модульная сборка echarts вместо `import * as echarts from 'echarts'`:
// полный бандл — 1.13 МБ min / 371 КБ gzip, а нужные проекту графики (bar/line/pie)
// с tooltip/legend/grid и обоими рендерерами — 0.59 МБ min / 199 КБ gzip.
//
// Используется в:
//  - app/components/pages/Cabinet/Online/Analytics.vue (bar/line/pie, canvas)
//  - app/components/pages/Cabinet/Operation/BalanceSummary.vue (bar, canvas)
//  - app/components/pages/public/offers/kp/ui/EChart.vue (pie, svg — динамический импорт)
//
// ⚠️ Файл лежит вне app/utils и app/composables намеренно: те каталоги сканируются
// Nuxt'ом для авто-импортов, а регистрация модулей echarts должна происходить
// только там, где библиотека реально нужна.
//
// Если появится новый тип графика/компонент — добавь его в соответствующий
// импорт и в список use() ниже, иначе график отрисуется пустым.
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer, SVGRenderer } from 'echarts/renderers'

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  CanvasRenderer,
  SVGRenderer,
])

export { echarts }
