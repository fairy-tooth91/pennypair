# HISTORY_UI_DEPLOY_DETAILS - UI 개선 + 배포 상세 기록

---

## 세션 3: 앱 테스트 + UI 개선 + Vercel 배포 (2026-02-12)

### 🔍 Claude 판단 과정

**실작업 분석:**
- Write 도구: 2개 파일 생성 (ProfileBottomSheet.tsx, HISTORY 파일)
- Edit 도구: 10+ 파일 수정 (Layout, Settings, Transactions, i18n, vite.config, App.tsx 등)
- Bash 도구: npm run dev, npm run build (3회), gh-pages 배포, git commit/push, GitHub API 호출 (visibility 변경, Pages 활성화)
- WebSearch: 모바일 웹앱 UI/UX 트렌드 2026, Bottom Sheet 패턴, fintech 디자인
- 시스템 변경: GitHub 저장소 public 전환, GitHub Pages 활성화, Vercel 배포

**세션 분류**: ui + deploy (UI 개선 + 배포)

---

### 📋 작업 흐름

#### 1단계: 앱 테스트 환경 구성
- `npm run dev` → localhost:5174/pennypair/ (포트 5173 사용 중이라 5174)
- 사용자: 두 계정 회원가입 (woonyong0729@gmail.com, jtmsfws11@gmail.com)

#### 2단계: 로그인 이슈 디버깅

**문제**: "invalid login credentials" 에러

**원인 분석 과정:**
1. RLS로 인해 anon 키로 profiles 조회 불가 → 빈 배열 반환
2. Supabase "Confirm email" 기본 활성화 상태
3. 이메일 미인증 유저는 로그인 거부됨

**해결:**
1. Supabase 대시보드에서 "Confirm email" 비활성화
2. 기존 유저 삭제 (미인증 상태 해결 불가)
3. 새로 회원가입 → 정상 로그인

**사용자 질문 대응:**
- "이메일 인증에 별도 백엔드 필요?" → Supabase 기본 제공 (메일 발송 + 확인 링크 + 자동 인증), 추가 백엔드 불필요
- Email Templates, URL Configuration 설정만 필요

#### 3단계: 커플 연결
- profiles UUID 확인: RLS 때문에 API 조회 불가 → 사용자가 Supabase 대시보드에서 직접 확인
- couples INSERT + profiles 통화/언어 UPDATE: SQL Editor에서 실행 (사용자)
- woonyong: f55bd938 (KRW, ko) / maki: 0441e872 (JPY, ja)

#### 4단계: Profile Bottom Sheet 구현

**사용자 피드백:**
- "로그아웃이 설정에 있는 건 힘들다"
- "모바일 최적화되어 있고 웹 대응이 안 됨"
- "오른쪽 위 이름을 누르면 계정 정보, 닉네임 변경, 로그아웃이 보이면 좋겠다"

**트렌드 조사 (WebSearch):**
- 2026 모바일 웹앱: Bottom Sheet 패턴 대세 (토스, 카카오페이)
- 미니멀 헤더 + Bottom Navigation 유지
- Progressive Disclosure 원칙

**구현 결정:**
- 헤더 오른쪽: 텍스트 이름 → 이니셜 원형 아바타 (9x9, indigo-100)
- 클릭 시 Bottom Sheet: 프로필 정보 + 닉네임 변경 + 언어/통화 설정 + 로그아웃
- Settings 페이지: 로그아웃 버튼 제거, 상세 설정용으로 유지

**변경된 파일:**
- 신규: `ProfileBottomSheet.tsx` (Bottom Sheet 컴포넌트)
- 수정: `Layout.tsx` (이니셜 아바타 + profileOpen state)
- 수정: `Settings.tsx` (logout 제거)
- 수정: `index.css` (slide-up 애니메이션)
- 수정: `en/ko/ja.json` (profile.editName, languageSetting, currencySetting)

#### 5단계: FAB 버튼 위치 수정

**문제**: `fixed bottom-20 right-4` → 데스크톱에서 화면 맨 오른쪽으로 날아감

**해결:**
```
<div class="pointer-events-none fixed inset-x-0 bottom-20 z-10 mx-auto w-full max-w-lg px-4">
  <button class="pointer-events-auto ml-auto ...">+</button>
</div>
```
- 투명 컨테이너가 max-w-lg 센터에 고정
- 버튼은 그 안에서 ml-auto로 우측 정렬
- 모바일/데스크톱 동일하게 콘텐츠 영역 내 위치

#### 6단계: CLAUDE.md 개인 프로젝트 표기
- 다른 회사 프로젝트 CLAUDE.md 참고 (sa-install-dpkg, zt-tools 등)
- blockquote로 "Personal Project - 소속 회사와 무관" 표기

#### 7단계: GitHub Pages 배포 시도 + 실패

**시도 과정:**
1. `npm run build` + `npx gh-pages -d dist` → Published
2. 404 발생 → GitHub Pages 설정 미활성화
3. GitHub API로 Pages 활성화 (`POST /repos/.../pages`, source: gh-pages branch)
4. 재배포 → 로그인 실패
5. Supabase redirect URL 필요? → 이메일/비밀번호 로그인은 redirect 불필요
6. SPA 라우팅 문제: `/pennypair/login` 같은 경로를 GitHub Pages가 처리 못함

**사용자 피드백:**
- 404.html 리다이렉트 제안 → "임시방편 아니야? 나중에 서버 옮길 때 문제 생길 수 있다"
- 정석적인 해결책 요청

#### 8단계: Vercel 배포

**코드 수정 (GitHub Pages → Vercel):**
- `vite.config.ts`: `base: '/pennypair/'` 제거 (Vercel은 루트 경로)
- `App.tsx`: `basename="/pennypair"` 제거
- `index.html`: favicon 경로 `/pennypair/vite.svg` → `/vite.svg`

**배포 과정:**
1. 코드 변경 커밋 + push (한국어 커밋 메시지, 사용자 요청)
2. 저장소 Public 전환 (GitHub API: PATCH visibility)
3. 사용자가 Vercel 가입 (GitHub 연동, Hobby 플랜)
4. 사용자가 Vercel 대시보드에서 프로젝트 import
5. 환경변수 설정 (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
6. 배포 성공: https://pennypair.vercel.app

**CLAUDE.md 업데이트:**
- 배포 URL 추가
- 호스팅: Vercel (Hobby 플랜, 무료)

---

### 🧠 Claude 사고 과정 기록

**로그인 디버깅:**
- 처음에 Supabase redirect URL 문제로 판단 → 잘못된 안내
- 이메일/비밀번호 로그인은 redirect 불필요 → 사용자에게 정정 사과
- 실제 원인: Email Confirmation + 유저 미인증 상태

**배포 결정:**
- GitHub Pages의 근본적 한계 (정적 호스팅 → SPA 라우팅 미지원)
- 404.html 트릭은 표준이지만 사용자가 "정석적 해결" 원함
- Vercel 추천: SPA 기본 지원, 무료, 코드 변경 최소화, 향후 서버 이전 시 호환

**사용자 선호사항 파악:**
- 커밋 메시지: 한국어 (영어 거부)
- 해결책: 임시방편 싫어함, 정석적인 접근 선호
- 비용 민감: 무료 여부 반복 확인
