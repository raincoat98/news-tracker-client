import { ref, computed, onMounted, onUnmounted } from 'vue'
import { io } from 'socket.io-client'
import { useSubscriptionStore } from '../stores/subscriptionStore'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'

const DEFAULT_SUBSCRIBE_OPTIONS = {
  interval: '*/5 * * * *',
  display: 10
}

const socket = ref(null)
const isConnected = ref(false)
const connectionError = ref(null)
const serverStatus = ref(null)
const reconnectAttempts = ref(0)
const maxReconnectAttempts = 5

const newsUpdates = ref({})

export function useNewsSocket() {
  const store = useSubscriptionStore()

  if (!store.isInitialized.value) {
    store.initializeFromStorage()
  }

  const eventHandlers = {}

  const registerEventHandler = (event, handler) => {
    if (!eventHandlers[event]) {
      eventHandlers[event] = []
    }
    eventHandlers[event].push(handler)
    return () => {
      eventHandlers[event] = eventHandlers[event].filter(h => h !== handler)
    }
  }

  const removeAllEventHandlers = () => {
    if (!socket.value) return
    Object.keys(eventHandlers).forEach(event => {
      socket.value.removeAllListeners(event)
    })
  }

  onMounted(() => {
    connectSocket()
  })

  onUnmounted(() => {
    removeAllEventHandlers()
    if (socket.value) {
      socket.value.disconnect()
    }
  })

  const connectSocket = () => {
    if (socket.value?.connected) return

    socket.value = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: maxReconnectAttempts
    })

    socket.value.on('connect', () => {
      isConnected.value = true
      connectionError.value = null
      reconnectAttempts.value = 0
      console.log('[Socket] 연결됨:', socket.value.id)

      setTimeout(() => {
        resubscribeAll()
      }, 500)
    })

    socket.value.on('disconnect', (reason) => {
      isConnected.value = false
      console.log('[Socket] 연결 해제됨:', reason)
      if (reason === 'io server disconnect') {
        connectionError.value = '서버에서 연결을 종료했습니다'
      }
    })

    socket.value.on('connect_error', (error) => {
      reconnectAttempts.value += 1
      const errorMsg = error?.message || '연결 오류 발생'
      connectionError.value = `${errorMsg} (재시도: ${reconnectAttempts.value}/${maxReconnectAttempts})`
      console.error('[Socket Error]', error)
    })

    socket.value.on('news', (data) => {
      if (data?.keyword && Array.isArray(data?.news)) {
        newsUpdates.value[data.keyword] = data.news
        console.log('[뉴스 수신]', data.keyword, data.news.length, '개')
      } else {
        console.warn('[뉴스 수신 오류] 잘못된 데이터 형식:', data)
      }
    })

    socket.value.on('subscribed', (data) => {
      if (data?.keyword && data?.subscriptionId) {
        store.addSubscription(data.keyword, data.subscriptionId)
        connectionError.value = null
        console.log('[구독 성공]', data.keyword)

        setTimeout(() => {
          console.log('[구독] 캐시된 뉴스 요청:', data.keyword)
          getCachedNews(data.keyword)
        }, 200)
      } else {
        console.warn('[구독 오류] 잘못된 응답 형식:', data)
      }
    })

    socket.value.on('unsubscribed', (data) => {
      if (data?.keyword) {
        store.removeSubscription(data.keyword)
        delete newsUpdates.value[data.keyword]
        console.log('[구독 취소]', data.keyword)
      }
    })

    socket.value.on('cached-news', (data) => {
      if (data?.keyword && Array.isArray(data?.news)) {
        newsUpdates.value[data.keyword] = data.news
        console.log('[캐시된 뉴스]', data.keyword, data.news.length, '개')
      }
    })

    socket.value.on('status', (data) => {
      if (data) {
        serverStatus.value = data
      }
    })

    socket.value.on('error', (error) => {
      console.error('[Socket Server Error]', error)
      connectionError.value = '서버 오류: 잠시 후 다시 시도해주세요'
    })
  }

  const subscribe = (keyword, options = {}) => {
    if (!socket.value?.connected) {
      connectionError.value = 'Socket이 연결되어 있지 않습니다'
      console.error('[구독 실패]', connectionError.value)
      return
    }

    const trimmedKeyword = keyword.trim()

    if (store.subscriptions.size > 0) {
      if (store.subscriptions.has(trimmedKeyword)) {
        connectionError.value = `이미 "${trimmedKeyword}"을(를) 구독 중입니다`
        console.warn('[구독] 중복 구독:', trimmedKeyword)
        return
      }
    }

    const payload = {
      keyword: trimmedKeyword,
      interval: options.interval || DEFAULT_SUBSCRIBE_OPTIONS.interval,
      display: options.display || DEFAULT_SUBSCRIBE_OPTIONS.display
    }

    console.log('[subscribe] 요청:', payload)
    socket.value.emit('subscribe', payload)
  }

  const unsubscribe = (keyword) => {
    if (!socket.value?.connected) return

    const subscriptionId = store.subscriptions.get(keyword)
    socket.value.emit('unsubscribe', {
      keyword,
      subscriptionId
    })
  }

  const getCachedNews = (keyword) => {
    if (!socket.value?.connected) return

    socket.value.emit('get-cached-news', { keyword })
  }

  const getServerStatus = () => {
    if (!socket.value?.connected) return

    socket.value.emit('get-status')
  }

  const resubscribeAll = () => {
    if (!socket.value?.connected) {
      console.warn('[재구독] Socket이 연결되지 않았습니다')
      return
    }

    const savedKeywords = store.getAllSubscriptions
    console.log('[재구독] 저장된 구독 목록:', savedKeywords)

    if (!Array.isArray(savedKeywords) || savedKeywords.length === 0) {
      console.log('[재구독] 구독 목록이 비어있습니다')
      return
    }

    console.log('[재구독] 시작:', savedKeywords.length, '개')
    savedKeywords.forEach((keyword) => {
      console.log('[재구독] 키워드 구독 중:', keyword)
      subscribe(keyword)

      setTimeout(() => {
        console.log('[재구독] 캐시된 뉴스 요청:', keyword)
        getCachedNews(keyword)
      }, 300)
    })
  }

  const getNews = (keyword) => {
    return newsUpdates.value[keyword] || []
  }

  const getAllNews = computed(() => {
    const allNews = []
    Object.values(newsUpdates.value).forEach((news) => {
      if (Array.isArray(news)) {
        allNews.push(...news)
      }
    })
    return allNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
  })

  return {
    isConnected,
    connectionError,
    reconnectAttempts,
    subscriptions: computed(() => {
      return store.getAllSubscriptions
    }),
    serverStatus,
    subscribe,
    unsubscribe,
    getCachedNews,
    getServerStatus,
    getNews,
    getAllNews,
    resubscribeAll,
    socket: computed(() => socket.value)
  }
}
