<template>
  <div>
    <h2>Онлайн калькулятор площади стен и пола</h2>

    <!-- Секция ввода данных для стен -->
    <div class="input-section">
      <h2>Добавить стену</h2>

      <!-- Переключатель режима добавления стены -->
      <div class="toggle-mode">
        <button 
          :class="{ active: wallAddMode === 'standard' }" 
          @click="wallAddMode = 'standard'">
          Стандартное добавление
        </button>
        <button 
          :class="{ active: wallAddMode === 'angle' }" 
          @click="wallAddMode = 'angle'">
          Добавление с углом
        </button>
      </div>

      <!-- Ввод угла для режима с углом -->
      <div v-if="wallAddMode === 'angle'">
        <label>Угол (градусы): 
          <input v-model.number="wallAngle" type="number" step="1" min="0" max="360" />
        </label>
      </div>
      
      <div v-if="wallAddMode === 'standard'">
        <label>Тип угла:
          <select v-model="cornerType">
            <option value="inner">Внутренний угол</option>
            <option value="outer">Внешний угол</option>
          </select>
        </label>
      </div>

      <div class="compact-inputs">
        <label>Длина (м): 
          <input v-model.number="wallLength" type="number" min="0" step="0.5" />
        </label>
        <label>Высота (м): 
          <input v-model.number="wallHeight" type="number" min="0" step="0.5" />
        </label>
      </div>


      <div class="button-group">
        <button @click="addWall">Добавить стену</button>
        <button @click="undoLastWall" :disabled="walls.length === 0">Шаг назад</button>
        <button @click="connectWalls" :disabled="walls.length < 2">Соединить</button>
      </div>
    </div>

    <!-- Секция ввода данных для проемов -->
    <div class="input-section" v-if="walls.length > 0">
      <h2>Добавить проем</h2>
      <label>Стена:
        <select v-model.number="selectedWallIndex">
          <option v-for="(wall, index) in walls" :key="'wall-' + index" :value="index">
            Стена {{ index + 1 }}
          </option>
        </select>
      </label>
      <div class="compact-inputs">
        <label>Ширина проема (м): 
          <input v-model.number="openingWidth" type="number" min="0" step="0.01" />
        </label>
        <label>Высота проема (м): 
          <input v-model.number="openingHeight" type="number" min="0" step="0.01" />
        </label>
      </div>
      <button @click="addOpening" :disabled="openingWidth <= 0 || openingHeight <= 0">
        Добавить проем
      </button>
    </div>

    <!-- Секция для визуализации -->
    <div class="visualization">
      <h2>Визуализация</h2>
      <svg :viewBox="dynamicViewBox" xmlns="http://www.w3.org/2000/svg" class="drawing">
        <polygon :points="polygonPoints" fill="#e0e0e0" stroke="#000" stroke-width="0.3" />
        <line v-for="(wall, index) in walls" :key="'wall-' + index" :x1="wall.start.x" :y1="wall.start.y" :x2="wall.end.x" :y2="wall.end.y" stroke="#ff0000" stroke-width="0.2" />
        <line v-for="opening in walls.flatMap((wall) => wall.openings)" :key="'opening-' + opening.id" :x1="opening.x1" :y1="opening.y1" :x2="opening.x2" :y2="opening.y2" stroke="#fff" stroke-width="0.3" />
        <text v-for="(wall, index) in walls" :key="'label-' + index" :x="(wall.start.x + wall.end.x) / 2" :y="(wall.start.y + wall.end.y) / 2" fill="#000" font-size="1" text-anchor="middle">
          {{ index + 1 }}
        </text>
      </svg>
    </div>

    <!-- Секция с итоговой информацией -->
    <div class="summary">
      <h2>Сводка</h2>
      <p>Общая площадь стен: {{ totalWallArea.toFixed(2) }} м²</p>
      <p>Площадь пола: {{ floorArea.toFixed(2) }} м²</p>
    </div>

    <!-- Подробная информация по стенам -->
    <div class="wall-details" v-if="walls.length > 0">
      <h2>Подробная информация по стенам</h2>
      <div v-for="(wall, index) in walls" :key="'wall-info-' + index" class="wall-info">
        <p><strong>Стена {{ index + 1 }}:</strong></p>
        <p>Площадь: {{ wall.area.toFixed(2) }} м²</p>
        <p>Количество проемов: {{ wall.openings.length }}</p>
        <p>Итоговая площадь с учетом проемов: {{ (wall.area - wall.openings.reduce((acc, opening) => acc + opening.width * opening.height, 0)).toFixed(2) }} м²</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from "vue";

export default {
  setup() {
    const wallLength = ref(0); // Длина стены
    const wallHeight = ref(0); // Высота стены
    const cornerType = ref("inner"); // Тип угла (внутренний или внешний)
    const walls = ref([]); // Массив стен
    const selectedWallIndex = ref(0); // Индекс выбранной стены для добавления проема
    const openingWidth = ref(0); // Ширина проема
    const openingHeight = ref(0); // Высота проема
    let openingId = 1; // Идентификатор для проемов

    const gapBetweenOpenings = 1; // Зазор между проемами

    // Добавление новой стены
    const wallAddMode = ref("standard"); // Режим добавления стены
    const wallAngle = ref(0); // Угол в градусах для режима "angle"

    const addWall = () => {
      if (wallLength.value <= 0 || wallHeight.value <= 0) {
        alert("Длина и высота стены должны быть больше 0");
        return;
      }

      const lastPoint = walls.value.length
        ? walls.value[walls.value.length - 1].end
        : { x: 0, y: 0 };

      let newX = lastPoint.x;
      let newY = lastPoint.y;

      if (wallAddMode.value === "standard") {
        const direction =
          walls.value.length % 2 === 0 ? "horizontal" : "vertical";

        if (direction === "horizontal") {
          newX +=
            cornerType.value === "inner" ? wallLength.value : -wallLength.value;
        } else {
          newY +=
            cornerType.value === "inner" ? -wallLength.value : wallLength.value;
        }
      } else if (wallAddMode.value === "angle") {
        const angleRad = (wallAngle.value * Math.PI) / 180; // Перевод в радианы
        newX += wallLength.value * Math.cos(angleRad);
        newY += wallLength.value * Math.sin(angleRad);
      }

      walls.value.push({
        start: lastPoint,
        end: { x: newX, y: newY },
        area: wallLength.value * wallHeight.value,
        openings: [],
      });
    };

    // Добавление проема в стену
    const addOpening = () => {
      const wall = walls.value[selectedWallIndex.value];
      if (!wall) {
        alert("Выберите стену для добавления проема");
        return;
      }

      const wallLength = Math.sqrt(
        Math.pow(wall.end.x - wall.start.x, 2) + Math.pow(wall.end.y - wall.start.y, 2)
      );

      if (openingWidth.value > wallLength) {
        alert("Проем шире, чем длина стены!");
        return;
      }

      let totalOpeningsWidth = openingWidth.value;
      wall.openings.forEach((opening) => {
        totalOpeningsWidth += opening.width + gapBetweenOpenings;
      });

      if (totalOpeningsWidth > wallLength) {
        alert("Суммарная ширина проемов превышает длину стены!");
        return;
      }

      // Перераспределяем проемы
      const freeSpace = wallLength - totalOpeningsWidth;
      let currentX = Math.min(wall.start.x, wall.end.x) + freeSpace / 2;
      let currentY = Math.min(wall.start.y, wall.end.y) + freeSpace / 2;

      wall.openings.forEach((opening) => {
        if (wall.start.x === wall.end.x) {
          opening.y1 = currentY;
          opening.y2 = currentY + opening.width;
          currentY = opening.y2 + gapBetweenOpenings;
        } else {
          opening.x1 = currentX;
          opening.x2 = currentX + opening.width;
          currentX = opening.x2 + gapBetweenOpenings;
        }
      });

      // Добавляем новый проем
      if (wall.start.x === wall.end.x) {
        wall.openings.push({
          id: openingId++,
          width: openingWidth.value,
          height: openingHeight.value,
          x1: wall.start.x,
          y1: currentY,
          x2: wall.end.x,
          y2: currentY + openingWidth.value,
        });
      } else {
        wall.openings.push({
          id: openingId++,
          width: openingWidth.value,
          height: openingHeight.value,
          x1: currentX,
          y1: wall.start.y,
          x2: currentX + openingWidth.value,
          y2: wall.end.y,
        });
      }
    };

    // Соединить начальную и конечную точку
    const connectWalls = () => {
      if (walls.value.length < 2) return;

      const firstWall = walls.value[0];
      const lastWall = walls.value[walls.value.length - 1];

      walls.value.push({
        start: lastWall.end,
        end: firstWall.start,
        area: wallLength.value * wallHeight.value,
        openings: [],
      });
    };

    // Отмена последней добавленной стены
    const undoLastWall = () => {
      if (walls.value.length > 0) {
        walls.value.pop();
      }
    };

    // Вычисление общей площади стен
    const totalWallArea = computed(() =>
      walls.value.reduce((sum, wall) => {
        const openingsArea = wall.openings.reduce(
          (openingSum, opening) => openingSum + opening.width * opening.height,
          0
        );
        return sum + (wall.area - openingsArea); // Вычитание площади проемов
      }, 0)
    );

    // Вычисление площади пола
    const floorArea = computed(() => {
      if (walls.value.length < 3) return 0;
      let area = 0;
      for (let i = 0; i < walls.value.length; i++) {
        const current = walls.value[i].start;
        const next = walls.value[(i + 1) % walls.value.length].start;
        area += current.x * next.y - next.x * current.y;
      }
      return Math.abs(area) / 2;
    });

    // Вычисление точек многоугольника для отображения
    const polygonPoints = computed(() =>
      walls.value.length > 0
        ? walls.value
            .map((wall) => `${wall.start.x},${wall.start.y}`)
            .join(" ") +
          ` ${walls.value[walls.value.length - 1].end.x},${
            walls.value[walls.value.length - 1].end.y
          } ${walls.value[0].start.x},${walls.value[0].start.y}`
        : ""
    );

    // Динамическое вычисление viewBox для SVG
    const dynamicViewBox = computed(() => {
      const allX = walls.value.flatMap((wall) => [
        wall.start.x,
        wall.end.x,
        ...wall.openings.map((o) => o.x1),
        ...wall.openings.map((o) => o.x2),
      ]);
      const allY = walls.value.flatMap((wall) => [
        wall.start.y,
        wall.end.y,
        ...wall.openings.map((o) => o.y1),
        ...wall.openings.map((o) => o.y2),
      ]);
      const minX = Math.min(...allX);
      const maxX = Math.max(...allX);
      const minY = Math.min(...allY);
      const maxY = Math.max(...allY);
      const padding = 10;
      return `${minX - padding} ${minY - padding} ${
        maxX - minX + 2 * padding
      } ${maxY - minY + 2 * padding}`;
    });

    return {
      wallLength,
      wallHeight,
      cornerType,
      walls,
      addWall,
      undoLastWall,
      totalWallArea,
      floorArea,
      polygonPoints,
      dynamicViewBox,
      selectedWallIndex,
      openingWidth,
      openingHeight,
      addOpening,
      wallAddMode,
      wallAngle,
      connectWalls,
    };
  },
};
</script>

<style scoped lang="scss">
#app {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

h1, h2 {
  color: #333;
  font-weight: 600;
  text-align: center;
}

.input-section {
  margin-bottom: 15px;
  padding: 12px;
  background-color: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #ddd;
}

.input-section h2 {
  font-size: 1.1em;
  margin-bottom: 8px;
}

label {
  display: block;
  margin-bottom: 6px;
}

input[type="number"], select {
  width: 100%;
  padding: 6px;
  margin-top: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  padding: 8px 12px;
  background: linear-gradient(to right, #00c3f5, #00a3d3);
  // color: #18191b;
  font-weight: 500;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 8px;
  margin-bottom: 8px;

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
}

.button-group {
  margin-top: 10px;
}

.summary {
  margin-top: 20px;
  background-color: #f4f4f4;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #ddd;
}

.summary p {
  font-size: 1.1em;
}

.compact-inputs {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.visualization {
  margin-top: 20px;
  background-color: #f4f4f4;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #ddd;
  overflow: auto;
}

.wall-details {
  margin-top: 20px;
}

.wall-info {
  margin-bottom: 12px;
  padding: 12px;
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.toggle-mode {
  margin-bottom: 10px;
}

.toggle-mode button {
  padding: 8px 12px;
  background-color: #f0f0f0;
  // border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 8px;
}

.toggle-mode button.active {
  background-color: #00c3f5;
}

.toggle-mode button:hover {
  background-color: #00c3f5;
}

.toggle-mode button:focus {
  outline: none;
}

button {
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #00c3f5;
}

input[type="number"]:focus, select:focus {
  border-color: #00c3f5;
  outline: none;
}

select {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-color: #f4f4f4;
}

select:focus {
  background-color: white;
}

.drawing {
  display: block;
  margin: 0 auto;
}

line {
  transition: stroke 0.3s ease;
}

line:hover {
  stroke: #ff5722;
}

button:focus {
  outline: none;
}
</style>
