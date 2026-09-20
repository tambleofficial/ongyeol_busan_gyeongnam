# GitHub → Cloudflare Pages 배포

이 ZIP은 별도 패키지 설치 없이 바로 빌드되는 정적 사이트입니다.

## 1. GitHub에 올리기

1. GitHub에서 새 저장소를 만듭니다.
2. ZIP을 풀고, 폴더 안의 파일 전체를 저장소 루트에 업로드합니다.
3. `build.mjs`, `package.json`, `assets`, `dist`가 저장소 첫 화면에 보이면 정상입니다.

## 2. Cloudflare Pages 연결

1. Cloudflare 대시보드에서 **Workers & Pages → Create → Pages → Connect to Git**을 선택합니다.
2. 위 GitHub 저장소를 선택합니다.
3. 아래 값으로 설정합니다.

| 설정 | 값 |
|---|---|
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | 비워 둠 |

4. 환경 변수에 `SITE_URL`을 추가합니다. 값은 Cloudflare가 부여한 `https://프로젝트명.pages.dev` 또는 연결할 실제 도메인입니다.
5. **Save and Deploy**를 누릅니다.

## 3. 첫 배포 후 canonical 주소 확인

처음에는 Pages 주소를 미리 모를 수 있습니다. 첫 배포로 주소를 확인한 다음 `SITE_URL` 환경 변수를 실제 주소로 설정하고 한 번 더 배포하면 canonical, Open Graph URL, sitemap.xml이 모두 실제 주소로 생성됩니다.

## 배포 결과

- 첫 화면: `/`
- 부산 권역 필러: `/regions/busan/`
- 부산 16개 구·군: `/busan/각-지역/`
- 사이트맵: `/sitemap.xml`
- 전화문의: `010-6769-9050`
