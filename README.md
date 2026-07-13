# reverse-backend

완성된 백엔드 코드를 거꾸로 분석해서 **역기획 API/정책 문서**를 자동 생성하는 Claude Code 스킬입니다. 특정 프레임워크에 종속되지 않고 어떤 백엔드 스택이든(Django / Flask / FastAPI / Express / NestJS / Spring / Rails / ASP.NET / Go 등) 동일한 절차로 API 엔드포인트·데이터 모델·인증/인가 정책·비즈니스 규칙·외부 연동·보안 이슈를 재구성합니다.

## 무엇을 만들어 주나요

- 🌐 **API 엔드포인트 맵** — 경로, HTTP 메서드, 핸들러, 근거 파일
- 🗄 **데이터 모델** — ORM/스키마 클래스와 정의 위치
- 🔒 **인증/인가 정책** — 실제로 활성화된 가드만 집계 (주석 처리된 죽은 코드 제외)
- 📜 **비즈니스 규칙 · 에러 응답 카탈로그**
- 🔌 **외부 연동 & 환경변수 인벤토리** (값이 아닌 변수명만)
- ⚠️ **보안 점검 (OWASP API Security Top 10 2023 매핑)** — 하드코딩 시크릿 노출, 가드 없는 쓰기 엔드포인트, BOLA/IDOR 등 권한 분기 누락
- 📛 **에러 응답 카탈로그 (RFC 9457 Problem Details 기준)** — 표준 준수 여부까지 판정

산출물은 **Markdown + HTML + PDF** 세 형식으로 나옵니다 (아래 [산출물 형식](#산출물-형식) 참조).

## 설치

이 저장소의 `.claude/skills/reverse-backend/` 디렉토리를 스킬로 인식시킵니다.

**방법 A — 프로젝트에 포함**

분석하려는 프로젝트 루트에 그대로 복사합니다.

```bash
cp -r reverse-backend-skill/.claude/skills/reverse-backend \
      /path/to/your-project/.claude/skills/
```

**방법 B — 전역 설치 (모든 프로젝트에서 사용)**

```bash
mkdir -p ~/.claude/skills
cp -r reverse-backend-skill/.claude/skills/reverse-backend ~/.claude/skills/
```

설치 후 Claude Code 세션에서 `/` 를 입력하면 목록에 `reverse-backend` 가 보입니다.

## 사용법

### 1. 슬래시 명령으로 실행

```
/reverse-backend <파일_또는_디렉토리_경로>
```

예시:

```
/reverse-backend ./src/api
/reverse-backend backend/app/main.py
/reverse-backend .
```

인자를 생략하면 현재 디렉토리(`.`) 전체를 분석합니다.

### 2. 자연어로 실행

명령을 외우지 않아도, 아래처럼 요청하면 스킬이 자동 실행됩니다.

- "이 백엔드 역기획 해줘"
- "서버 코드로 API 정책서 만들어줘"
- "엔드포인트 정리해줘"
- "이 폴더 백엔드 문서 뽑아줘"

## 동작 방식

| 단계 | 내용 |
|------|------|
| **Step 0** | 입력 경로·언어·프레임워크 식별 (매니페스트 기반) |
| **Step 1** | 코드에서 사실만 원자료로 추출 (엔드포인트/모델/가드/규칙/연동/시크릿 스캔) |
| **Step 2** | 의미 분석 — 정책 문장화, 보안 리스크 평가, 도메인 추론 |
| **Step 3** | 표준 목차로 정책 문서 구성 |
| **Step 4** | Markdown → HTML → PDF 렌더링 (Chromium 자동 탐색) |
| **Step 5** | 완료 요약 리포트 (발견 개수·경고·교차검증 필요 항목) |

## 안전 원칙

- 🚫 **시크릿 값은 절대 문서에 포함하지 않습니다.** 파일 경로와 패턴 종류만 보고합니다.
- 🔍 **주석 처리된 죽은 코드를 활성 동작으로 오인하지 않습니다.** 특히 인증 가드는 실제 활성 여부를 직접 확인합니다.
- 🏷 **이름만으로 기능을 단정하지 않습니다.** `worker`/`consumer` 같은 이름이라도 실제 로직을 읽어 확인합니다.
- 🏷 근거가 있으면 코드 위치를 명시하고, 불충분하면 `[추정]`, 코드에 없으면 `[정보 없음 — 별도 확인 필요]` 로 표기합니다.

## 산출물 형식

역기획 문서는 세 형식으로 생성됩니다. **Markdown이 정본**이고, 스킬에 포함된 스크립트가 이를 HTML·PDF로 변환합니다.

| 형식 | 생성 조건 | 용도 |
|------|-----------|------|
| `.md` | 항상 | 정본, git 커밋·수정용 |
| `.html` | 항상 (Node 필요) | 인쇄용 CSS 포함, self-contained |
| `.pdf` | Chromium/Chrome 발견 시 | 배포·공유용 (8쪽 예시) |

내부적으로 다음 스크립트를 사용합니다 (npm 패키지 의존성 없음):

```bash
# HTML + PDF 한 번에 (Chromium 자동 탐색)
node .claude/skills/reverse-backend/scripts/render.js report.md report "문서 제목"

# HTML만
node .claude/skills/reverse-backend/scripts/md2html.js report.md report.html "문서 제목"

# 렌더러 회귀 테스트 (변환기 수정 시 실행 권장)
node .claude/skills/reverse-backend/scripts/test.js
```

- **HTML 변환**: Node.js만 있으면 동작 (외부 패키지 불필요).
- **PDF 변환**: 헤드리스 Chromium/Chrome 필요. `CHROME_BIN`(최우선) → Playwright 캐시(`PLAYWRIGHT_BROWSERS_PATH`, `~/.cache/ms-playwright`) → OS 표준 경로(리눅스/mac/Windows) 순으로 자동 탐색합니다. 없으면 PDF는 건너뛰고 HTML을 브라우저에서 인쇄(Ctrl/Cmd+P)해 PDF로 저장할 수 있습니다.
- PDF는 `--headless=new` 모드로 렌더링됩니다(구 모드는 페이지네이션이 깨져 전체가 1페이지로 나오므로 사용 안 함).
- ⚠️ **CJK 폰트 전제**: PDF는 렌더 시점에 글리프가 박제되므로, `node:22-slim` 같은 **맨 CI 컨테이너에는 한글 폰트가 없어 PDF에서 한글이 □(두부)로 깨집니다.** 컨테이너에 CJK 폰트를 설치하세요 — 예: `apt-get install -y fonts-noto-cjk`. (HTML은 열람자 머신 폰트를 쓰므로 영향 없음.)

## 표준 근거

보안 점검과 에러 처리 판정은 공개 표준에 근거하며, 발견 항목마다 해당 표준 ID를 인용합니다.

- **OWASP API Security Top 10 – 2023** (API1:2023 ~ API10:2023) — <https://owasp.org/API-Security/editions/2023/en/0x11-t10/>
- **RFC 9457 — Problem Details for HTTP APIs** (RFC 7807 대체) — <https://www.rfc-editor.org/rfc/rfc9457.html>

이 두 표준은 대표 기준일 뿐 전부는 아니며, 인증 세부(OWASP ASVS)·취약점 분류(CWE) 등은 추가 대조가 필요할 수 있습니다.

## 한계

정적 코드 분석이므로 런타임 동적 라우트나 GraphQL 스키마 기반 API는 누락될 수 있습니다. 생성된 문서는 `[추정]` / `[정보 없음]` 표기를 기준으로 사람이 교차검증하는 것을 전제로 합니다.

## 라이선스

MIT
