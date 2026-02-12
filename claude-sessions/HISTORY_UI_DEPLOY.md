# HISTORY_UI_DEPLOY - UI 개선 + 배포

## 세션 3: 앱 테스트 + UI 개선 + Vercel 배포 (2026-02-12)

### 작업 요약
- Supabase 유저 가입 + 커플 연결 (SQL Editor 사용)
- 로그인 이슈 디버깅 (Email Confirmation 비활성화 + 유저 재생성)
- Profile Bottom Sheet 구현 (헤더 이니셜 아바타 → 계정 정보 + 설정 + 로그아웃)
- FAB 버튼 데스크톱 위치 수정 (콘텐츠 영역 내 고정)
- CLAUDE.md 개인 프로젝트 표기 추가
- GitHub Pages 배포 시도 → SPA 라우팅 문제로 Vercel 이전
- Vercel 배포 완료 (https://pennypair.vercel.app)

### 핵심 결정 사항
1. **로그아웃 위치**: Settings 페이지 → Profile Bottom Sheet로 이동 (2026 트렌드: Bottom Sheet 패턴)
2. **헤더 프로필**: 텍스트 이름 → 이니셜 원형 아바타 버튼 (모바일 친화적)
3. **호스팅**: GitHub Pages → Vercel (SPA 라우팅 기본 지원, 무료 Hobby 플랜)
4. **저장소 공개**: Private → Public (GitHub Pages 시도 과정에서 변경)

### 유저 정보
- woonyong: `f55bd938-d5a4-44cf-bb8b-df6226d2a0b2` (KRW, ko)
- maki: `0441e872-1c5b-4486-b88e-8e997a4d55de` (JPY, ja)
- 커플 연결: Supabase SQL Editor에서 수동 INSERT

### 변경된 파일
| 파일 | 변경 |
|------|------|
| `src/components/common/ProfileBottomSheet.tsx` | 신규 - Bottom Sheet 컴포넌트 |
| `src/components/common/Layout.tsx` | 이니셜 아바타 + Bottom Sheet 연결 |
| `src/pages/Settings.tsx` | 로그아웃 버튼 제거 |
| `src/pages/Transactions.tsx` | FAB 위치 수정 (콘텐츠 영역 내) |
| `src/index.css` | slide-up 애니메이션 추가 |
| `src/i18n/locales/*.json` | profile.* i18n 키 추가 |
| `vite.config.ts` | base path 제거 (Vercel용) |
| `src/App.tsx` | BrowserRouter basename 제거 |
| `index.html` | favicon 경로 수정 |
| `CLAUDE.md` | 개인 프로젝트 표기 + 배포 URL 추가 |
