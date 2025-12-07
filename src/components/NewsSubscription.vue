<template>
  <div class="subscription-card">
    <h2>구독 추가</h2>

    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="keyword">검색어</label>
        <input
          id="keyword"
          v-model="keyword"
          type="text"
          placeholder="예: 인공지능, 삼성, 날씨"
        />
      </div>

      <div class="form-group">
        <label>갱신 주기</label>
        <div class="interval-presets">
          <button
            v-for="preset in PRESET_INTERVALS"
            :key="preset.value"
            type="button"
            class="preset-btn"
            :class="{
              active: showCustomInterval ? false : interval === preset.value,
            }"
            @click="handleIntervalChange(preset.value)"
          >
            {{ preset.label }}
          </button>
        </div>
        <div v-if="showCustomInterval" class="custom-interval">
          <input
            v-model="customInterval"
            type="text"
            placeholder="예: */5 * * * * (5분마다)"
          />
          <small>Cron 형식: 분 시 일 월 요일</small>
        </div>
      </div>

      <div class="form-group">
        <label for="display">표시 뉴스 수</label>
        <input
          id="display"
          v-model.number="display"
          type="number"
          min="1"
          max="100"
        />
      </div>

      <button type="submit" class="submit-btn" :disabled="isSubmitting">
        {{ isSubmitting ? "처리 중..." : "구독 추가" }}
      </button>
    </form>

    <div v-if="error" class="error-message">⚠️ {{ error }}</div>

    <div v-if="success" class="success-message">✓ {{ success }}</div>
  </div>
</template>

<script setup>
import { ref, inject } from "vue";

const DEFAULT_OPTIONS = {
  interval: "*/5 * * * *",
  display: 10,
};

// 현재 구독 중인 키워드 주입받기
const subscriptions = inject("subscriptions", { value: [] });

const PRESET_INTERVALS = [
  { label: "1분", value: "* * * * *" },
  { label: "5분", value: "*/5 * * * *" },
  { label: "10분", value: "*/10 * * * *" },
  { label: "30분", value: "*/30 * * * *" },
  { label: "1시간", value: "0 * * * *" },
  { label: "직접입력", value: "custom" },
];

defineProps({});

const emit = defineEmits(["subscribe"]);

const keyword = ref("");
const interval = ref(DEFAULT_OPTIONS.interval);
const display = ref(DEFAULT_OPTIONS.display);
const error = ref("");
const success = ref("");
const isSubmitting = ref(false);
const showCustomInterval = ref(false);
const customInterval = ref("");

const handleSubmit = async (e) => {
  if (e) {
    e.preventDefault();
  }

  if (isSubmitting.value) {
    console.warn("[NewsSubscription] 이미 처리 중입니다");
    return;
  }

  error.value = "";
  success.value = "";

  if (!keyword.value.trim()) {
    error.value = "검색어를 입력하세요";
    return;
  }

  if (keyword.value.trim().length > 50) {
    error.value = "검색어는 50자 이내여야 합니다";
    return;
  }

  // 이미 구독 중인지 확인
  const trimmedKeyword = keyword.value.trim();
  if (subscriptions.value && subscriptions.value.includes(trimmedKeyword)) {
    error.value = `이미 "${trimmedKeyword}"을(를) 구독 중입니다`;
    setTimeout(() => {
      error.value = "";
    }, 3000);
    return;
  }

  if (display.value < 1 || display.value > 100) {
    error.value = "뉴스 개수는 1~100 사이여야 합니다";
    return;
  }

  let finalInterval = interval.value;

  if (showCustomInterval.value) {
    if (!customInterval.value.trim()) {
      error.value = "Cron 형식을 입력하세요";
      return;
    }
    finalInterval = customInterval.value.trim();
  }

  isSubmitting.value = true;

  try {
    const subscriptionData = {
      keyword: keyword.value.trim(),
      interval: finalInterval,
      display: display.value,
    };

    console.log("[NewsSubscription] 구독 요청:", subscriptionData);

    emit("subscribe", subscriptionData);

    success.value = `"${keyword.value}" 구독이 시작되었습니다`;
    keyword.value = "";
    interval.value = DEFAULT_OPTIONS.interval;
    display.value = DEFAULT_OPTIONS.display;
    customInterval.value = "";
    showCustomInterval.value = false;

    setTimeout(() => {
      success.value = "";
    }, 3000);
  } catch (err) {
    console.error("[NewsSubscription] 구독 중 오류:", err);
    error.value = "구독 중 오류가 발생했습니다";
  } finally {
    isSubmitting.value = false;
  }
};

const handleIntervalChange = (value) => {
  if (value === "custom") {
    showCustomInterval.value = true;
    customInterval.value = "";
  } else {
    showCustomInterval.value = false;
    interval.value = value;
  }
};
</script>

<style scoped>
.subscription-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #e0e7ff;
  box-shadow: 0 1px 3px rgba(99, 102, 241, 0.1);
}

.subscription-card h2 {
  margin: 0 0 1.5rem 0;
  color: #4f46e5;
  font-size: 1.1rem;
  font-weight: 600;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #374151;
  font-weight: 500;
  font-size: 0.9rem;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-group small {
  display: block;
  margin-top: 0.5rem;
  color: #9ca3af;
  font-size: 0.8rem;
}

.interval-presets {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.preset-btn {
  padding: 0.5rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.2s;
  color: #374151;
}

.preset-btn:hover {
  border-color: #6366f1;
  background: #f0f4ff;
}

.preset-btn.active {
  background: #6366f1;
  border-color: #6366f1;
  color: white;
}

.custom-interval {
  margin-top: 0.5rem;
}

.custom-interval input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.custom-interval input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.submit-btn {
  width: 100%;
  padding: 0.75rem;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.95rem;
}

.submit-btn:hover {
  background: #4f46e5;
  box-shadow: 0 4px 8px rgba(99, 102, 241, 0.2);
}

.submit-btn:active {
  transform: scale(0.98);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.error-message,
.success-message {
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
  animation: slideIn 0.3s ease-out;
  border-left: 3px solid;
}

.error-message {
  background: #fef2f2;
  color: #991b1b;
  border-left-color: #dc2626;
}

.success-message {
  background: #f0fdf4;
  color: #166534;
  border-left-color: #22c55e;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
