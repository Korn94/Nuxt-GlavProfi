// app/utils/finish-groups.ts
import type { FinishGroupConfig, CalculatorSection } from '~/types/calculator'

/**
 * 🗂 Конфигурация готовых покрытий.
 * Связывает UI калькулятора с реальными ID работ из БД (page_id = 7, "Отделка").
 * 
 * ⚠️ ВАЖНО: Логика единиц измерения
 * - baseItemIds: ТОЛЬКО работы в м² для этой поверхности.
 *   Калькулятор автоматически умножает на площадь.
 * - options.values[].itemId: ТОЛЬКО работы в м², подменяющие baseItemIds.
 * - extraItemIds: работы в п.м., шт., м²+ (доплаты).
 *   Пользователь сам указывает количество в UI через поле ввода.
 *
 * 🚫 Никогда не смешивать стеновые, половые и потолочные работы!
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
    // Двухцветная разметка (м.п.), Чистые помещения (м²), Обработка углов скотчем (м.п.),
    // Антисептическая грунтовка (м²), Антикоррозийная грунтовка по металлу (м²)
    extraItemIds: [875, 876, 877, 870, 871],
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

  decorative_plaster: {
    id: 'decorative_plaster',
    name: 'Декоративная штукатурка',
    section: 'walls' as CalculatorSection,
    icon: '🎭',
    
    // ✅ Грунтовка + Короед (базовый эффект)
    baseItemIds: [869, 883],
    
    // Доп. работы: защитный лак (м²), колеровка (м²+),
    // спец. грунтовки для сложных оснований
    extraItemIds: [
      886,  // Нанесение защитного лака (м²)
      887,  // Колеровка в цвет по RAL/NCS (м²+)
      764,  // Грунтовка для пористых оснований (газобетон) — если стены из блоков
      870   // Антисептическая грунтовка (для влажных помещений)
    ],
    
    options: {
      effect: {
        label: 'Тип эффекта',
        type: 'select',
        values: [
          { value: 'bark', label: 'Короед (стандарт)', itemId: 883 },
          { value: 'venetian', label: 'Венецианская (мрамор)', itemId: 884 },
          { value: 'silk', label: 'Шёлк / бархат', itemId: 885 }
        ]
      }
    }
  },

  liquid_wallpaper: {
    id: 'liquid_wallpaper',
    name: 'Жидкие обои',
    section: 'walls' as CalculatorSection,
    icon: '💧',
    baseItemIds: [888], // Жидкие обои (однотон)
    // Микродекор (м²), Колеровка (м²+), Восстановление (м²), Акрил (м²)
    extraItemIds: [889, 890, 891, 892]
  },

  plaster_walls: {
    id: 'plaster_walls',
    name: 'Штукатурка стен (выравнивание)',
    section: 'walls' as CalculatorSection,
    icon: '🏗️',
    
    // Грунтовка + Гипсовая штукатурка 10-30мм (по умолчанию)
    baseItemIds: [763, 1143],
    
    // Доп. работы (м.п., специальные случаи)
    extraItemIds: [
      1141, // Монтаж маяков (м.п.)
      1142, // Отделка углов армирующим уголком (м.п.)
      1140, // Армирующая сетка (м²) - если нужна дополнительная
      1146, // Труднодоступные зоны (м²)
      1150, // Штукатурка оконного откоса (м.п.)
      1151, // Штукатурка дверного откоса (м.п.)
      1152, // Откос с утеплением (м.п.)
      1153, // Технологический проём (м.п.)
      1154, // Огнезащитная REI 30 (м²+)
      1155  // Огнестойкая REI 60 (м²+)
    ],
    
    options: {
      type: {
        label: 'Тип и толщина штукатурки',
        type: 'select',
        values: [
          // === Гипсовые ===
          { value: 'gypsum-std', label: 'Гипсовая 10–30 мм (стандарт)', itemId: 1143 },
          { value: 'gypsum-arm', label: 'Гипсовая 30–50 мм (с армированием)', itemId: 1144 },
          { value: 'gypsum-thick', label: 'Гипсовая >50 мм (сильный перепад)', itemId: 1145 },
          
          // === Цементные (для влажных помещений) ===
          { value: 'cement-std', label: 'Цементная 10–30 мм (влажные помещения)', itemId: 1147 },
          { value: 'cement-water', label: 'Влагостойкая 10–30 мм (бассейны, мойки)', itemId: 1148 },
          { value: 'cement-antiseptic', label: 'С антисептиком 10–30 мм', itemId: 1149 }
        ]
      }
    }
  },

  putty_walls: {
    id: 'putty_walls',
    name: 'Шпаклёвка стен',
    section: 'walls' as CalculatorSection,
    icon: '📐',
    
    // Грунтовка → Старт → Повторная грунтовка → Финиш → Шлифовка
    baseItemIds: [802, 806, 805, 811, 826],
    
    // Доп. работы: цементная старт, перепады, механизированная шлифовка,
    // удаление пыли, углы (м.п.), серпянка (м.п.), откосы (м.п.)
    extraItemIds: [
      807,  // Стартовая цементная (влажные помещения)
      808,  // Выравнивание перепадов до 5 мм
      827,  // Механизированная шлифовка (с пылеотсосом)
      828,  // Локальная шлифовка участков с наплывами
      830,  // Удаление пыли (промышленный пылесос)
      821,  // Армирование стыков ГКЛ серпянкой (м.п.)
      822,  // Внутренние углы с уголком (м.п.)
      823,  // Внешние углы с защитным профилем (м.п.)
      825,  // Усиление примыканий стен/потолков (м.п.)
      816,  // Шпаклёвка оконного откоса (м.п.)
      817,  // Шпаклёвка дверного откоса (м.п.)
    ],
    
    options: {
      quality: {
        label: 'Качество поверхности',
        type: 'select',
        values: [
          { value: 'standard', label: 'Под обои (стандарт)', itemId: 811 },
          { value: 'premium', label: 'Под покраску («лампочка»)', itemId: 813 }
        ]
      },
      sanding: {
        label: 'Тип шлифовки',
        type: 'select',
        values: [
          { value: 'standard', label: 'Обычная (стандарт)', itemId: 826 },
          { value: 'polish', label: 'Шлифовка стен под покраску', itemId: 829 }
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
    // Резка по шаблону (шт), Сквозная/фигурная (м.п.), Сверление (шт),
    // Сапожок (м.п.), Сложные поверхности (м²+), Ректификат (м²+),
    // Безрамный формат (м²+), Тяжёлый керамогранит (м²+), Колеровка затирки (м²+)
    extraItemIds: [860, 861, 862, 1413, 1412, 845, 847, 848, 849, 868],
    options: {
      size: {
        label: 'Размер плитки',
        type: 'select',
        values: [
          { value: '30x30', label: '30×30 см', itemId: 840 },
          { value: '40x40', label: '40×40 см', itemId: 842 },
          { value: '60x60', label: '60×60 см (стандарт)', itemId: 843 },
          { value: '60x120', label: '60×120 см', itemId: 844 },
          { value: '120x120', label: '120×120 см и больше', itemId: 846 }
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

  mosaic: {
    id: 'mosaic',
    name: 'Мозаика',
    section: 'walls' as CalculatorSection,
    icon: '🔶',
    baseItemIds: [855], // Стеклянная мозаика на сетке
    extraItemIds: [858], // Доплата за арочные поверхности (м²+)
    options: {
      type: {
        label: 'Материал мозаики',
        type: 'select',
        values: [
          { value: 'glass', label: 'Стеклянная (стандарт)', itemId: 855 },
          { value: 'ceramic', label: 'Керамическая', itemId: 856 },
          { value: 'modular', label: 'Модульная', itemId: 857 }
        ]
      }
    }
  },

  wall_panels: {
    id: 'wall_panels',
    name: 'Стеновые панели',
    section: 'walls' as CalculatorSection,
    icon: '🪟',
    baseItemIds: [943], // ПВХ-панели
    // Доплата за влажность (м²+), Подрезка (шт)
    extraItemIds: [946, 947],
    options: {
      material: {
        label: 'Материал панелей',
        type: 'select',
        values: [
          { value: 'pvc', label: 'ПВХ (стандарт)', itemId: 943 },
          { value: 'mdf', label: 'МДФ под покраску/шпон', itemId: 944 },
          { value: 'laminate', label: 'Ламинированные', itemId: 945 },
          { value: 'acrylic', label: 'Акриловые', itemId: 951 },
          { value: 'hpl', label: 'HPL (высокая прочность)', itemId: 952 },
          { value: 'veneer', label: 'Шпонированные', itemId: 953 },
          { value: 'glass', label: 'Триплекс / закалённое стекло', itemId: 954 },
          { value: 'ldsp', label: 'ЛДСП', itemId: 955 },
          { value: 'composite', label: 'Композитные алюминиевые', itemId: 956 }
        ]
      }
    }
  },

  mirrors: {
    id: 'mirrors',
    name: 'Зеркала и зеркальные панели',
    section: 'walls' as CalculatorSection,
    icon: '🪞',
    baseItemIds: [948], // Обычное зеркало 4-6 мм
    extraItemIds: [1169], // Тяжёлое зеркало до 50 кг (шт)
    options: {
      type: {
        label: 'Тип зеркала',
        type: 'select',
        values: [
          { value: 'standard', label: 'Обычное 4–6 мм', itemId: 948 },
          { value: 'backlight', label: 'С подсветкой', itemId: 949 },
          { value: 'anti-vandal', label: 'Антивандальное (триплекс)', itemId: 950 }
        ]
      }
    }
  },

  gkl_walls: {
    id: 'gkl_walls',
    name: 'Обшивка стен ГКЛ',
    section: 'walls' as CalculatorSection,
    icon: '📋',
    baseItemIds: [938], // На металлическом каркасе
    // Усиление (м²+), Углы (м.п.), Серпянка (м.п.)
    extraItemIds: [940, 941, 942],
    options: {
      method: {
        label: 'Способ монтажа',
        type: 'select',
        values: [
          { value: 'frame', label: 'На каркасе (стандарт)', itemId: 938 },
          { value: 'glue', label: 'На клеевом составе', itemId: 939 }
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
    // Плавающая (м²+), Влажные пом. (м²), Фибра (м²), Сетка (м²),
    // Прутк. арматура (м²), Анкеры (м.п.), Температурный шов (м.п.),
    // Гидроизоляция (м²), Промышленная (м²), Антипылевое (м²), Металл. топпинг (м²)
    extraItemIds: [722, 723, 730, 731, 733, 734, 735, 750, 752, 755, 756],
    options: {
      type: {
        label: 'Тип стяжки',
        type: 'select',
        values: [
          { value: 'standard', label: 'Стандартная 30–50 мм', itemId: 718 },
          { value: 'thin', label: 'Тонкая 20–30 мм', itemId: 719 },
          { value: 'thick', label: 'Толстая 50–100 мм', itemId: 720 },
          { value: 'slope', label: 'С уклоном (душевая)', itemId: 721 },
          { value: 'floating', label: 'Плавающая (на изоляции)', itemId: 722 }
        ]
      }
    }
  },

  self_leveling_floor: {
    id: 'self_leveling_floor',
    name: 'Наливные полы',
    section: 'floor' as CalculatorSection,
    icon: '🌊',
    baseItemIds: [725], // Тонкослойное выравнивание 3–5 мм
    // Быстротвердеющий (м²+), Антисептический (м²+)
    extraItemIds: [728, 729],
    options: {
      type: {
        label: 'Тип состава',
        type: 'select',
        values: [
          { value: 'leveling', label: 'Выравнивающий 5–20 мм', itemId: 724 },
          { value: 'thin', label: 'Тонкослойный 3–5 мм (стандарт)', itemId: 725 },
          { value: 'strong', label: 'Повышенной прочности 10–30 мм', itemId: 726 },
          { value: 'decorative', label: 'Финишный декоративный', itemId: 727 }
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
    // Диагональ (м²+), Проходимость (м²+), Подрезка (шт), ПВХ/МДФ плинтус (м.п.)
    extraItemIds: [895, 896, 897, 913, 914],
    options: {
      material: {
        label: 'Тип покрытия',
        type: 'select',
        values: [
          { value: 'laminate', label: 'Ламинат (стандарт)', itemId: 893 },
          { value: 'parquet', label: 'Паркетная доска 14 мм', itemId: 894 }
        ]
      },
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
    // Термосварка (м²+), Подрезка (шт), ПВХ плинтус (м.п.)
    extraItemIds: [900, 902, 913],
    options: {
      type: {
        label: 'Тип линолеума',
        type: 'select',
        values: [
          { value: 'household', label: 'Бытовой (стандарт)', itemId: 898 },
          { value: 'commercial', label: 'Коммерческий', itemId: 899 }
        ]
      }
    }
  },

  spc: {
    id: 'spc',
    name: 'SPC / Виниловый ламинат',
    section: 'floor' as CalculatorSection,
    icon: '🛡️',
    baseItemIds: [903], // Водостойкий винил (замковый)
    // Диагональ (м²+), Подрезка (шт), ПВХ плинтус (м.п.)
    extraItemIds: [906, 907, 913],
    options: {
      type: {
        label: 'Тип винила',
        type: 'select',
        values: [
          { value: 'vinyl', label: 'Винил замковый (стандарт)', itemId: 903 },
          { value: 'spc', label: 'SPC-плитка (жёсткий)', itemId: 904 },
          { value: 'lvt', label: 'LVT клеевой', itemId: 905 }
        ]
      }
    }
  },

  tile_floor: {
    id: 'tile_floor',
    name: 'Плитка на пол',
    section: 'floor' as CalculatorSection,
    icon: '🧱',
    baseItemIds: [831, 837, 864], // Грунт + Плитка пол 60×60 + Затирка
    // Тёплый пол (м²+), Уклон (м²+), Резка (шт), Сапожок (м.п.), Ступени (м.п.),
    // Сложные поверхности (м²+), Ректификат (м²+), Безрамный (м²+), Тяжёлый (м²+)
    extraItemIds: [839, 841, 860, 1412, 850, 845, 847, 848, 849],
    options: {
      size: {
        label: 'Размер плитки',
        type: 'select',
        values: [
          { value: '30x30', label: '30×30 см', itemId: 835 },
          { value: '40x40', label: '40×40 см', itemId: 836 },
          { value: '60x60', label: '60×60 см (стандарт)', itemId: 837 },
          { value: '60x120', label: '60×120 см', itemId: 838 },
          { value: '120x120', label: '120×120 см и больше', itemId: 846 }
        ]
      }
    }
  },

  carpet: {
    id: 'carpet',
    name: 'Ковровые покрытия',
    section: 'floor' as CalculatorSection,
    icon: '🧶',
    baseItemIds: [908], // Рулонный ковролин
    // Бесшовная стыковка (м.п.+), Диагональ (м²+), Подрезка (шт)
    extraItemIds: [910, 911, 912],
    options: {
      type: {
        label: 'Тип покрытия',
        type: 'select',
        values: [
          { value: 'roll', label: 'Рулонный ковролин', itemId: 908 },
          { value: 'tiles', label: 'Модульные ковровые плитки', itemId: 909 }
        ]
      }
    }
  },

  wood_floor: {
    id: 'wood_floor',
    name: 'Деревянные полы',
    section: 'floor' as CalculatorSection,
    icon: '🌲',
    baseItemIds: [1325], // Шпунтованная доска 40 мм
    // Лаги (м.п.), Гидроизоляция лаг (м.п.), Выравнивание (м.п.), Антисептик (м.п.),
    // Шлифовка (м²), Масло (м²), Восстановление (м²)
    extraItemIds: [1320, 1321, 1322, 1323, 1328, 1329, 1330],
    options: {
      type: {
        label: 'Тип покрытия',
        type: 'select',
        values: [
          { value: 'shpunt', label: 'Шпунтованная доска 40 мм', itemId: 1325 },
          { value: 'massiv', label: 'Массивная доска 20 мм', itemId: 1326 },
          { value: 'parquet', label: 'Паркетная доска 15 мм', itemId: 1327 }
        ]
      }
    }
  },

  special_floor: {
    id: 'special_floor',
    name: 'Специальные покрытия',
    section: 'floor' as CalculatorSection,
    icon: '🎯',
    baseItemIds: [1334], // Пробковое покрытие
    extraItemIds: [1339], // Обработка стыков ОСБ (м²)
    options: {
      type: {
        label: 'Тип покрытия',
        type: 'select',
        values: [
          { value: 'cork', label: 'Пробковое покрытие', itemId: 1334 },
          { value: 'rubber', label: 'Резиновое', itemId: 1335 },
          { value: 'sport', label: 'Спортивное', itemId: 1336 },
          { value: 'osb12', label: 'ОСБ-3 12 мм (черновой)', itemId: 1337 },
          { value: 'osb18', label: 'ОСБ-3 18 мм (усиленный)', itemId: 1338 }
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
    // Обработка стыков (м²), Удаление старой побелки (м²)
    extraItemIds: [931, 932],
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

  plaster_ceiling: {
    id: 'plaster_ceiling',
    name: 'Штукатурка потолка',
    section: 'ceiling' as CalculatorSection,
    icon: '🏗️',
    baseItemIds: [1156], // Штукатурка потолка (слой 10–30 мм)
    extraItemIds: [1160, 1161], // Заделка швов между плитами (м.п.), Устранение трещин (м.п.)
    options: {
      type: {
        label: 'Тип штукатурки',
        type: 'select',
        values: [
          { value: 'standard', label: 'Стандартная 10–30 мм', itemId: 1156 },
          { value: 'armored', label: 'С армированием', itemId: 1157 },
          { value: 'diff', label: 'При перепаде до 50 мм', itemId: 1158 },
          { value: 'concrete', label: 'Бетонное перекрытие', itemId: 1159 }
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
    // Двухуровневый (м²), Сложная геометрия (м²), Короб (м.п.),
    // Усиление (м²+), Покраска ГКЛ (м²), Обработка стыков (м²)
    extraItemIds: [919, 920, 921, 922, 928, 931],
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
    name: 'Подвесные потолки',
    section: 'ceiling' as CalculatorSection,
    icon: '🔲',
    baseItemIds: [925], // Армстронг (минплита 600×600)
    // Светильники (шт), Замена плит (шт), Съемный участок (м²+)
    extraItemIds: [926, 1414, 927],
    options: {
      type: {
        label: 'Тип потолка',
        type: 'select',
        values: [
          { value: 'armstrong', label: 'Армстронг (минплита)', itemId: 925 },
          { value: 'aluminum', label: 'Реечный алюминиевый', itemId: 923 },
          { value: 'pvc', label: 'ПВХ реечный (влагостойкий)', itemId: 924 }
        ]
      }
    }
  },

  // =========================================================================
  // 🚧 ПЕРЕГОРОДКИ
  // =========================================================================
  gkl_partitions: {
    id: 'gkl_partitions',
    name: 'Перегородки из ГКЛ',
    section: 'partitions' as CalculatorSection,
    icon: '🚧',
    baseItemIds: [683], // В 1 слой с двух сторон
    // Высокая перегородка (м²+), Арочный проём (шт), Трапеция (шт),
    // Минвата (м²), Звукопоглощающий мат (м²), Двойная изоляция (м²),
    // Плавающий каркас (м²+), Заполнение полости (м.п.),
    // Повышенная нагрузка (м²+), С нишей (м²+), С проходом коммуникаций (м²+),
    // Раздвижная система (п.м+), Скрытый проем книжка (п.м+), REI 60 (м²+)
    extraItemIds: [
      686, 1135, 1138, 700, 701, 702, 703, 704,
      706, 707, 708, 709, 710, 712
    ],
    options: {
      type: {
        label: 'Тип перегородки',
        type: 'select',
        values: [
          { value: '1-layer', label: 'В 1 слой (стандарт)', itemId: 683 },
          { value: '2-layer', label: 'В 2 слоя', itemId: 684 },
          { value: 'fireproof', label: 'Огнестойкая ГКЛО (REI 30)', itemId: 685 }
        ]
      }
    }
  },

  block_partitions: {
    id: 'block_partitions',
    name: 'Перегородки из блоков и кирпича',
    section: 'partitions' as CalculatorSection,
    icon: '🧱',
    baseItemIds: [689], // Газоблок 100-150 мм
    // Доп. армирование (м²+), Высокая перегородка (м²+),
    // Тонкая перегородка (м²), Фигурный проём (шт), Закруглённый угол (м.п.)
    extraItemIds: [691, 692, 693, 1136, 1139],
    options: {
      material: {
        label: 'Материал',
        type: 'select',
        values: [
          { value: 'half-brick', label: 'Кирпич в 1/2', itemId: 687 },
          { value: 'brick', label: 'Кирпич в 1', itemId: 688 },
          { value: 'gas', label: 'Газоблок (стандарт)', itemId: 689 },
          { value: 'foam', label: 'Пеноблок', itemId: 690 },
          { value: 'pgp', label: 'Гипсовые блоки ПГП', itemId: 694 }
        ]
      }
    }
  },

  gkl_boxes: {
    id: 'gkl_boxes',
    name: 'Короба из ГКЛ',
    section: 'partitions' as CalculatorSection,
    icon: '📦',
    baseItemIds: [1422], // Прямой короб 2 грани (до 1м в 1 слой)
    extraItemIds: [], // все варианты — через опции
    options: {
      type: {
        label: 'Тип короба',
        type: 'select',
        values: [
          { value: '2-sides', label: '2 грани (стандарт)', itemId: 1422 },
          { value: '3-sides', label: '3 грани', itemId: 1423 },
          { value: '4-sides', label: '4 грани', itemId: 1424 }
        ]
      }
    }
  }
} as const
