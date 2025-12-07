<template>
  <div class="news-list-container">
    <div class="news-header">
      <h2>
        {{ selectedKeyword ? `"${selectedKeyword}" 관련 뉴스` : '전체 뉴스' }}
      </h2>
      <div class="header-controls">
        <div class="control-group">
          <label>
            <span>표시:</span>
            <select
              :value="selectedKeyword ? pageDisplay : allPageDisplay"
              @change="(e) => handleDisplayChange(e)"
              :disabled="isLoadingPage"
            >
              <option value="10">10개</option>
              <option value="20">20개</option>
              <option value="50">50개</option>
              <option value="100">100개</option>
            </select>
          </label>
          <label v-if="selectedKeyword">
            <span>정렬:</span>
            <select v-model="pageSort" @change="handleSortChange" :disabled="isLoadingPage">
              <option value="date">날짜순</option>
              <option value="sim">정확도순</option>
            </select>
          </label>
          <div class="view-mode-toggle">
            <button
              class="view-btn"
              :class="{ active: viewMode === 'list' }"
              @click="viewMode = 'list'"
              title="리스트 보기"
            >
              ☰ 리스트
            </button>
            <button
              class="view-btn"
              :class="{ active: viewMode === 'grid' }"
              @click="viewMode = 'grid'"
              title="그리드 보기"
            >
              ⊞ 그리드
            </button>
          </div>
        </div>
        <div class="news-count">
          {{ isLoading ? '로딩 중...' : `총 ${displayCount}개` }}
        </div>
      </div>
    </div>

    <div v-if="isLoading && news.length === 0" class="news-items" :class="`view-${viewMode}`">
      <SkeletonNewsItem v-for="i in 5" :key="`skeleton-${i}`" />
    </div>

    <div v-else-if="news.length === 0" class="empty-state">
      <div class="empty-icon">📭</div>
      <p>뉴스가 없습니다</p>
      <small>구독을 추가하고 잠시 기다려주세요</small>
    </div>

    <div v-else class="news-items" :class="`view-${viewMode}`">
      <!-- 리스트 보기 -->
      <article
        v-if="viewMode === 'list'"
        v-for="item in displayNews"
        :key="item.link"
        class="news-item"
      >
        <div class="news-content">
          <h3 class="news-title">
            <a :href="item.link" target="_blank" rel="noopener noreferrer">
              {{ decodeHtmlEntities(item.title) }}
            </a>
          </h3>

          <p v-if="item.description" class="news-description">
            {{ truncateText(item.description, 200) }}
          </p>

          <div class="news-meta">
            <span v-if="item.source" class="news-source">{{ decodeHtmlEntities(item.source) }}</span>
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

      <!-- 그리드 보기 -->
      <article
        v-if="viewMode === 'grid'"
        v-for="item in displayNews"
        :key="item.link"
        class="news-card"
      >
        <a
          :href="item.link"
          target="_blank"
          rel="noopener noreferrer"
          class="card-link"
        >
          <div class="card-header">
            <span v-if="item.source" class="card-source">{{ decodeHtmlEntities(item.source) }}</span>
            <span class="card-date">{{ formatDate(item.pubDate) }}</span>
          </div>

          <h3 class="card-title">
            {{ decodeHtmlEntities(item.title) }}
          </h3>

          <p v-if="item.description" class="card-description">
            {{ truncateText(item.description, 150) }}
          </p>
        </a>
      </article>

      <!-- 페이징 컨트롤 (키워드 뉴스만) -->
      <div v-if="selectedKeyword && pageInfo" class="pagination">
        <button
          @click="handlePrevPage"
          :disabled="currentPage <= 1 || isLoadingPage"
          class="pagination-btn"
        >
          ← 이전
        </button>

        <div class="pagination-info">
          <span class="page-number">{{ currentPage }}/{{ pageInfo.totalPages }}</span>
        </div>

        <button
          @click="handleNextPage"
          :disabled="!pageInfo.hasNextPage || isLoadingPage"
          class="pagination-btn"
        >
          다음 →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, inject, watch } from 'vue'
import SkeletonNewsItem from './SkeletonNewsItem.vue'

const props = defineProps({
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

// useNewsSocket에서 제공하는 함수 주입
const getNewsPage = inject('getNewsPage', null)
const newsPageData = inject('newsPageData', null)
const refreshAllNewsDisplay = inject('refreshAllNewsDisplay', null)

// 페이징 상태 - 키워드별
const currentPage = ref(1)
const pageDisplay = ref('10')
const pageSort = ref('date')

// 페이징 상태 - 전체 뉴스
const allCurrentPage = ref(1)
const allPageDisplay = ref('10')

// 보기모드 상태
const viewMode = ref('list') // 'list' or 'grid'

const isLoadingPage = ref(false)

// 선택된 키워드 변경 시 현재 페이지 초기화
watch(
  () => props.selectedKeyword,
  (newKeyword) => {
    if (newKeyword) {
      currentPage.value = 1
      pageDisplay.value = '10'
      pageSort.value = 'date'
      console.log(`[Pagination] 키워드 변경됨: ${newKeyword}, 페이지 초기화`)
    } else {
      // 전체 뉴스 선택 시
      console.log(`[Pagination] 전체 뉴스 선택`)
    }
  }
)

const handleDisplayChange = (event) => {
  const newDisplay = parseInt(event.target.value)

  if (props.selectedKeyword) {
    // 키워드 뉴스: 1페이지부터 시작
    currentPage.value = 1
    pageDisplay.value = event.target.value
    console.log(`[옵션 변경] display: ${pageDisplay.value}개`)
    getNewsPage(props.selectedKeyword, 1, {
      display: newDisplay,
      sort: pageSort.value
    })
  } else {
    // 전체 뉴스: 로컬에서 처음 N개만 표시 (필터링)
    allPageDisplay.value = event.target.value
    allCurrentPage.value = 1
    console.log(`[옵션 변경] 전체 뉴스 display: ${allPageDisplay.value}개로 표시`)
  }
}

const handleSortChange = () => {
  // 정렬 변경 시 1페이지부터 시작 (순서가 바뀌므로)
  currentPage.value = 1
  console.log(`[옵션 변경] sort: ${pageSort.value}`)
  getNewsPage(props.selectedKeyword, 1, {
    display: parseInt(pageDisplay.value),
    sort: pageSort.value
  })
}

const pageInfo = computed(() => {
  if (!props.selectedKeyword || !newsPageData) return null
  const key = `${props.selectedKeyword}_page_${currentPage.value}`
  return newsPageData.value?.[key] || null
})

const displayNews = computed(() => {
  if (!props.selectedKeyword) {
    // 전체 뉴스: allPageDisplay 개수만큼만 표시
    const displayCount = parseInt(allPageDisplay.value)
    return (props.news || []).slice(0, displayCount)
  }
  // 키워드 뉴스: 페이지 데이터가 있으면 그것을 사용
  if (pageInfo.value?.items && Array.isArray(pageInfo.value.items)) {
    return pageInfo.value.items
  }
  // 없으면 기본 뉴스 사용
  return props.news || []
})

const displayCount = computed(() => {
  if (!props.selectedKeyword) {
    // 전체 뉴스: 실제 표시되는 개수를 반환
    return displayNews.value.length
  }
  if (pageInfo.value?.total) {
    return pageInfo.value.total
  }
  return props.news.length
})

const handleNextPage = async () => {
  if (!getNewsPage) return
  if (!pageInfo.value?.hasNextPage) return

  isLoadingPage.value = true
  currentPage.value += 1

  const display = parseInt(pageDisplay.value)
  const sort = pageSort.value

  console.log(`[Pagination] 다음 페이지 요청: ${props.selectedKeyword} 페이지 ${currentPage.value}`)
  getNewsPage(props.selectedKeyword, currentPage.value, { display, sort })

  setTimeout(() => {
    isLoadingPage.value = false
  }, 1000)
}

const handlePrevPage = async () => {
  if (!getNewsPage) return
  if (currentPage.value <= 1) return

  isLoadingPage.value = true
  currentPage.value -= 1

  const display = parseInt(pageDisplay.value)
  const sort = pageSort.value

  console.log(`[Pagination] 이전 페이지 요청: ${props.selectedKeyword} 페이지 ${currentPage.value}`)
  getNewsPage(props.selectedKeyword, currentPage.value, { display, sort })

  setTimeout(() => {
    isLoadingPage.value = false
  }, 1000)
}


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

const decodeHtmlEntities = (text) => {
  if (!text) return ''
  const element = document.createElement('textarea')
  element.innerHTML = text
  return element.value
}

const truncateText = (text, length) => {
  if (!text) return ''
  const decoded = decodeHtmlEntities(text)
  if (decoded.length <= length) return decoded
  return decoded.substring(0, length) + '...'
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
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e0e7ff;
}

.news-header h2 {
  margin: 0 0 1rem 0;
  color: #4f46e5;
  font-size: 1.4rem;
  font-weight: 600;
}

.header-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.control-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #374151;
}

.control-group span {
  font-weight: 500;
}

.control-group select {
  padding: 0.5rem 0.75rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #374151;
  transition: all 0.2s;
}

.control-group select:hover:not(:disabled) {
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.control-group select:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
  opacity: 0.6;
}

.view-mode-toggle {
  display: flex;
  gap: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.25rem;
  background: white;
}

.view-btn {
  padding: 0.4rem 0.75rem;
  background: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  color: #6b7280;
  font-weight: 500;
  transition: all 0.2s;
}

.view-btn:hover {
  background: #f3f4f6;
}

.view-btn.active {
  background: #6366f1;
  color: white;
}

.news-count {
  background: #6366f1;
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
  color: #9ca3af;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.empty-state p {
  font-size: 1.1rem;
  font-weight: 500;
  margin: 0;
  color: #6b7280;
}

.empty-state small {
  font-size: 0.9rem;
  color: #d1d5db;
}

.news-items {
  display: flex;
  gap: 1.5rem;
}

.news-items.view-list {
  flex-direction: column;
}

.news-items.view-grid {
  flex-wrap: wrap;
  justify-content: flex-start;
}

.news-item {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: #f9f5ff;
  border-radius: 8px;
  border-left: 4px solid #6366f1;
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
  background: #f0f4ff;
  box-shadow: 0 4px 8px rgba(99, 102, 241, 0.15);
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
  color: #1f2937;
  text-decoration: none;
  transition: color 0.2s;
}

.news-title a:hover {
  color: #6366f1;
}

.news-description {
  margin: 0 0 0.75rem 0;
  color: #6b7280;
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
  background: #6366f1;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-weight: 500;
}

.news-date {
  color: #9ca3af;
}

.news-link-btn {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #6366f1;
  color: white;
  border-radius: 50%;
  text-decoration: none;
  font-weight: bold;
  transition: all 0.2s;
  font-size: 1.2rem;
}

.news-link-btn:hover {
  background: #4f46e5;
  transform: scale(1.1);
}

/* 그리드 보기 카드 스타일 */
.news-card {
  flex: 1 1 calc(33.333% - 1rem);
  min-width: 280px;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e0e7ff;
  box-shadow: 0 1px 3px rgba(99, 102, 241, 0.1);
  transition: all 0.3s;
  animation: slideIn 0.3s ease-out;
}

.news-card:hover {
  box-shadow: 0 8px 16px rgba(99, 102, 241, 0.15);
  transform: translateY(-4px);
}

.card-link {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1.5rem;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
}

.card-link:hover {
  color: #6366f1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  font-size: 0.8rem;
}

.card-source {
  background: #6366f1;
  color: white;
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-date {
  color: #9ca3af;
  font-size: 0.75rem;
  white-space: nowrap;
}

.card-title {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  line-height: 1.4;
  font-weight: 600;
  color: #1f2937;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-description {
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
  line-height: 1.4;
  flex-grow: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 2rem 0 0 0;
  margin-top: 2rem;
  border-top: 2px solid #e0e7ff;
}

.pagination-btn {
  padding: 0.75rem 1.5rem;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  font-size: 0.95rem;
}

.pagination-btn:hover:not(:disabled) {
  background: #4f46e5;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(99, 102, 241, 0.3);
}

.pagination-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
  opacity: 0.5;
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.page-number {
  font-weight: 600;
  color: #374151;
  min-width: 60px;
  text-align: center;
}

@media (max-width: 768px) {
  .news-list-container {
    padding: 1rem;
  }

  .news-header h2 {
    font-size: 1.2rem;
  }

  .header-controls {
    flex-direction: column;
    align-items: flex-start;
  }

  .control-group {
    width: 100%;
    flex-wrap: wrap;
  }

  .control-group label {
    flex: 1;
    min-width: 150px;
  }

  .news-count {
    width: 100%;
    text-align: center;
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

  .pagination {
    flex-wrap: wrap;
  }

  .pagination-btn {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
  }

  .news-card {
    flex: 1 1 calc(50% - 0.75rem);
    min-width: 200px;
  }

  .view-mode-toggle {
    order: -1;
    width: 100%;
  }

  .news-count {
    width: 100%;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .news-card {
    flex: 1 1 100%;
    min-width: 100%;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .card-date {
    width: 100%;
  }

  .control-group {
    flex-direction: column;
  }

  .view-mode-toggle {
    width: 100%;
  }
}
</style>
