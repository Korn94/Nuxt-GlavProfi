<template>
  <div id="app">
    <h1>Калькулятор площади стен и пола</h1>

    <!-- Секция ввода данных для стен -->
    <div class="input-section">
      <h2>Добавить стену</h2>
      <label>
        Длина (м):
        <input v-model.number="wallLength" type="number" min="0" step="0.01" />
      </label>
      <label>
        Высота (м):
        <input v-model.number="wallHeight" type="number" min="0" step="0.01" />
      </label>
      <label>
        Тип угла:
        <select v-model="cornerType">
          <option value="inner">Внутренний угол</option>
          <option value="outer">Внешний угол</option>
        </select>
      </label>
      <button @click="addWall">Добавить стену</button>
      <button @click="undoLastWall" :disabled="walls.length === 0">
        Шаг назад
      </button>
    </div>

    <!-- Секция ввода данных для проемов -->
    <div class="input-section" v-if="walls.length > 0">
      <h2>Добавить проем</h2>
      <label>
        Стена:
        <select v-model.number="selectedWallIndex">
          <option v-for="(wall, index) in walls" :key="'wall-' + index" :value="index">
            Стена {{ index + 1 }}
          </option>
        </select>
      </label>
      <label>
        Ширина проема (м):
        <input
          v-model.number="openingWidth"
          type="number"
          min="0"
          step="0.01"
        />
      </label>
      <label>
        Высота проема (м):
        <input
          v-model.number="openingHeight"
          type="number"
          min="0"
          step="0.01"
        />
      </label>
      <button
        @click="addOpening"
        :disabled="openingWidth <= 0 || openingHeight <= 0"
      >
        Добавить проем
      </button>
    </div>

    <!-- Секция с итоговой информацией -->
    <div class="summary">
      <h2>Сводка</h2>
      <p>Общая площадь стен: {{ totalWallArea.toFixed(2) }} м²</p>
      <p>Площадь пола: {{ floorArea.toFixed(2) }} м²</p>
    </div>

    <!-- Секция для визуализации -->
    <div class="visualization">
      <h2>Визуализация</h2>
      <svg
        :viewBox="dynamicViewBox"
        xmlns="http://www.w3.org/2000/svg"
        class="drawing"
      >
        <polygon
          :points="polygonPoints"
          fill="#e0e0e0"
          stroke="#000"
          stroke-width="0.3"
        />

        <!-- Рисуем стены -->
        <line
          v-for="(wall, index) in walls"
          :key="'wall-' + index"
          :x1="wall.start.x"
          :y1="wall.start.y"
          :x2="wall.end.x"
          :y2="wall.end.y"
          stroke="#ff0000"
          stroke-width="0.2"
        />

        <!-- Рисуем проемы над стенами -->
        <line
          v-for="opening in walls.flatMap((wall) => wall.openings)"
          :key="'opening-' + opening.id"
          :x1="opening.x1"
          :y1="opening.y1"
          :x2="opening.x2"
          :y2="opening.y2"
          stroke="#fff"
          stroke-width="0.3"
        />

        <!-- Метки для стен -->
        <text
          v-for="(wall, index) in walls"
          :key="'label-' + index"
          :x="(wall.start.x + wall.end.x) / 2"
          :y="(wall.start.y + wall.end.y) / 2"
          fill="#000"
          font-size="1"
          text-anchor="middle"
        >
          {{ index + 1 }}
        </text>

        <!-- Рисуем соединительную линию между первой и последней точками -->
        <line
          v-if="walls.length > 1"
          :x1="walls[0].start.x"
          :y1="walls[0].start.y"
          :x2="walls[walls.length - 1].end.x"
          :y2="walls[walls.length - 1].end.y"
          stroke="#000"
          stroke-width="0.3"
        />
      </svg>
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
    const addWall = () => {
      if (wallLength.value <= 0 || wallHeight.value <= 0) {
        alert("Длина и высота стены должны быть больше 0");
        return;
      }

      const lastPoint = walls.value.length
        ? walls.value[walls.value.length - 1].end
        : { x: 0, y: 0 };

      const direction =
        walls.value.length % 2 === 0 ? "horizontal" : "vertical";
      let newX = lastPoint.x;
      let newY = lastPoint.y;

      if (direction === "horizontal") {
        newX +=
          cornerType.value === "inner" ? wallLength.value : -wallLength.value;
      } else {
        newY +=
          cornerType.value === "inner" ? -wallLength.value : wallLength.value;
      }

      walls.value.push({
        start: lastPoint,
        end: { x: newX, y: newY },
        area: wallLength.value * wallHeight.value, // Площадь стены
        openings: [], // Массив проемов в стене
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
      }, 0) + connectingWallArea.value
    );

    // Вычисление площади соединительной стены
    const connectingWallArea = computed(() => {
      if (walls.value.length > 1) {
        const x1 = walls.value[0].start.x;
        const y1 = walls.value[0].start.y;
        const x2 = walls.value[walls.value.length - 1].end.x;
        const y2 = walls.value[walls.value.length - 1].end.y;
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)) * wallHeight.value;
      }
      return 0;
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
    };
  },
};
</script>

<style scoped lang="scss">
#app {
  font-family: Arial, sans-serif;
  max-width: 800px;
  margin: 0 auto;
}

.input-section {
  margin-bottom: 20px;
}

button {
  margin-top: 10px;
  padding: 10px 20px;
}

.visualization {
  margin-top: 20px;
}

.drawing {
  width: 100%;
  height: 400px;
  background-color: #f9f9f9;
}
</style>
