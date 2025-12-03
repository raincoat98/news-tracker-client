import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useSubscriptionStore = defineStore('subscription', () => {
  const STORAGE_KEY = 'news_tracker_subscriptions'
  const subscriptions = ref(new Map())
  const isInitialized = ref(false)

  const initializeFromStorage = () => {
    if (isInitialized.value) return

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      console.log('[Store] localStorage에서 읽은 데이터:', stored)

      if (stored) {
        const parsed = JSON.parse(stored)
        subscriptions.value = new Map(Object.entries(parsed))
        console.log('[Store] 로드된 구독 목록:', Array.from(subscriptions.value.keys()))
      } else {
        console.log('[Store] localStorage에 데이터가 없습니다')
      }
    } catch (error) {
      console.error('[Store] localStorage 읽기 오류:', error)
    }

    isInitialized.value = true
  }

  const saveToStorage = () => {
    try {
      const obj = Object.fromEntries(subscriptions.value)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj))
      console.log('[Store] localStorage에 저장된 구독 목록:', Array.from(subscriptions.value.keys()))
    } catch (error) {
      console.error('[Store] localStorage 저장 오류:', error)
    }
  }

  const addSubscription = (keyword, subscriptionId) => {
    subscriptions.value.set(keyword, subscriptionId)
    saveToStorage()
  }

  const removeSubscription = (keyword) => {
    subscriptions.value.delete(keyword)
    saveToStorage()
  }

  const getSubscriptionId = (keyword) => {
    return subscriptions.value.get(keyword)
  }

  const getAllSubscriptions = computed(() => {
    return Array.from(subscriptions.value.keys())
  })

  const clearAll = () => {
    subscriptions.value.clear()
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    subscriptions,
    isInitialized,
    initializeFromStorage,
    saveToStorage,
    addSubscription,
    removeSubscription,
    getSubscriptionId,
    getAllSubscriptions,
    clearAll
  }
})
