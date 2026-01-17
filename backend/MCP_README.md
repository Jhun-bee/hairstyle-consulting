# Hair Omakase MCP Server

AI 헤어 컨설팅 서비스의 MCP 서버입니다.

## 실행 방법

### 로컬 테스트
```bash
conda activate mini-hair
cd backend
python mcp_server.py
```

### Docker 배포
```bash
docker build -t hair-omakase-mcp .
docker run -p 8080:8080 -e GOOGLE_API_KEY=your_key hair-omakase-mcp
```

## MCP Tools

| Tool | 설명 |
|------|------|
| `get_available_styles` | 헤어스타일 목록 조회 (50종) |
| `analyze_face` | AI 얼굴 분석 (얼굴형, 피부톤 등) |
| `recommend_styles` | 맞춤 스타일 추천 |
| `generate_hairstyle` | 가상 피팅 이미지 생성 |

## 환경변수

```
GOOGLE_API_KEY=your_gemini_api_key
```

## PlayMCP 등록

서버 배포 후 https://playmcp.kakao.com 에서 등록
