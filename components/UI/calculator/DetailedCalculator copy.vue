<template>
  <div class="detailed-calculator">
    <h2>Подробный расчет ремонта</h2>

    <!-- Размеры помещения -->
    <div class="section">
      <h3>Основные размеры помещения</h3>
      <div class="inputs">
        <div>
          <label for="room-width">Ширина помещения (м):</label>
          <input id="room-width" type="number" v-model.number="roomDimensions.width" />
        </div>
        <div>
          <label for="room-length">Длина помещения (м):</label>
          <input id="room-length" type="number" v-model.number="roomDimensions.length" />
        </div>
        <div>
          <label for="room-height">Высота потолка (м):</label>
          <input id="room-height" type="number" v-model.number="roomDimensions.height" />
        </div>
      </div>
    </div>

    <!-- Элементы для расчета -->
    <div class="section">
      <h3>Выбор элементов для расчета</h3>
      <div class="checkboxes">
        <label>
          <input type="checkbox" v-model="selectedElements.ceiling" /> Потолок
        </label>
        <label>
          <input type="checkbox" v-model="selectedElements.floor" /> Пол
        </label>
        <label>
          <input type="checkbox" v-model="selectedElements.walls" /> Стены
        </label>
      </div>
    </div>

    <!-- Динамически отображаемые параметры -->
    <div class="section">
      <h3>Дополнительные параметры</h3>

      <!-- Пол -->
      <div v-if="selectedElements.floor">
        <h4>Параметры пола</h4>
        <div>
          <label for="floor-shape">Геометрическая форма:</label>
          <select v-model="floorShape" id="floor-shape">
            <option value="rectangle">Прямоугольная</option>
            <option value="triangle">Треугольная</option>
            <option value="circle">Круглая</option>
            <option value="custom">Произвольная</option>
          </select>
        </div>
        <button @click="addFloorSection">Добавить секцию</button>
        <div v-for="(section, index) in floorSections" :key="index" class="floor-section">
          <h5>Секция {{ index + 1 }}</h5>
          <div v-if="floorShape === 'rectangle'">
            <label>Длина (м):</label>
            <input type="number" v-model.number="section.length" />
            <label>Ширина (м):</label>
            <input type="number" v-model.number="section.width" />
          </div>
          <div v-else-if="floorShape === 'triangle'">
            <label>Основание (м):</label>
            <input type="number" v-model.number="section.base" />
            <label>Высота (м):</label>
            <input type="number" v-model.number="section.height" />
          </div>
          <div v-else-if="floorShape === 'circle'">
            <label>Радиус (м):</label>
            <input type="number" v-model.number="section.radius" />
          </div>
          <div v-else-if="floorShape === 'custom'">
            <label>Произвольная площадь (м²):</label>
            <input type="number" v-model.number="section.area" />
          </div>
        </div>
      </div>

      <!-- Стены -->
      <div v-if="selectedElements.walls">
        <h4>Параметры стен</h4>
        <div>
          <label>Количество окон:</label>
          <input type="number" v-model.number="windows.count" />
        </div>
        <div v-for="(window, index) in windows.list" :key="'window-' + index">
          <h5>Окно {{ index + 1 }}</h5>
          <label>Ширина (м):</label>
          <input type="number" v-model.number="window.width" />
          <label>Высота (м):</label>
          <input type="number" v-model.number="window.height" />
        </div>
        <button @click="addWindow">Добавить окно</button>

        <div>
          <label>Количество дверей:</label>
          <input type="number" v-model.number="doors.count" />
        </div>
        <div v-for="(door, index) in doors.list" :key="'door-' + index">
          <h5>Дверь {{ index + 1 }}</h5>
          <label>Ширина (м):</label>
          <input type="number" v-model.number="door.width" />
          <label>Высота (м):</label>
          <input type="number" v-model.number="door.height" />
        </div>
        <button @click="addDoor">Добавить дверь</button>
      </div>
    </div>

    <!-- Итоговый расчет -->
    <div class="section">
      <h3>Итоговый расчет</h3>
      <p>Площадь потолка: {{ calculateCeilingArea() }} м²</p>
      <p>Площадь пола: {{ calculateFloorArea() }} м²</p>
      <p>Площадь стен: {{ calculateWallArea() }} м²</p>
    </div>

    <button @click="reset">Сбросить параметры</button>
  </div>
</template>

<script setup>
import { reactive } from 'vue';

const roomDimensions = reactive({ width: 0, length: 0, height: 0 });
const selectedElements = reactive({ ceiling: false, floor: false, walls: false });
const floorShape = ref('rectangle');
const floorSections = reactive([]);
const windows = reactive({ count: 0, list: [] });
const doors = reactive({ count: 0, list: [] });

function addFloorSection() {
  floorSections.push({ length: 0, width: 0, base: 0, height: 0, radius: 0, area: 0 });
}

function addWindow() {
  windows.list.push({ width: 0, height: 0 });
}

function addDoor() {
  doors.list.push({ width: 0, height: 0 });
}

function calculateCeilingArea() {
  return roomDimensions.width * roomDimensions.length;
}

function calculateFloorArea() {
  return floorSections.reduce((total, section) => {
    if (floorShape.value === 'rectangle') {
      return total + section.length * section.width;
    } else if (floorShape.value === 'triangle') {
      return total + (section.base * section.height) / 2;
    } else if (floorShape.value === 'circle') {
      return total + Math.PI * section.radius ** 2;
    } else if (floorShape.value === 'custom') {
      return total + section.area;
    }
    return total;
  }, 0);
}

function calculateWallArea() {
  const totalWallArea =
    2 * (roomDimensions.width + roomDimensions.length) * roomDimensions.height;
  const totalWindowArea = windows.list.reduce((sum, w) => sum + w.width * w.height, 0);
  const totalDoorArea = doors.list.reduce((sum, d) => sum + d.width * d.height, 0);
  return totalWallArea - totalWindowArea - totalDoorArea;
}

function reset() {
  roomDimensions.width = 0;
  roomDimensions.length = 0;
  roomDimensions.height = 0;
  selectedElements.ceiling = false;
  selectedElements.floor = false;
  selectedElements.walls = false;
  floorSections.splice(0, floorSections.length);
  windows.list.splice(0, windows.list.length);
  doors.list.splice(0, doors.list.length);
}
</script>

<style scoped lang="scss">
.detailed-calculator {
  .section {
    margin-bottom: 20px;

    .inputs, .checkboxes {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
  }

  button {
    margin-top: 10px;
  }
}
</style>
