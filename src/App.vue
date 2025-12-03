<template>
  <div class="app-container">
    <header class="app-header">
      <div class="header-content">
        <h1>📰 뉴스 트래커</h1>
        <div class="header-status">
          <span
            class="status-badge"
            :class="{ connected: isConnected, disconnected: !isConnected }"
          >
            {{ isConnected ? '🟢 연결됨' : '🔴 연결 끊김' }}
          </span>
          <span v-if="connectionError" class="error-message">{{ connectionError }}</span>
        </div>
      </div>
    </header>

    <main class="app-main">
      <div class="container">
        <div class="grid">
          <!-- 좌측: 구독 관리 -->
          <aside class="sidebar">
            <NewsSubscription @subscribe="handleSubscribe" />

            <div class="subscriptions-list">
              <h3>현재 구독</h3>
              <div v-if="subscriptions.length === 0" class="empty-state">
                구독하고 있는 키워드가 없습니다.
              </div>
              <div v-else class="subscription-items">
                <div
                  v-for="keyword in subscriptions"
                  :key="keyword"
                  class="subscription-item"
                  @click="selectKeyword(keyword)"
                  :class="{ active: selectedKeyword === keyword }"
                >
                  <span class="keyword-name">{{ keyword }}</span>
                  <button
                    class="unsubscribe-btn"
                    @click.stop="handleUnsubscribe(keyword)"
                    title="구독 취소"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            <div class="server-status" v-if="serverStatus">
              <h3>서버 상태</h3>
              <div class="status-info">
                <p><strong>활성 구독:</strong> {{ serverStatus.activeSubscriptions }}</p>
                <p><strong>캐시된 뉴스:</strong> {{ serverStatus.cachedNewsCount }}</p>
                <p><strong>메모리:</strong> {{ formatBytes(serverStatus.memoryUsage) }}</p>
              </div>
              <button @click="getServerStatus" class="refresh-btn">새로고침</button>
            </div>
          </aside>

          <!-- 우측: 뉴스 목록 -->
          <section class="news-section">
            <NewsList
              :news="displayNews"
              :isLoading="isLoading"
              :selectedKeyword="selectedKeyword"
            />
          </section>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onBeforeMount } from 'vue'
import NewsSubscription from './components/NewsSubscription.vue'
import NewsList from './components/NewsList.vue'
import { useNewsSocket } from './composables/useNewsSocket'
import { useNewsQuery } from './composables/useNewsQuery'
import { useSubscriptionStore } from './stores/subscriptionStore'

const subscriptionStore = useSubscriptionStore()

onBeforeMount(() => {
  subscriptionStore.initializeFromStorage()
})

const newsSocket = useNewsSocket()
const {
  selectedKeyword,
  newsQuery,
  allNewsQuery,
  selectKeyword,
  clearSelection
} = useNewsQuery(newsSocket)

const {
  isConnected,
  connectionError,
  subscriptions,
  serverStatus,
  subscribe,
  unsubscribe,
  getServerStatus
} = newsSocket

const isLoading = computed(() => newsQuery.isLoading.value || allNewsQuery.isLoading.value)
const displayNews = computed(() => {
  if (selectedKeyword.value) {
    return newsQuery.data.value || []
  }
  return allNewsQuery.data.value || []
})

const handleSubscribe = (options) => {
  if (!options?.keyword) {
    console.error('[구독 오류] 검색어가 없습니다')
    return
  }

  const keyword = options.keyword.trim()

  if (subscriptions.value.includes(keyword)) {
    console.warn('[구독] 중복 구독 시도:', keyword)
    return
  }

  console.log('[App] 구독 요청:', keyword)

  subscribe(keyword, {
    interval: options.interval || '*/5 * * * *',
    display: options.display || 10
  })
}

const handleUnsubscribe = (keyword) => {
  if (selectedKeyword.value === keyword) {
    clearSelection()
  }
  unsubscribe(keyword)
}

const formatBytes = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
}

.app-header {
  background: rgba(0, 0, 0, 0.3);
  color: white;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-header h1 {
  font-size: 2rem;
  margin: 0;
}

.header-status {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
}

.status-badge.connected {
  background: rgba(76, 175, 80, 0.3);
  color: #fff;
}

.status-badge.disconnected {
  background: rgba(244, 67, 54, 0.3);
  color: #fff;
}

.error-message {
  color: #ff6b6b;
  font-weight: 500;
}

.app-main {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

.grid {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.subscriptions-list,
.server-status {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.subscriptions-list h3,
.server-status h3 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.1rem;
}

.empty-state {
  text-align: center;
  color: #999;
  padding: 1rem;
  font-size: 0.9rem;
}

.subscription-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.subscription-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f5f5f5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.subscription-item:hover {
  background: #efefef;
}

.subscription-item.active {
  background: #667eea;
  color: white;
  border-left-color: #764ba2;
}

.keyword-name {
  font-weight: 500;
  flex: 1;
}

.unsubscribe-btn {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.25rem;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.unsubscribe-btn:hover {
  opacity: 1;
}

.status-info {
  background: #f9f9f9;
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.status-info p {
  margin: 0.5rem 0;
  color: #666;
}

.status-info strong {
  color: #333;
}

.refresh-btn {
  width: 100%;
  padding: 0.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.refresh-btn:hover {
  background: #764ba2;
}

.news-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

@media (max-width: 1024px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
}
</style>
