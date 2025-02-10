<template>
  <div class="calculator">
    <h1>Калькулятор площади квартиры</h1>

    <!-- Ввод стен -->
    <div class="walls">
      <h2>Стены</h2>
      <div v-for="(wall, index) in walls" :key="index" class="wall">
        <div class="input-group">
          <label :for="`wall-length-${index}`">Длина стены (м):</label>
          <input type="number" v-model="wall.length" :id="`wall-length-${index}`" />
        </div>
        <div class="input-group">
          <label :for="`wall-height-${index}`">Высота стены (м):</label>
          <input type="number" v-model="wall.height" :id="`wall-height-${index}`" />
        </div>
        <button @click="removeWall(index)">Удалить стену</button>
      </div>
      <button @click="addWall">Добавить стену</button>
    </div>

    <!-- Ввод проемов -->
    <div class="openings">
      <h2>Проемы</h2>
      <div v-for="(opening, index) in openings" :key="index" class="opening">
        <div class="input-group">
          <label :for="`opening-width-${index}`">Ширина проема (м):</label>
          <input type="number" v-model="opening.width" :id="`opening-width-${index}`" />
        </div>
        <div class="input-group">
          <label :for="`opening-height-${index}`">Высота проема (м):</label>
          <input type="number" v-model="opening.height" :id="`opening-height-${index}`" />
        </div>
        <div class="input-group">
          <label :for="`opening-wall-${index}`">Стена:</label>
          <select v-model="opening.wallIndex" :id="`opening-wall-${index}`">
            <option v-for="(wall, idx) in walls" :key="idx" :value="idx">
              Стена {{ idx + 1 }}
            </option>
          </select>
        </div>
        <button @click="removeOpening(index)">Удалить проем</button>
      </div>
      <button @click="addOpening">Добавить проем</button>
    </div>

    <!-- Визуализация -->
    <div class="visualization">
      <h2>План квартиры</h2>
      <div class="plan">
        <div
          v-for="(wall, index) in walls"
          :key="index"
          class="wall-visual"
          :style="{
            width: `${wall.length * 20}px`,
            height: `${wall.height * 20}px`,
          }"
        >
          <span>Стена {{ index + 1 }}</span>
          <div
            v-for="(opening, idx) in openings.filter(o => o.wallIndex === index)"
            :key="idx"
            class="opening-visual"
            :style="{
              width: `${opening.width * 20}px`,
              height: `${opening.height * 20}px`,
            }"
          >
            Проем {{ idx + 1 }}
          </div>
        </div>
      </div>
    </div>

    <!-- Результаты -->
    <div class="results">
      <h2>Результаты</h2>
      <p>Площадь стен:</p>
      <ul>
        <li v-for="(wall, index) in walls" :key="index">
          Стена {{ index + 1 }}: {{ wallArea(wall, index) }} м²
        </li>
      </ul>
      <p>Общая площадь стен: {{ totalWallArea }} м²</p>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';

export default {
  setup() {
    const walls = ref([]);
    const openings = ref([]);

    const addWall = () => {
      walls.value.push({ length: 0, height: 0 });
    };

    const removeWall = (index) => {
      walls.value.splice(index, 1);
      // Удаляем проемы, связанные с этой стеной
      openings.value = openings.value.filter(opening => opening.wallIndex !== index);
    };

    const addOpening = () => {
      if (walls.value.length > 0) {
        openings.value.push({ width: 0, height: 0, wallIndex: 0 });
      } else {
        alert("Добавьте хотя бы одну стену перед добавлением проема.");
      }
    };

    const removeOpening = (index) => {
      openings.value.splice(index, 1);
    };

    const wallArea = (wall, wallIndex) => {
      let area = wall.length * wall.height;
      const wallOpenings = openings.value.filter(opening => opening.wallIndex === wallIndex);
      wallOpenings.forEach(opening => {
        area -= opening.width * opening.height;
      });
      return area.toFixed(2);
    };

    const totalWallArea = computed(() => {
      return walls.value.reduce((total, wall, index) => {
        return total + parseFloat(wallArea(wall, index));
      }, 0).toFixed(2);
    });

    return {
      walls,
      openings,
      addWall,
      removeWall,
      addOpening,
      removeOpening,
      wallArea,
      totalWallArea,
    };
  },
};
</script>

<style scoped>
.calculator {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
}

.input-group {
  margin-bottom: 15px;
}

.input-group label {
  display: block;
  margin-bottom: 5px;
}

.input-group input,
.input-group select {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
}

.walls,
.openings {
  margin-top: 20px;
}

.wall,
.opening {
  border: 1px solid #ddd;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 4px;
}

.visualization {
  margin-top: 20px;
}

.plan {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.wall-visual {
  position: relative;
  border: 2px solid #000;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f0f0;
}

.opening-visual {
  position: absolute;
  border: 1px solid red;
  background-color: rgba(255, 0, 0, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 12px;
}

button {
  margin-top: 10px;
  padding: 8px 12px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #0056b3;
}
</style>