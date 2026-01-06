# 🎨 Hair Omakase - 개발 워크스루

프로젝트 개발 과정을 버전별로 정리한 문서입니다.

---

## 🔧 v0.5.1 (2026-01-06) - Image Loading Fix & Cleanup

### Data Deduplication
- `styles.json` 정제 작업 수행
- 중복된 스타일 이름(괄호 포함 등) 제거하여 **데이터 일관성** 확보

### Network Access & Image Loading
- **문제점**: 로컬(localhost)에서는 이미지가 잘 나오나, 외부 기기(모바일 등) 접속 시 이미지 경로가 `localhost`를 가리켜 **엑박(Broken Image)** 발생
- **해결책**:
  - **Vite Proxy 확장**: `/uploads`, `/results` 경로도 백엔드로 포워딩하도록 설정 (`vite.config.ts`)
  - **Relative Path 전환**: 프론트엔드 코드 내 모든 하드코딩된 URL(`http://hostname:8000`) 제거 및 상대 경로(`/api/...`) 사용
- **결과**: 어떤 네트워크 환경에서도 이미지가 정상적으로 로딩됨 ✅

## 🚀 v0.5.0 (2026-01-05) - UI Overhaul

### UI/UX 전면 개편
- **Quick Fitting 스타일 선택 화면**
  - 기존 텍스트/아이콘 리스트 → **3열 이미지 그리드**로 변경
  - 친구 리포지토리 리소스 활용하여 고품질 썸네일 적용
  - 카드형 디자인 + 그라데이션 오버레이로 시인성 확보

---

## 🔧 v0.4.3 (2026-01-05)

### UI/UX 개선
- **Quick Fitting 헤더 통일**
  - My(❤️) + Home 버튼 추가 (Omakase와 동일)
- **Quick Fitting 결과 페이지 개선**
  - 좋아요(❤️) 버튼 + localStorage 저장
  - 공유 버튼 (Web Share API)
- 액션 버튼 구성: 다시하기(왼쪽) + 다운로드 + 공유 + 좋아요 (오른쪽) 순서 배치 (하단 바 제거)
- 버튼 텍스트: "Next Step" → "Select Style"
- "Try Another" → 스타일 선택 페이지로 이동
- 뒤로가기 버튼 경로 명확화

### 버그 수정
- **이미지 생성 모델 수정**: `gemini-2.0-flash-exp` → `gemini-2.5-flash-image`
  - 기존 모델이 IMAGE modality 미지원하여 오류 발생
- Before 이미지 로딩 문제: 업로드 시 정확한 URL/확장자 저장
- 이미지 경로: blob URL → backend URL
- 파일 확장자 fallback 개선
- URL 파라미터로 상태 복원 (uploadedUrl 추가)

---

## 🔧 v0.4.2 (2026-01-05) - Hotfix

### 버그 수정
- `main.py` 구문 오류 수정 (머지 충돌 해결 시 발생한 마크다운 코드블록 제거)

---

## 🚀 v0.4.1 (2026-01-05)

### AI 썸네일 생성
- **여성 스타일 20종** AI 이미지 생성 완료 (w_06 ~ w_25)
- **남성 스타일 1종** AI 이미지 생성 (m_01 댄디컷)
- `styles.json` 이미지 URL 업데이트

### 트렌드 검증
- 2025-2026 한국 헤어 트렌드 웹 검색 크로스체크 완료
- **결과: 현재 데이터가 실제 트렌드와 높은 일치율** ✅

### UI/UX 개선
- 네비게이션 헤더: 컴팩트한 모드 전환 버튼으로 리팩토링
- 홈페이지에서 네비게이션 숨김 처리
- 랜딩 페이지 수직 중앙 정렬

### 버그 수정
- Quick Fitting 스타일 목록 로딩 오류 (경로 수정)
- 네비게이션 버튼 z-index 클릭 이슈

---

## 🚀 v0.4.0 (2026-01-04)

### Quick Fitting 기능 추가
- 분석 없이 원하는 스타일로 즉시 변신
- `QuickFittingPage.tsx`, `QuickResultPage.tsx` 구현
- `quick_styles.py`, `quick_generate.py`, `quick_upload.py` API 추가

### 통합 스타일 DB
- 남성 25종 + 여성 25종 (총 50종)
- 기존 Omakase 스타일 + 최신 트렌드 스타일 병합
- `styles.json` 통합 완료

### NavigationHeader 컴포넌트
- AI Omakase ↔ Quick Fitting 모드 전환
- `App.tsx`에 통합

### 프롬프트 고도화
- 레거시 스타일 프롬프트: 키워드 → 서술형으로 업그레이드
- 더 자연스러운 AI 생성 결과

---

## 🚀 v0.3.0 (2026-01-02)

### 🆕 새 기능
- **시간 변화**: 1개월/3개월/1년 후 머리 자람 시뮬레이션
- **다각도**: 정면/왼쪽/오른쪽/뒷모습 4방향 이미지 생성
- **포즈 (화보 컷)**: 스튜디오/야외/런웨이 6종 고유 포즈
- **인생세컷**: 3장 선택 → 포토부스 스타일 합성
- `ImageActionButtons.tsx` 공통 액션 버튼 컴포넌트

### 개선
- 포즈 이미지 5개 → 6개로 증가
- 액션 버튼 위치: 상단 → 하단 중앙
- 차홍 디자이너 정보 업데이트 (이미지, 카카오맵 링크)

### 버그 수정
- 다각도 헤어 일관성 프롬프트 개선
- 인생세컷 한글 폰트 깨짐 (맑은고딕 적용)
- 이미지 경로 처리 (/results/, /uploads/)

---

## 🚀 v0.2.0 (2026-01-01)

### 핵심 기능 구현
- **AI 얼굴 분석** (Gemini Vision)
- **헤어스타일 추천** (성별 필터)
- **가상 피팅** (Gemini Image Generation)
- **Before/After 슬라이더**
- **My Style 보관함**
- **이미지 다운로드/공유**

---

## 🚀 v0.1.0 (2025-12-31)

### 초기 설정
- 프로젝트 구조 설정
- FastAPI 백엔드 + React 프론트엔드
- Gemini API 연동

---

## 📚 트렌드 검증 참고 자료

### 한국어
| 사이트 | URL |
|---|---|
| 올라프스킨 | https://olafskin.com |
| 비주얼아카데미 | https://visualacademy.co.kr |
| 마리끌레르 코리아 | https://marieclairekorea.com |
| 얼루어 코리아 | https://allurekorea.com |
| 하퍼스바자 코리아 | https://harpersbazaar.co.kr |

### 영어 (글로벌 K-Beauty)
| 사이트 | URL |
|---|---|
| Creatrip | https://creatrip.com |
| GoguMa Cider | https://gogumacider.com |
| SuperKos | https://superkos.co |
| Gatsby SG (남성) | https://gatsby.sg |

### YouTube
- 차홍 CHAHONG
- 준오헤어 JUNO HAIR
