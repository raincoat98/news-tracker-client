<template>
  <article class="skeleton-item">
    <div class="skeleton-content">
      <div class="skeleton-title"></div>
      <div class="skeleton-description">
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
      </div>
      <div class="skeleton-meta">
        <div class="skeleton-source"></div>
        <div class="skeleton-date"></div>
      </div>
    </div>
    <div class="skeleton-button"></div>
  </article>
</template>

<script setup>
</script>

<style scoped>
.skeleton-item {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: #f9f5ff;
  border-radius: 8px;
  border-left: 4px solid #6366f1;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.skeleton-content {
  flex: 1;
  min-width: 0;
}

.skeleton-title {
  height: 20px;
  background: linear-gradient(90deg, #e0e7ff 25%, #f0f4ff 50%, #e0e7ff 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  margin-bottom: 0.75rem;
  animation: loading 1.5s infinite;
}

.skeleton-description {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.skeleton-line {
  height: 14px;
  background: linear-gradient(90deg, #e0e7ff 25%, #f0f4ff 50%, #e0e7ff 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: loading 1.5s infinite;
}

.skeleton-line:last-child {
  width: 90%;
}

.skeleton-meta {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.skeleton-source {
  height: 20px;
  width: 60px;
  background: linear-gradient(90deg, #e0e7ff 25%, #f0f4ff 50%, #e0e7ff 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: loading 1.5s infinite;
}

.skeleton-date {
  height: 14px;
  width: 80px;
  background: linear-gradient(90deg, #e0e7ff 25%, #f0f4ff 50%, #e0e7ff 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: loading 1.5s infinite;
}

.skeleton-button {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  background: linear-gradient(90deg, #e0e7ff 25%, #f0f4ff 50%, #e0e7ff 75%);
  background-size: 200% 100%;
  border-radius: 50%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
