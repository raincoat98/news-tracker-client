import { useQuery } from '@tanstack/vue-query'
import { ref, computed, watch } from 'vue'

export function useNewsQuery(newsSocket) {
  const selectedKeyword = ref(null)

  const newsQuery = useQuery({
    queryKey: computed(() => ['news', selectedKeyword.value]),
    queryFn: async () => {
      if (!selectedKeyword.value) return []
      const news = newsSocket.getNews(selectedKeyword.value)
      console.log('[Vue Query] 키워드 뉴스 조회:', selectedKeyword.value, news.length)
      return news
    },
    enabled: computed(() => !!selectedKeyword.value),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false
  })

  const allNewsQuery = useQuery({
    queryKey: () => ['news', 'all'],
    queryFn: () => {
      const news = newsSocket.getAllNews.value
      console.log('[Vue Query] 전체 뉴스 조회:', news.length)
      return news
    },
    enabled: computed(() => true),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false
  })

  const selectKeyword = (keyword) => {
    selectedKeyword.value = keyword
    // getNewsPage만 사용 (display: 10으로 첫 페이지 데이터 가져오기)
    // getCachedNews는 호출하지 않음 (이전 캐시 데이터 방지)
    newsSocket.getNewsPage(keyword, 1, { display: 10, sort: 'date' })
  }

  const clearSelection = () => {
    selectedKeyword.value = null
  }

  watch(
    () => newsSocket.getAllNews.value,
    (newNews) => {
      if (newNews?.length > 0) {
        console.log('[Vue Query Watch] 뉴스 업데이트 감지, refetch 시작')
        allNewsQuery.refetch()
        if (selectedKeyword.value) {
          newsQuery.refetch()
        }
      }
    },
    { deep: false }
  )

  return {
    selectedKeyword: computed(() => selectedKeyword.value),
    newsQuery,
    allNewsQuery,
    selectKeyword,
    clearSelection
  }
}
