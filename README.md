# 온결 — 부산·경남 정적 SEO 사이트

첨부된 정적 HTML 사이트를 참고해 제작한 다중 랜딩 페이지 프로젝트입니다.

## 구성

- 총 28개 색인 대상 HTML 페이지 + 404 페이지
- 부산 16개 구·군 전용 랜딩 페이지
- 부산/경남 권역 필러 페이지
- 고독사 청소, 악취 제거, 유품정리, 특수 소독 서비스 클러스터
- 비용, 절차, 초기 대응 정보성 클러스터
- 고유 title/description/canonical/H1/FAQ/구조화 데이터
- 반응형 내비게이션, 모바일 상담 바, 접근성 기본 적용
- 네이버 소유확인 HTML 파일 미포함

## 빌드

```bash
node build.mjs
```

생성 결과는 `dist/`에 저장됩니다.

## 전화문의

- 업체명: 온결
- 대표 전화: 010-6769-9050
- 모든 페이지에서 큰 고정 전화 버튼과 `tel:` 바로 연결을 제공합니다.

## GitHub + Cloudflare Pages 배포

자세한 순서는 `CLOUDFLARE-PAGES.md`를 확인하세요.

- Build command: `npm run build`
- Build output directory: `dist`
- Node.js: 18 이상
- 환경 변수 `SITE_URL`: 실제 Pages 주소 또는 연결할 도메인
