# 뉴스 트래커 - 클라이언트 (Vue.js + Vite)

Vue.js 3, Vite, TanStack Query(VueQuery), Socket.io를 사용하여 구축한 실시간 뉴스 추적 클라이언트입니다.

## 기능

- 🔔 **실시간 뉴스 구독**: 원하는 키워드로 뉴스를 실시간으로 구독
- 📡 **WebSocket 통신**: Socket.io를 통한 양방향 실시간 데이터 동기화
- 🎯 **VueQuery 통합**: 서버 상태 관리 및 캐싱
- 🎨 **반응형 UI**: 모바일 친화적인 디자인
- 📊 **서버 상태 모니터링**: 활성 구독 및 메모리 사용량 확인

## 프로젝트 구조

```
news-tracker-client/
├── index.html                 # HTML 진입점
├── vite.config.js            # Vite 설정
├── package.json              # 의존성 관리
├── .env.example              # 환경 변수 예제
├── src/
│   ├── main.js              # Vue 애플리케이션 진입점
│   ├── App.vue              # 루트 컴포넌트
│   ├── components/
│   │   ├── NewsSubscription.vue  # 구독 폼 컴포넌트
│   │   └── NewsList.vue         # 뉴스 목록 컴포넌트
│   └── composables/
│       ├── useNewsSocket.js     # Socket.io 상태 관리
│       └── useNewsQuery.js      # VueQuery 통합
└── README.md
```

## 설치 및 실행

### 1. 의존성 설치

```bash
cd news-tracker-client
npm install
```

### 2. 환경 변수 설정

`.env.example`을 `.env.local`로 복사하고 수정:

```bash
cp .env.example .env.local
```

`.env.local`:
```
VITE_SOCKET_URL=http://localhost:3000
```

### 3. 개발 서버 실행

```bash
npm run dev
```

서버가 `http://localhost:5173`에서 실행됩니다.

### 4. 프로덕션 빌드

```bash
npm run build
npm run preview
```

## 주요 Composables

### `useNewsSocket.js`

Socket.io를 통한 뉴스 데이터 수신 및 관리

**주요 함수:**
- `subscribe(keyword, options)` - 키워드 구독
- `unsubscribe(keyword)` - 구독 취소
- `getCachedNews(keyword)` - 캐시된 뉴스 조회
- `getServerStatus()` - 서버 상태 조회

**반응형 상태:**
- `isConnected` - 연결 상태
- `subscriptions` - 현재 구독 키워드
- `cachedNews` - 캐시된 뉴스 데이터

### `useNewsQuery.js`

VueQuery를 사용한 쿼리 상태 관리

**반응형 상태:**
- `newsQuery` - 선택된 키워드의 뉴스 쿼리
- `allNewsQuery` - 모든 뉴스의 쿼리
- `selectedKeyword` - 현재 선택된 키워드

## 컴포넌트

### NewsSubscription.vue

키워드 구독을 위한 폼 컴포넌트

**Props:** 없음

**Events:**
- `subscribe(payload)` - 구독 추가 시 발생

**기능:**
- 검색어 입력
- 갱신 주기 설정 (Cron 형식)
- 표시 뉴스 수 설정
- 폼 유효성 검증

### NewsList.vue

뉴스 목록을 표시하는 컴포넌트

**Props:**
- `news` (Array) - 뉴스 배열
- `isLoading` (Boolean) - 로딩 상태
- `selectedKeyword` (String) - 선택된 키워드

**기능:**
- 뉴스 목록 표시
- 상대 시간 표시 (예: "5분 전")
- 설명 텍스트 자르기
- 원본 링크 제공

### App.vue

메인 애플리케이션 컴포넌트

**기능:**
- 구독 관리
- 뉴스 목록 표시
- 연결 상태 표시
- 서버 상태 모니터링

## Socket.io 이벤트

### 클라이언트 → 서버

```javascript
// 뉴스 구독
socket.emit('subscribe', {
  keyword: '인공지능',
  interval: '*/5 * * * *',
  display: 10
})

// 구독 취소
socket.emit('unsubscribe', {
  keyword: '인공지능',
  subscriptionId: 'sub_123'
})

// 캐시된 뉴스 요청
socket.emit('get-cached-news', {
  keyword: '인공지능'
})

// 서버 상태 요청
socket.emit('get-status')
```

### 서버 → 클라이언트

```javascript
// 새로운 뉴스 수신
socket.on('news', (data) => {
  console.log(data.keyword, data.news)
})

// 구독 확인
socket.on('subscribed', (data) => {
  console.log(data.keyword, data.subscriptionId)
})

// 구독 취소 확인
socket.on('unsubscribed', (data) => {
  console.log(data.keyword)
})

// 캐시된 뉴스
socket.on('cached-news', (data) => {
  console.log(data.keyword, data.news)
})

// 서버 상태
socket.on('status', (data) => {
  console.log(data.activeSubscriptions, data.memoryUsage)
})

// 에러
socket.on('error', (error) => {
  console.error(error.message)
})
```

## 기술 스택

- **Vue.js 3** - 프로그레시브 JavaScript 프레임워크
- **Vite** - 차세대 프론트엔드 빌드 도구
- **@tanstack/vue-query** - 서버 상태 관리 라이브러리
- **socket.io-client** - 실시간 양방향 통신
- **axios** - HTTP 클라이언트 (선택사항)

## 개발 팁

### Hot Module Replacement (HMR)

Vite는 자동으로 변경사항을 감지하고 즉시 반영합니다.

### DevTools 확장 프로그램

Vue DevTools를 사용하여 컴포넌트 상태를 디버깅할 수 있습니다:

```bash
npm install -g @vue/devtools
```

### 네트워크 디버깅

브라우저 개발자 도구의 Network/WebSocket 탭에서 Socket.io 통신을 모니터링할 수 있습니다.

## 문제 해결

### 연결 오류

1. 서버가 실행 중인지 확인: `npm run dev` (news-tracker 폴더에서)
2. `VITE_SOCKET_URL` 환경 변수가 올바른지 확인
3. 브라우저 콘솔에서 에러 메시지 확인

### 뉴스가 표시되지 않음

1. 키워드를 구독했는지 확인
2. 서버의 Naver News API 키가 올바르게 설정되어 있는지 확인
3. 브라우저 콘솔의 Socket.io 로그 확인

### 성능 최적화

- VueQuery의 캐싱 설정을 조정할 수 있습니다
- 큰 목록의 경우 virtual scrolling 고려
- 번들 크기 분석: `npm run build -- --analyze`

## 라이선스

MIT

## 참고 자료

- [Vue 3 공식 문서](https://vuejs.org/)
- [Vite 공식 문서](https://vitejs.dev/)
- [TanStack Query 공식 문서](https://tanstack.com/query/latest)
- [Socket.io 공식 문서](https://socket.io/)
