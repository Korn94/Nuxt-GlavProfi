// app/utils/finish-groups.ts
import type { FinishGroupConfig, CalculatorSection } from '~/types/calculator'

/**
 * 🗂 Конфигурация готовых покрытий.
 * Связывает UI калькулятора с реальными ID работ из БД.
 * 
 * Логика работы:
 * - baseItemIds: обязательный набор работ, который добавляется при выборе покрытия.
 * - options: переключатели прямо в карточке (размер плитки, тип затирки, слои краски).
 *   При смене опции ID базовой работы динамически подменяется на указанный в value.itemId.
 * - extraItemIds: пул работ, доступных через кнопку "➕ Доп. работы" внутри карточки.
 */
export const FINISH_GROUPS: Record<string, FinishGroupConfig> = {
  
  // =========================================================================
  // 🧱 СТЕНЫ
  // =========================================================================
  paint_walls: {
    id: 'paint_walls',
    name: 'Покраска стен',
    section: 'walls' as CalculatorSection,
    icon: '🎨',
    // Грунт глубокого проникновения + Покраска (2 слоя)
    baseItemIds: [869, 873], 
    extraItemIds: [875, 876, 877], // Двухцветная разметка, Чистые помещения, Обработка углов скотчем
    options: {
      layers: {
        label: 'Количество слоев',
        type: 'select',
        values: [
          { value: '1', label: '1 слой', itemId: 1378 },
          { value: '2', label: '2 слоя (стандарт)', itemId: 873 }
        ]
      }
    }
  },

  wallpaper: {
    id: 'wallpaper',
    name: 'Поклейка обоев',
    section: 'walls' as CalculatorSection,
    icon: '📜',
    baseItemIds: [869, 879], // Грунт + Флизелиновые обои
    extraItemIds: [880, 881, 882], // Виниловые, С подбором рисунка, Удаление старых
    options: {
      type: {
        label: 'Тип обоев',
        type: 'select',
        values: [
          { value: 'paper', label: 'Бумажные', itemId: 878 },
          { value: 'vinyl', label: 'Флизелиновые (стандарт)', itemId: 879 },
          { value: 'washable', label: 'Виниловые моющиеся', itemId: 880 },
          { value: 'pattern', label: 'С подбором рисунка', itemId: 881 }
        ]
      }
    }
  },

  tile_walls: {
    id: 'tile_walls',
    name: 'Плитка на стены',
    section: 'walls' as CalculatorSection,
    icon: '🧱',
    // Адгезионная грунтовка + Плитка 60×60 + Цементная затирка
    baseItemIds: [831, 843, 864], 
    extraItemIds: [860, 861, 862, 1413, 1412], // Резка по шаблону, Сквозная/фигурная, Сверление, Сапожок
    options: {
      size: {
        label: 'Размер плитки',
        type: 'select',
        values: [
          { value: '30x30', label: '30×30 см', itemId: 840 },
          { value: '40x40', label: '40×40 см', itemId: 842 },
          { value: '60x60', label: '60×60 см (стандарт)', itemId: 843 },
          { value: '60x120', label: '60×120 см', itemId: 844 }
        ]
      },
      grout: {
        label: 'Тип затирки',
        type: 'select',
        values: [
          { value: 'cement', label: 'Цементная (стандарт)', itemId: 864 },
          { value: 'epoxy', label: 'Эпоксидная', itemId: 865 },
          { value: 'antiseptic', label: 'Антисептическая', itemId: 866 }
        ]
      }
    }
  },

  plaster_walls: {
    id: 'plaster_walls',
    name: 'Выравнивание стен (штукатурка)',
    section: 'walls' as CalculatorSection,
    icon: '🏗️',
    baseItemIds: [763, 1143], // Грунтовка + Штукатурка 10–30 мм
    extraItemIds: [1144, 1145, 1146, 1150, 1151], // Армирование, >50мм, Труднодоступные, Откосы
    options: {
      thickness: {
        label: 'Толщина слоя',
        type: 'select',
        values: [
          { value: '10-30', label: '10–30 мм (стандарт)', itemId: 1143 },
          { value: '30-50', label: '30–50 мм (с армированием)', itemId: 1144 },
          { value: '50+', label: '>50 мм (перепад)', itemId: 1145 }
        ]
      }
    }
  },

  putty_walls: {
    id: 'putty_walls',
    name: 'Шпаклёвка стен',
    section: 'walls' as CalculatorSection,
    icon: '📐',
    baseItemIds: [806, 811, 826], // Старт + Финиш + Шлифовка
    extraItemIds: [808, 813, 827, 830], // До 5мм, Под покраску, Мех. шлифовка, Удаление пыли
    options: {
      quality: {
        label: 'Качество поверхности',
        type: 'select',
        values: [
          { value: 'standard', label: 'Под обои (стандарт)', itemId: 811 },
          { value: 'premium', label: 'Под покраску («лампочка»)', itemId: 813 }
        ]
      }
    }
  },

  // =========================================================================
  // 📏 ПОЛ
  // =========================================================================
  screed_floor: {
    id: 'screed_floor',
    name: 'Стяжка пола',
    section: 'floor' as CalculatorSection,
    icon: '📐',
    baseItemIds: [718], // Стандартная стяжка по маякам (30–50 мм)
    extraItemIds: [722, 723, 730, 731, 750], // Плавающая, Влажные пом., Фибра, Сетка, Гидроизоляция
    options: {
      type: {
        label: 'Тип стяжки',
        type: 'select',
        values: [
          { value: 'standard', label: 'Стандартная 30–50 мм', itemId: 718 },
          { value: 'thin', label: 'Тонкая 20–30 мм', itemId: 719 },
          { value: 'thick', label: 'Толстая 50–100 мм', itemId: 720 },
          { value: 'floating', label: 'Плавающая (на изоляции)', itemId: 722 }
        ]
      }
    }
  },

  laminate: {
    id: 'laminate',
    name: 'Укладка ламината',
    section: 'floor' as CalculatorSection,
    icon: '🪵',
    baseItemIds: [893], // Укладка ламината (класс 32/33)
    extraItemIds: [895, 896, 897, 913, 914], // Диагональ, Проходимость, Подрезка, ПВХ/МДФ плинтус
    options: {
      layout: {
        label: 'Способ укладки',
        type: 'select',
        values: [
          { value: 'straight', label: 'Прямая (стандарт)', itemId: 893 },
          { value: 'diagonal', label: 'Диагональная', itemId: 895 }
        ]
      }
    }
  },

  linoleum: {
    id: 'linoleum',
    name: 'Укладка линолеума',
    section: 'floor' as CalculatorSection,
    icon: '📜',
    baseItemIds: [898], // Бытовой и полукоммерческий
    extraItemIds: [900, 902, 913], // Термосварка, Подрезка, ПВХ плинтус
  },

  spc: {
    id: 'spc',
    name: 'SPC / Виниловый ламинат',
    section: 'floor' as CalculatorSection,
    icon: '🛡️',
    baseItemIds: [903], // Водостойкий винил
    extraItemIds: [906, 907, 913], // Диагональ/рисунок, Подрезка, ПВХ плинтус
  },

  tile_floor: {
    id: 'tile_floor',
    name: 'Плитка на пол',
    section: 'floor' as CalculatorSection,
    icon: '🧱',
    baseItemIds: [831, 837, 864], // Грунт + Плитка пол 60×60 + Затирка
    extraItemIds: [839, 841, 860, 1412, 850], // Тёплый пол, Уклон, Резка, Сапожок, Ступени
    options: {
      size: {
        label: 'Размер плитки',
        type: 'select',
        values: [
          { value: '30x30', label: '30×30 см', itemId: 835 },
          { value: '40x40', label: '40×40 см', itemId: 836 },
          { value: '60x60', label: '60×60 см (стандарт)', itemId: 837 },
          { value: '60x120', label: '60×120 см', itemId: 838 }
        ]
      }
    }
  },

  // =========================================================================
  // 🔲 ПОТОЛОК
  // =========================================================================
  paint_ceiling: {
    id: 'paint_ceiling',
    name: 'Покраска потолка',
    section: 'ceiling' as CalculatorSection,
    icon: '🎨',
    baseItemIds: [1380, 874], // Грунт потолка + Покраска (2 слоя)
    extraItemIds: [931, 932], // Обработка стыков, Удаление старой побелки
    options: {
      layers: {
        label: 'Количество слоев',
        type: 'select',
        values: [
          { value: '1', label: '1 слой', itemId: 1379 },
          { value: '2', label: '2 слоя (стандарт)', itemId: 874 }
        ]
      }
    }
  },

  gkl_ceiling: {
    id: 'gkl_ceiling',
    name: 'Потолок из ГКЛ',
    section: 'ceiling' as CalculatorSection,
    icon: '📐',
    baseItemIds: [918], // Одноуровневый ГКЛ
    extraItemIds: [919, 920, 921, 922], // Двухуровневый, Геометрия, Короб, Усиление
    options: {
      type: {
        label: 'Тип конструкции',
        type: 'select',
        values: [
          { value: '1-level', label: 'Одноуровневый (стандарт)', itemId: 918 },
          { value: '2-level', label: 'Двухуровневый с нишами', itemId: 919 },
          { value: 'complex', label: 'Сложная геометрия', itemId: 920 }
        ]
      }
    }
  },

  armstrong: {
    id: 'armstrong',
    name: 'Потолок Армстронг',
    section: 'ceiling' as CalculatorSection,
    icon: '🔲',
    baseItemIds: [925], // Минплита 600×600
    extraItemIds: [923, 924, 926, 1414], // Алюм. реечный, ПВХ реечный, Светильники, Замена плит
    options: {
      type: {
        label: 'Тип потолка',
        type: 'select',
        values: [
          { value: 'armstrong', label: 'Армстронг (минплита)', itemId: 925 },
          { value: 'aluminum', label: 'Реечный алюминиевый', itemId: 923 },
          { value: 'pvc', label: 'ПВХ реечный', itemId: 924 }
        ]
      }
    }
  }
} as const
