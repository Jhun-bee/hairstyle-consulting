# 🎨 Hair Omakase - AI 헤어 컨설팅 서비스

사용자의 사진을 업로드하면 **AI가 얼굴형을 분석**하여 맞춤 헤어스타일을 추천하고, **가상 피팅**으로 결과를 미리 보여주는 서비스입니다.

## ✨ 주요 기능

1.  **AI 얼굴 분석**: Gemini Vision으로 얼굴형, 피부톤, 현재 헤어 상태 분석
2.  **헤어스타일 추천**: 분석 결과 기반 맞춤형 스타일 추천 + 상세 코멘트
3.  **가상 피팅**: Nano Banana (Gemini Image Generation)으로 선택한 스타일 적용 시뮬레이션

---

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| **Backend** | FastAPI, Uvicorn, Pydantic |
| **AI** | Google Gemini API (`gemini-3-flash-preview`, `gemini-2.5-flash-image`) |
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | TailwindCSS, Framer Motion |
| **Language** | Python 3.12, Node.js 18+ |

---

## 📂 Project Structure

```
miniproj-hair-consulting/
├── backend/                # FastAPI 백엔드 서버
│   ├── app/
│   │   ├── api/endpoints/  # API 라우터
│   │   ├── data/           # 스타일 데이터 (styles.json)
│   │   ├── services/       # Gemini 클라이언트
│   │   └── main.py
│   ├── uploads/            # 업로드된 이미지 (gitignore)
│   ├── results/            # 생성된 피팅 이미지 (gitignore)
│   └── requirements.txt
└── frontend/               # React 프론트엔드
    ├── src/
    │   ├── pages/          # 페이지 컴포넌트
    │   └── services/       # API 클라이언트
    ├── public/             # 정적 파일 (스타일 썸네일)
    └── package.json
```

---

## 🚀 Getting Started

### 1. Backend Setup (Conda)

```bash
# 1. Conda 가상환경 생성 (Python 3.12)
conda create -n mini-hair python=3.12 -y
conda activate mini-hair

# 2. 백엔드 폴더로 이동
cd backend

# 3. 의존성 설치
pip install -r requirements.txt

# 4. 환경변수 설정 (.env 파일 생성)
# Windows:
echo GOOGLE_API_KEY=your_gemini_api_key_here > .env
# Mac/Linux:
# echo "GOOGLE_API_KEY=your_gemini_api_key_here" > .env

# 5. 서버 실행
uvicorn app.main:app --reload
```

- API 서버: `http://localhost:8000`
- Swagger 문서: `http://localhost:8000/docs`

### 2. Frontend Setup

```bash
# 1. 프론트엔드 폴더로 이동
cd frontend

# 2. 의존성 설치
npm install

# 3. 개발 서버 실행
npm run dev
```

- 프론트엔드: `http://localhost:5173`

---

## 📝 Environment Variables

`backend/.env` 파일에 아래 변수를 설정하세요:

```ini
GOOGLE_API_KEY=your_gemini_api_key_here
```

> ⚠️ **주의**: `.env` 파일은 절대 Git에 커밋하지 마세요! (`.gitignore`에 포함됨)

---

## 🔑 API Key 발급

1. [Google AI Studio](https://aistudio.google.com/app/apikey)에서 API Key 발급
2. `.env` 파일에 `GOOGLE_API_KEY` 설정

---

## 📸 Demo

| 단계 | 설명 |
|:---:|:---|
| 1️⃣ | 사진 업로드 → AI 얼굴 분석 |
| 2️⃣ | 맞춤 헤어스타일 추천 |
| 3️⃣ | 가상 피팅으로 Before/After 확인 |

---

## 🤝 Acknowledgments

- [Google Gemini API](https://ai.google.dev/)
- [Nano Banana (Gemini Image Generation)](https://ai.google.dev/gemini-api/docs/image-generation)

---

## 📄 License

This project is for educational purposes.
