# 🎨 Hair Omakase - AI 헤어 컨설팅 서비스 (v0.3.0)

사용자의 사진을 업로드하면 **AI가 얼굴형을 분석**하여 맞춤 헤어스타일을 추천하고, **가상 피팅**으로 결과를 미리 보여주는 서비스입니다.

---

## ✨ v0.3.0 주요 기능

| 기능 | 설명 |
|:---|:---|
| 🧠 **AI 얼굴 분석** | Gemini Vision으로 얼굴형, 피부톤, 현재 헤어 상태 분석 |
| 💇 **헤어스타일 추천** | 분석 결과 기반 맞춤형 스타일 추천 (성별 필터 지원) |
| 🖼️ **가상 피팅** | Gemini Image Generation으로 선택한 스타일 적용 시뮬레이션 |
| ⏰ **시간 변화** | 1개월/3개월/1년 후 머리 자람 시뮬레이션 (**NEW**) |
| 🔄 **다각도** | 앞/옆/뒤 4방향 이미지 생성 (**NEW**) |
| 📸 **포즈 (화보 컷)** | 스튜디오/야외/런웨이 배경 화보 생성 (**NEW**) |
| 🎀 **인생세컷** | 3장 선택 → 포토부스 스타일 합성 (**NEW**) |
| ↔️ **Before/After 슬라이더** | 원본과 결과를 직관적으로 비교 |
| ❤️ **My Style 보관함** | 마음에 드는 스타일 저장/관리 |
| 📥 **다운로드/공유** | 결과 이미지 바로 저장 및 SNS 공유 (카카오톡/인스타 준비중) |

---

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| **Backend** | FastAPI, Uvicorn, Pydantic |
| **AI** | Google Gemini API (`gemini-2.0-flash`, `imagen-3.0-generate-002`) |
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
    │   ├── components/     # 재사용 컴포넌트 (ComparisonSlider 등)
    │   ├── pages/          # 페이지 컴포넌트
    │   └── services/       # API 클라이언트
    ├── public/             # 정적 파일 (스타일 썸네일)
    └── package.json
```

---

## 🚀 Getting Started

### 1. Backend Setup

```bash
# Conda 가상환경 생성 (Python 3.12)
conda create -n mini-hair python=3.12 -y
conda activate mini-hair

# 백엔드 폴더로 이동 & 설치
cd backend
pip install -r requirements.txt

# 환경변수 설정
echo GOOGLE_API_KEY=your_gemini_api_key_here > .env

# 서버 실행 (로컬 네트워크 접근 허용)
uvicorn app.main:app --reload --host 0.0.0.0
```

- API 서버: `http://localhost:8000`
- Swagger 문서: `http://localhost:8000/docs`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

- 프론트엔드: `http://localhost:5173`

---

## 📝 Environment Variables

`backend/.env` 파일에 설정:

```ini
GOOGLE_API_KEY=your_gemini_api_key_here
```

> ⚠️ `.env` 파일은 절대 Git에 커밋하지 마세요!

---

## 🔑 API Key 발급

1. [Google AI Studio](https://aistudio.google.com/app/apikey)에서 API Key 발급
2. `.env` 파일에 `GOOGLE_API_KEY` 설정

---

## 📸 사용 방법

1. **사진 업로드** → 성별 필터(♀/♂) 선택 → AI 분석
2. **추천 스타일 선택** → 가상 피팅 진행
3. **Before/After 슬라이더**로 비교 → **❤️ 저장** 또는 **📥 다운로드/공유**

---

## 📄 License

This project is for educational purposes.
