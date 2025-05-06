<template>
  <div class="block">
    <h3>Материалы ({{ materials.length }})</h3>

    <!-- Фильтрация по типу -->
    <div class="filter">
      <select v-model="filterType">
        <option value="">Все</option>
        <option value="incoming">Приход</option>
        <option value="outgoing">Расход</option>
      </select>
    </div>

    <!-- Форма добавления/редактирования -->
    <div class="form">
      <h4>{{ isEditing ? 'Редактировать материал' : 'Добавить материал' }}</h4>
      <input
        type="text"
        v-model="currentMaterial.name"
        placeholder="Название"
        required
      />
      <input
        type="number"
        step="100.00"
        v-model="currentMaterial.amount"
        placeholder="Сумма"
        required
      />
      <select v-model="currentMaterial.type">
        <option value="incoming">Приход</option>
        <option value="outgoing">Расход</option>
      </select>
      <textarea v-model="currentMaterial.comment" placeholder="Комментарий"></textarea>
      <div class="buttons">
        <button @click="saveMaterial" :disabled="!isFormValid" class="btn btn-primary">
          {{ isEditing ? 'Сохранить' : 'Добавить' }}
        </button>
        <button v-if="isEditing" @click="cancelEdit" class="btn btn-secondary">
          Отмена
        </button>
      </div>
    </div>

    <!-- Таблица материалов -->
    <table>
      <thead>
        <tr>
          <th>Дата</th>
          <th>Название</th>
          <th>Сумма</th>
          <th>Тип</th>
          <th>Наличие чека</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="material in filteredMaterials" :key="material.id">
          <td>{{ formatDate(material.createdAt) }}</td>
          <td>{{ material.name }}</td>
          <td>{{ material.amount }} ₽</td>
          <td>{{ material.type }}</td>
          <td>
            <input
              type="checkbox"
              :checked="material.has_receipt"
              @click="toggleCheck(material)"
              class="status-checkbox"
              :disabled="isEditing && currentMaterial.id === material.id"
            />
          </td>
          <td>
            <button @click="editMaterial(material)">Редактировать</button>
            <button @click="deleteMaterial(material.id)">Удалить</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Балансы по типам -->
    <div class="balance">
      <p>
        Приходы: {{ incomingTotal }} ₽
      </p>
      <p>
        Расходы: {{ outgoingTotal }} ₽
      </p>
      <p>
        Итого: {{ totalBalance }} ₽
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useNuxtApp } from "#app";

const route = useRoute();
// const router = useRouter();
const materials = ref([]);
const currentMaterial = ref({
  name: "",
  amount: 0,
  comment: "",
  has_receipt: false,
  objectId: route.params.id,
  type: "incoming", // По умолчанию приход
});
const isEditing = ref(false);
const filterType = ref("");

// Валидация формы
const isFormValid = computed(() => {
  return (
    currentMaterial.value.name &&
    currentMaterial.value.amount > 0 &&
    ["incoming", "outgoing"].includes(currentMaterial.value.type)
  );
});

// Фильтрация материалов по типу
const filteredMaterials = computed(() => {
  return materials.value.filter(material => {
    return (
      (!filterType.value || material.type === filterType.value) &&
      material.objectId === parseInt(route.params.id, 10) // Преобразуем route.params.id в число
    );
  });
});

// Вычисляемые балансы
const incomingTotal = computed(() => {
  return (
    materials.value
      .filter((m) => m.type === "incoming")
      .reduce((sum, m) => sum + m.amount, 0) || 0
  ).toFixed(2);
});

const outgoingTotal = computed(() => {
  return (
    materials.value
      .filter((m) => m.type === "outgoing")
      .reduce((sum, m) => sum + m.amount, 0) || 0
  ).toFixed(2);
});

const totalBalance = computed(() => {
  return (
    incomingTotal.value - outgoingTotal.value
  ).toFixed(2);
});

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Загрузка материалов
const fetchMaterials = async () => {
  try {
    const response = await useNuxtApp().$axios.get(
      `/materials/${route.params.id}?type=${filterType.value}`
    );
    materials.value = response.data.map((m) => ({
      ...m,
      amount: Number(m.amount),
    }));
  } catch (error) {
    console.error("Ошибка загрузки материалов:", error);
  }
};

// Методы для материалов
const saveMaterial = async () => {
  if (isFormValid.value) {
    if (isEditing.value) {
      await updateMaterial();
    } else {
      await addMaterial();
    }
    resetForm();
  }
};

const addMaterial = async () => {
  try {
    const response = await useNuxtApp().$axios.post("/materials", {
      ...currentMaterial.value,
      objectId: route.params.id,
    });
    materials.value.push(response.data);
  } catch (error) {
    console.error("Ошибка добавления материала:", error);
  }
};

const updateMaterial = async () => {
  try {
    await useNuxtApp().$axios.put(
      `/materials/${currentMaterial.value.id}`,
      currentMaterial.value
    );
    const index = materials.value.findIndex(
      (m) => m.id === currentMaterial.value.id
    );
    if (index !== -1) {
      materials.value.splice(index, 1, { ...currentMaterial.value });
    }
  } catch (error) {
    console.error("Ошибка обновления материала:", error);
  }
};

const editMaterial = (material) => {
  currentMaterial.value = { ...material };
  isEditing.value = true;
};

const cancelEdit = () => {
  resetForm();
  isEditing.value = false;
};

const resetForm = () => {
  currentMaterial.value = {
    name: "",
    amount: 0,
    comment: "",
    has_receipt: false,
    objectId: route.params.id,
    type: "incoming",
  };
};

const deleteMaterial = async (id) => {
  try {
    await useNuxtApp().$axios.delete(`/materials/${id}`);
    materials.value = materials.value.filter((m) => m.id !== id);
  } catch (error) {
    console.error("Ошибка удаления материала:", error);
  }
};

const toggleCheck = async (material) => {
  material.has_receipt = !material.has_receipt;
  try {
    await useNuxtApp().$axios.patch(
      `/materials/${material.id}/toggle-check`,
      { has_receipt: material.has_receipt }
    );
  } catch (error) {
    console.error("Ошибка обновления чека:", error);
    material.has_receipt = !material.has_receipt; // Откат в случае ошибки
  }
};

// Обновление при изменении route.params.id
watch(
  () => route.params.id,
  (newId) => {
    currentMaterial.value.objectId = newId;
    fetchMaterials();
  }
);

// Загрузка данных при монтировании
onMounted(() => {
  fetchMaterials();
  console.log("Route ID:", route.params.id);
  fetchMaterials().then(() => {
    console.log("Загруженные материалы:", materials.value);
  });
});
</script>

<style scoped>
.block {
  margin-bottom: 2rem;
}

.filter select {
  margin-bottom: 1rem;
}

.form {
  margin-bottom: 1.5rem;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 0.5rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.status-checkbox {
  transform: scale(1.2);
}

.balance {
  margin-top: 1rem;
  font-weight: bold;
}
</style>