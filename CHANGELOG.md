# Changelog

All notable changes to **Hair Omakase** will be documented in this file.

---

## [v0.5.1] - 2026-01-06

### 🧹 Data Cleanup
- **중복 스타일 deduplication**: `styles.json`에서 괄호 `( )`가 포함된 중복 스타일(5종) 삭제
- 데이터 무결성 검증 완료

### 🌐 Network & Access
- **로컬 네트워크 이미지 로딩 완벽 지원**:
  - `vite.config.ts`: `/uploads`, `/results` 경로에 대한 프록시 설정 추가
  - **Hardcoded URL 제거**: 모든 프론트엔드 코드(`pages`, `components`, `api.ts`)에서 `window.location.hostname` 의존 로직 제거 및 **Relative Path**로 전환
  - 이제 외부 기기에서 접속해도(예: 192.168.0.x) 이미지가 깨지지 않음

### 🐛 Fixed
- 모바일/외부 접속 시 썸네일 및 결과 이미지 엑박(Broken Image) 현상 해결

## [v0.5.0] - 2026-01-05

### ✨ UI Overhaul
- **Quick Fitting 스타일 선택 UI 전면 개편**:
  - 3열 그리드 레이아웃 적용
  - 스타일별 썸네일 이미지 적용 (친구 repo 리소스 활용)
  - 카드형 디자인 및 텍스트 오버레이 적용
- **DATA**:
  - 남성/여성 헤어스타일 썸네일 이미지 보강 (`backend/uploads`)
  - `styles.json`: 이미지 URL 매핑 업데이트
- **UI/UX Enhancement**:
  - Comparison Slider: 슬라이더 극단 이동 시 해당 라벨(Before/After) 숨김 처리하여 이미지 가림 방지
- **Bug Fix**:
  - Omakase(Consultant) 결과 페이지 썸네일 엑박 문제 수정 (이미지 경로 처리 로직 추가)
  - Omakase 결과 화면에서 'Before(원본)' 이미지가 깨지는 문제 수정 (Blob URL 대신 서버 URL 사용)

---

## [v0.4.3] - 2026-01-05

### ✨ Added
- **Quick Fitting 결과 페이지**: 좋아요(❤️), 공유, 홈 버튼 추가
- **Quick Fitting 헤더**: My(❤️) + Home 버튼 (Omakase와 동일)
- localStorage에 좋아요한 스타일 저장 기능

### 🔧 Changed
- **이미지 생성 모델**: `gemini-2.0-flash-exp` → `gemini-2.5-flash-image` (Nano Banana)
- **액션 버튼 구성**: 다시하기(왼쪽) + 다운로드 + 공유 + 좋아요 (오른쪽) 순서로 배치 (하단 바 제거)
- "Next Step" → "Select Style" 버튼 텍스트 변경
- "Try Another" 경로: 업로드 → 스타일 선택 페이지로 수정
- 뒤로가기 버튼: 명확한 경로 지정 (step1→홈, step2→step1)
- URL 파라미터로 상태 복원 (step, imageId, gender, uploadedUrl)

### 🐛 Fixed
- **Quick Fitting 이미지 생성 오류**: 모델이 IMAGE modality 미지원 문제 해결
- Quick Fitting 이미지 경로 문제 (blob URL → backend URL)
- 파일 확장자 fallback 개선 (.png, .jpg, .jpeg, .webp)
- 에러 시 traceback 출력 추가

---

## [v0.4.2] - 2026-01-05

### 🐛 Fixed
- `main.py` 구문 오류 수정 (마크다운 코드블록 제거)

---

## [v0.4.1] - 2026-01-05

### 🖼️ Added
- **AI 썸네일 생성**: 여성 스타일 20종 + 남성 1종 AI 이미지 생성
- **트렌드 검증**: 2025-2026 실제 헤어 트렌드와 크로스체크 완료
- 트렌드 참고 자료 URL 목록 (walkthrough.md)

### 🔧 Changed
- 네비게이션 헤더: 컴팩트한 모드 전환 버튼으로 리팩토링
- 홈페이지에서 네비게이션 숨김 처리
- 랜딩 페이지 수직 중앙 정렬

### 🐛 Fixed
- Quick Fitting 스타일 목록 로딩 오류 (경로 수정)
- 네비게이션 버튼 z-index 클릭 이슈

---

## [v0.4.0] - 2026-01-04

### ✨ Added
- **Quick Fitting**: 분석 없이 원하는 스타일로 즉시 변신
- **통합 스타일 DB**: 남성 25종 + 여성 25종 (총 50종)
- `NavigationHeader.tsx`: 모드 전환 헤더 컴포넌트
- 레거시 스타일 프롬프트 고도화 (키워드 → 서술형)

### 🔧 Changed
- `gemini_client.py`: `gemini_client` alias 추가

---

## [v0.3.0] - 2026-01-02

### ✨ Added
- **시간 변화**: 1개월/3개월/1년 후 머리 자람 시뮬레이션
- **다각도**: 정면/왼쪽/오른쪽/뒷모습 4방향 이미지 생성
- **포즈 (화보 컷)**: 스튜디오/야외/런웨이 6종 고유 포즈
- **인생세컷**: 3장 선택 → 포토부스 스타일 합성
- `ImageActionButtons.tsx` 공통 액션 버튼 컴포넌트

### 🔧 Changed
- 포즈 이미지 5개 → 6개로 증가
- 액션 버튼 위치: 상단 → 하단 중앙
- 차홍 디자이너 정보 업데이트 (이미지, 카카오맵 링크)

### 🐛 Fixed
- 다각도 헤어 일관성 프롬프트 개선
- 인생세컷 한글 폰트 깨짐 (맑은고딕 적용)
- 인생세컷 버튼 아이콘 제거
- 이미지 경로 처리 (/results/, /uploads/)

### 🗑️ Removed
- 다각도 3D 큐브 뷰어 (v0.4.0에서 두상 모델로 재구현 예정)

---

## [v0.2.0] - 2026-01-01

### ✨ Added
- AI 얼굴 분석 (Gemini Vision)
- 헤어스타일 추천 (성별 필터)
- 가상 피팅 (Gemini Image Generation)
- Before/After 슬라이더
- My Style 보관함
- 이미지 다운로드/공유

---

## [v0.1.0] - 2025-12-31

### ✨ Initial Release
- 프로젝트 구조 설정
- FastAPI 백엔드 + React 프론트엔드
