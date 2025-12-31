# Hair Consulting AI (헤어 컨설팅 AI)

사용자의 사진을 업로드하여 얼굴형에 맞는 헤어스타일을 컨설팅해주고, AI로 합성된 결과를 보여주는 서비스입니다.

## 🛠 Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **AI Integration**: OpenAI API (LLM), Image Generation Model (Stub)
- **Library**: Uvicorn, Pydantic, Requests

### Frontend
- **Framework**: React + TypeScript (Vite)
- **Styling**: CSS Modules / Standard CSS
- **State/API**: Axios

---

## 📂 Project Structure

```bash
miniproj-hair-consulting/
├── backend/            # FastAPI 백엔드 서버
│   ├── app/            # 애플리케이션 코드
│   ├── uploads/        # 업로드된 이미지 저장소
│   └── results/        # 생성된 결과 이미지 저장소
└── frontend/           # React 프론트엔드
    ├── src/            # 리액트 소스 코드
    └── public/         # 정적 파일
```

---

## 🚀 Getting Started

프로젝트를 실행하기 위해 터미널을 **2개** 열어서 백엔드와 프론트엔드를 각각 실행해주세요.

### 1. Backend Setup

`backend` 폴더로 이동하여 의존성을 설치하고 서버를 실행합니다.

```bash
cd backend

# (선택사항) 가상환경 생성 및 실행
# python -m venv venv
# source venv/bin/activate  (Mac/Linux)
# venv\Scripts\activate     (Windows)

# 의존성 설치
pip install -r requirements.txt

# 서버 실행 (Live Reload 모드)
python -m uvicorn app.main:app --reload
```
* 서버 주소: `http://localhost:8000`
* API 문서(Swagger): `http://localhost:8000/docs`

### 2. Frontend Setup

`frontend` 폴더로 이동하여 의존성을 설치하고 개발 서버를 실행합니다.

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```
* Local 주소: `http://localhost:5173` (터미널에 뜨는 주소 확인)

---

## 📝 Configuration

### Environment Variables (.env)
필요한 경우 `backend/.env` 파일을 생성하여 환경 변수를 관리합니다. (현재는 기본 설정 `app/core/config.py` 사용)
```ini
# backend/.env 예시
OPENAI_API_KEY=sk-...
```

## 🤝 Contribution
* `main` 브랜치는 배포 가능한 상태를 유지합니다.
* 새로운 기능 개발 시 `feature/기능명` 브랜치를 생성하여 작업해주세요.
