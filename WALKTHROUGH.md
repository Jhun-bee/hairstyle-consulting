# Debugging Mobile Error & Navigation Support

## Overview
Addressed two critical issues:
1.  **500 Internal Server Error** on mobile devices during image generation.
2.  **Navigation Usability**: Closing modals or zoom views previously navigated away from the result page instead of returning to the previous view.

## Changes

### 1. Fix 500 Internal Server Error (Backend)
-   **File**: `backend/app/services/gemini_client.py`
-   **Issue**: Some mobile devices upload images in formats (like RGBA) that caused the Gemini API/Pillow processing to fail.
-   **Fix**: Forced conversion of input images to `RGB` format before processing in `generate_time_change`, `generate_multi_angle`, and `generate_pose`.

```python
# Before
original_img = Image.open(user_image_path)
original_img = ImageOps.exif_transpose(original_img)

# After
original_img = Image.open(user_image_path)
original_img = ImageOps.exif_transpose(original_img)
original_img = original_img.convert('RGB') # Fix for RGBA/Palette images
```

### 2. Navigation & History Management (Frontend)
-   **File**: `frontend/src/pages/ResultPage.tsx`
-   **Issue**: Browser back button was closing the entire page instead of just the open modal.
-   **Fix**: Implemented `window.history.pushState` when opening modals and `window.history.back()` logic for closing them. Added `popstate` event listener to handle back navigation gracefully.

### 3. Modal Specific Improvements
-   **Files**: 
    -   `frontend/src/components/TimeChangeModal.tsx`
    -   `frontend/src/components/MultiAngleModal.tsx`
    -   `frontend/src/components/PoseModal.tsx`
-   **Features**:
    -   **Zoom View History**: Opening a zoomed image now pushes a nested history state (e.g., `nested_timeChange_zoom`). Pressing back closes the zoom but keeps the modal open.
    -   **Lint Fixes**: Removed invalid `react-hot-toast` imports and replaced with standard alerts. Corrected unused `React` imports.

## Verification
-   **Mobile Generation**: Validated that image conversion prevents 500 errors.
-   **Navigation Flow**:
    1.  Open Result Page
    2.  Open Modal (e.g., Time Change) -> URL/History updates
    3.  Open Zoom View -> History updates
    4.  Press Back Button -> Zoom closes (Modal stays open)
    5.  Press Back Button -> Modal closes (Returns to Result Page)

## Debugging Advanced Generation & Release (v0.5.1 Final)

**Goal**: Resolve startup failures (`GOOGLE_API_KEY` issues) and fix advanced generation bugs (422/500 errors).

**Changes**:
1.  **Environment**: Fixed `GOOGLE_API_KEY` handling.
2.  **Navigation Improvements**:
    *   **Result Page Cache**: Updated `ResultPage.tsx` to store generated image URL in `history.state`. This prevents the API from re-generating the image when the user navigates back to the result page.
    *   **Modal History**: Standardized `history.pushState` usage across all modals.
3.  **Advanced Generation Fixes**:
    *   **422 Unprocessable Entity**: Removed unused `base_image_url` field from Pydantic schemas (`TimeChangeRequest`, `MultiAngleRequest`, `PoseRequest`) which was causing validation errors.
    *   **500 Internal Error**:
        *   Added `try-except` blocks inside generation loops to allow **partial success** (e.g., if checking 4 angles, 1 failure doesn't crash the whole request).
        *   Restored model to `gemini-2.5-flash-image` as requested by user.

**Verification**:
*   `npm run build` passes.
*   Advanced generation features tested:
    *   Time Change: Generates 3 images.
    *   Multi-Angle: Generates 4 images.
    *   Pose: Generates 6 images.
*   Partial failure scenarios handled gracefully.

**Version**: `v0.5.1`

---

## MCP Server Implementation (v0.6.0)

**Goal**: Kakao PlayMCP 공모전 출품을 위한 MCP 서버 구현

### 구현 내용

**새 파일들**:
- `backend/mcp_server.py` - FastMCP 기반 MCP 서버 (4개 Tools)
- `backend/Dockerfile` - 클라우드 배포용
- `backend/pyproject.toml` - 패키지 설정
- `backend/MCP_README.md` - MCP 가이드

**MCP Tools**:

| Tool | 기능 |
|------|------|
| `get_available_styles` | 헤어스타일 목록 조회 (50종) |
| `analyze_face` | AI 얼굴 분석 (얼굴형, 피부톤) |
| `recommend_styles` | 맞춤 스타일 3개 추천 |
| `generate_hairstyle` | 가상 피팅 이미지 생성 |

**의존성**:
- FastMCP v2.14.3 추가 (`requirements.txt`)

### Verification
- FastMCP 설치 완료
- MCP 서버 import 테스트 통과 (`from mcp_server import mcp`)

### 다음 단계
1. Railway/Render 배포
2. PlayMCP 개발자 콘솔 등록
3. 심사 요청 → 공모전 응모

**Version**: `v0.6.0`

---

## MCP Server Bug Fix & Presentation Mode (v0.6.16)

**Goal**: PlayMCP 연결 실패 버그 수정 + 발표 자료 페이지 복원

### 수정 내용

**버그 수정**:
- `backend/mcp_server.py` 337번 줄의 `list_tools()` 호출에서 `await` 제거  
  → `list_tools()`는 coroutine이 아니므로 await 불필요
- PlayMCP Stateless JSON-RPC 핸들러 안정화

**기능 복원**:
- `frontend/src/pages/PresentationPage.tsx` 복원 (발표용 슬라이드 8장)
- `frontend/src/App.tsx`에 Presentation Mode 라우팅 추가 (`/presentation`)

### Verification
- `tools/list` JSON-RPC 호출 정상 동작 확인
- Railway 배포 후 PlayMCP 등록 재시도 예정

**Version**: `v0.6.16`
