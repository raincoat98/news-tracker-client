<template>
  <div class="news-list-container">
    <div class="news-header">
      <h2>
        {{ selectedKeyword ? `"${selectedKeyword}" 관련 뉴스` : '전체 뉴스' }}
      </h2>
      <div class="news-count">
        {{ isLoading ? '로딩 중...' : `총 ${news.length}개` }}
      </div>
    </div>

    <div v-if="isLoading && news.length === 0" class="news-items">
      <SkeletonNewsItem v-for="i in 5" :key="`skeleton-${i}`" />
    </div>

    <div v-else-if="news.length === 0" class="empty-state">
      <div class="empty-icon">📭</div>
      <p>뉴스가 없습니다</p>
      <small>구독을 추가하고 잠시 기다려주세요</small>
    </div>

    <div v-else class="news-items">
      <article
        v-for="item in news"
        :key="item.link"
        class="news-item"
      >
        <div class="news-content">
          <h3 class="news-title">
            <a :href="item.link" target="_blank" rel="noopener noreferrer">
              {{ item.title }}
            </a>
          </h3>

          <p v-if="item.description" class="news-description">
            {{ truncateText(item.description, 200) }}
          </p>

          <div class="news-meta">
            <span v-if="item.source" class="news-source">{{ item.source }}</span>
            <span class="news-date">
              {{ formatDate(item.pubDate) }}
            </span>
          </div>
        </div>

        <a
          :href="item.link"
          target="_blank"
          rel="noopener noreferrer"
          class="news-link-btn"
          title="원본 보기"
        >
          →
        </a>
      </article>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import SkeletonNewsItem from './SkeletonNewsItem.vue'

defineProps({
  news: {
    type: Array,
    default: () => []
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  selectedKeyword: {
    type: String,
    default: null
  }
})

const formatDate = (dateString) => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return '방금 전'
    if (diffMins < 60) return `${diffMins}분 전`
    if (diffHours < 24) return `${diffHours}시간 전`
    if (diffDays < 7) return `${diffDays}일 전`

    return date.toLocaleDateString('ko-KR')
  } catch {
    return dateString
  }
}

const truncateText = (text, length) => {
  if (!text) return ''
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}
</script>

<style scoped>
.news-list-container {
  padding: 2rem;
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.news-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f0f0f0;
}

.news-header h2 {
  margin: 0;
  color: #333;
  font-size: 1.5rem;
}

.news-count {
  background: #667eea;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
}


.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #999;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.empty-state p {
  font-size: 1.1rem;
  font-weight: 500;
  margin: 0;
}

.empty-state small {
  font-size: 0.9rem;
  color: #bbb;
}

.news-items {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.news-item {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: #f9f9f9;
  border-radius: 8px;
  border-left: 4px solid #667eea;
  transition: all 0.3s;
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

.news-item:hover {
  background: #f0f0f0;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.news-content {
  flex: 1;
  min-width: 0;
}

.news-title {
  margin: 0 0 0.75rem 0;
  font-size: 1.1rem;
  line-height: 1.4;
}

.news-title a {
  color: #333;
  text-decoration: none;
  transition: color 0.2s;
}

.news-title a:hover {
  color: #667eea;
}

.news-description {
  margin: 0 0 0.75rem 0;
  color: #666;
  font-size: 0.95rem;
  line-height: 1.5;
}

.news-meta {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
  font-size: 0.85rem;
}

.news-source {
  background: #667eea;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-weight: 500;
}

.news-date {
  color: #999;
}

.news-link-btn {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #667eea;
  color: white;
  border-radius: 50%;
  text-decoration: none;
  font-weight: bold;
  transition: all 0.2s;
  font-size: 1.2rem;
}

.news-link-btn:hover {
  background: #764ba2;
  transform: scale(1.1);
}

@media (max-width: 768px) {
  .news-list-container {
    padding: 1rem;
  }

  .news-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .news-item {
    flex-direction: column;
    gap: 0.75rem;
  }

  .news-title {
    font-size: 1rem;
  }

  .news-description {
    font-size: 0.9rem;
  }
}
</style>
