import { mkdir, rm, readFile, writeFile, copyFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const SITE_URL = process.env.SITE_URL || 'https://ongyeol-cleaning.pages.dev';
const BRAND = '온결';
const PHONE_DISPLAY = '010-6769-9050';
const PHONE_HREF = 'tel:01067699050';
const OUT = new URL('./dist/', import.meta.url).pathname;
const ROOT = new URL('./', import.meta.url).pathname;

const districts = [
  { slug: 'jung-gu', name: '중구', areas: '중앙동·남포동·영주동·보수동', nearby: ['seo-gu', 'dong-gu', 'yeongdo-gu'], character: '원도심의 노후 다세대와 상가 혼합 건물이 많아 좁은 계단, 주차, 반출 시간을 먼저 확인합니다.', focus: '원도심 좁은 계단과 상가 밀집 구간의 반출 동선' },
  { slug: 'seo-gu', name: '서구', areas: '암남동·남부민동·충무동·동대신동', nearby: ['jung-gu', 'saha-gu', 'yeongdo-gu'], character: '산복도로와 경사 주거지가 섞여 있어 차량 접근 지점과 계단 운반 범위를 사전에 나눠 봅니다.', focus: '산복도로·경사 주거지의 안전한 장비 이동' },
  { slug: 'dong-gu', name: '동구', areas: '초량동·수정동·범일동·좌천동', nearby: ['jung-gu', 'busanjin-gu', 'nam-gu'], character: '역세권 원룸부터 산복도로 주택까지 형태가 다양해 건물별 공용부 보호와 반출 경로를 세밀하게 잡습니다.', focus: '역세권 원룸과 산복도로 주택의 공용부 보호' },
  { slug: 'yeongdo-gu', name: '영도구', areas: '봉래동·동삼동·청학동·영선동', nearby: ['jung-gu', 'seo-gu', 'nam-gu'], character: '섬 지역 이동과 경사 도로 특성을 고려해 장비 반입, 폐기물 이동, 작업 종료 시간을 함께 계획합니다.', focus: '영도 진입·경사 동선에 맞춘 일괄 작업 계획' },
  { slug: 'busanjin-gu', name: '부산진구', areas: '부전동·전포동·양정동·개금동', nearby: ['dong-gu', 'dongnae-gu', 'sasang-gu'], character: '오피스텔과 다가구, 상업시설이 밀집해 엘리베이터 사용 협의와 이웃 노출 최소화가 중요합니다.', focus: '도심 오피스텔의 보안 동선과 엘리베이터 보양' },
  { slug: 'dongnae-gu', name: '동래구', areas: '온천동·명륜동·사직동·안락동', nearby: ['busanjin-gu', 'geumjeong-gu', 'yeonje-gu'], character: '대단지 아파트와 오래된 주택이 공존해 관리사무소 절차와 개별 주택의 진입 조건을 구분합니다.', focus: '아파트 관리 절차와 구축 주택 현장 구분' },
  { slug: 'nam-gu', name: '남구', areas: '대연동·용호동·문현동·감만동', nearby: ['dong-gu', 'suyeong-gu', 'busanjin-gu'], character: '고층 공동주택과 항만 인접 주거지가 섞여 있어 승강기 예약과 바람 영향을 받는 환기 계획을 함께 봅니다.', focus: '고층 공동주택의 승강기 예약과 환기 계획' },
  { slug: 'buk-gu', name: '북구', areas: '화명동·덕천동·만덕동·구포동', nearby: ['sasang-gu', 'geumjeong-gu', 'gangseo-gu'], character: '대단지와 구도심 주택가가 이어져 현장 유형에 따라 관리 동의, 계단 반출, 차량 대기 위치를 달리합니다.', focus: '대단지와 구도심 주택의 서로 다른 반출 조건' },
  { slug: 'haeundae-gu', name: '해운대구', areas: '우동·좌동·중동·반여동', nearby: ['suyeong-gu', 'gijang-gun', 'geumjeong-gu'], character: '고층 주거와 오피스텔이 많아 출입 등록, 보양 범위, 소음 가능 공정의 시간을 먼저 조율합니다.', focus: '고층 주거 출입 등록과 공용부 보양' },
  { slug: 'saha-gu', name: '사하구', areas: '하단동·괴정동·다대동·장림동', nearby: ['seo-gu', 'gangseo-gu', 'sasang-gu'], character: '해안 인접지와 오래된 주택, 산업 배후 주거지가 넓게 분포해 권역별 이동과 환기 조건을 살핍니다.', focus: '넓은 권역과 해안 인접지의 현장별 환기 조건' },
  { slug: 'geumjeong-gu', name: '금정구', areas: '장전동·구서동·부곡동·남산동', nearby: ['dongnae-gu', 'buk-gu', 'gijang-gun'], character: '대학가 원룸과 산자락 주택, 아파트가 섞여 있어 작은 공간의 악취 포집과 경사 진입을 각각 대비합니다.', focus: '대학가 원룸과 산자락 주택의 맞춤 장비 구성' },
  { slug: 'gangseo-gu', name: '강서구', areas: '명지동·신호동·대저동·녹산동', nearby: ['buk-gu', 'saha-gu', 'sasang-gu'], character: '신도시 공동주택과 외곽 단독주택 간 이동 거리가 커 현장 사진 확인과 장비 구성을 먼저 확정합니다.', focus: '신도시와 외곽 주택을 잇는 사전 장비 계획' },
  { slug: 'yeonje-gu', name: '연제구', areas: '연산동·거제동', nearby: ['dongnae-gu', 'busanjin-gu', 'suyeong-gu'], character: '중앙 생활권의 공동주택과 다가구 비중이 높아 이웃 동선과 겹치지 않는 반입·반출 계획을 세웁니다.', focus: '공동주택 밀집지의 이웃 노출 최소화' },
  { slug: 'suyeong-gu', name: '수영구', areas: '광안동·남천동·민락동·망미동', nearby: ['haeundae-gu', 'nam-gu', 'yeonje-gu'], character: '주거와 관광·상업 동선이 맞닿아 있어 혼잡 시간대를 피하고 환기 시 외부 노출을 줄이는 방식이 필요합니다.', focus: '주거·상업 혼합지의 혼잡 시간대 회피' },
  { slug: 'sasang-gu', name: '사상구', areas: '괘법동·주례동·모라동·학장동', nearby: ['busanjin-gu', 'buk-gu', 'gangseo-gu'], character: '산업지역 인접 주거와 오래된 다세대가 있어 먼지 유입을 통제하고 계단·복도를 꼼꼼히 보양합니다.', focus: '산업 배후 주거지의 먼지 통제와 공용부 보양' },
  { slug: 'gijang-gun', name: '기장군', areas: '정관읍·기장읍·일광읍·장안읍', nearby: ['haeundae-gu', 'geumjeong-gu', 'gangseo-gu'], character: '읍·면 사이 이동 범위가 넓고 공동주택과 전원형 주택이 공존해 현장별 진입로와 폐기물 이동을 확인합니다.', focus: '넓은 출장 범위와 전원형 주택 진입로 확인' },
];

const services = [
  { slug: 'unattended-death-cleaning', title: '고독사 현장 특수청소', short: '오염 범위 확인부터 오염물 분리, 세척·소독, 탈취, 마감 확인까지 한 흐름으로 진행합니다.', intent: '현장 복구 서비스', intro: '고독사 현장은 일반 청소처럼 눈에 보이는 부분만 닦아서는 해결되지 않습니다. 바닥재 아래, 벽체 접합부, 가구 틈처럼 오염이 스며든 경로를 확인하고 공정 순서를 정해야 합니다.' },
  { slug: 'odor-removal', title: '전문 악취 제거', short: '냄새의 원인을 먼저 제거한 뒤 공간 조건에 맞춰 세척, 흡착, 탈취, 환기를 조합합니다.', intent: '악취 원인 제거', intro: '향으로 냄새를 덮는 방식은 오래가지 않습니다. 오염원을 분리하고 다공성 자재의 흡착 상태를 확인한 뒤 공기와 표면을 나눠 처리합니다.' },
  { slug: 'estate-clearance', title: '유품정리·공간 비움', short: '보관·확인·폐기 대상을 의뢰인 기준에 따라 나누고, 중요한 물품은 별도로 확인합니다.', intent: '유품 분류 서비스', intro: '유품정리는 속도보다 기준이 중요합니다. 사진, 서류, 귀중품, 개인 기록처럼 확인이 필요한 물건을 먼저 분류하고 나머지 반출 순서를 정합니다.' },
  { slug: 'disinfection', title: '오염 구역 세척·소독', short: '오염 특성과 자재에 맞는 방식으로 표면 세척과 소독을 진행하고 교차 오염을 줄입니다.', intent: '전문 소독 서비스', intro: '소독제만 분사한다고 현장이 정리되지는 않습니다. 오염된 자재를 구분하고 세척 가능한 표면과 교체가 필요한 부분을 나눈 다음 단계별로 처리합니다.' },
];

const guides = [
  { slug: 'cost', title: '고독사 청소 비용은 어떻게 정해질까', short: '면적보다 오염 범위, 경과 시간, 자재 침투, 반출량, 작업 동선이 견적에 더 큰 영향을 줍니다.', intent: '비용 확인', sections: [
    ['정액표 하나로 결정하기 어려운 이유', '같은 원룸이라도 오염이 표면에 머물렀는지 바닥재 아래까지 스며들었는지에 따라 공정이 달라집니다. 현장 면적만으로 가격을 확정하면 필요한 철거, 폐기, 반복 탈취가 빠질 수 있습니다.'],
    ['견적 전 확인하는 다섯 가지', '오염 범위와 경과 시간, 폐기물 양, 엘리베이터·계단 등 반출 동선, 바닥·벽·가구 재질을 함께 봅니다. 현장 사진은 초기 범위를 좁히는 데 도움이 되지만 냄새와 하부 침투 상태는 방문 확인이 더 정확합니다.'],
    ['견적서에서 구분해 볼 항목', '폐기물 반출, 오염물 제거, 세척·소독, 탈취, 부분 철거와 복구 전 단계가 각각 포함되는지 확인하세요. 추가 공정이 생기는 조건과 작업 종료 기준도 미리 합의하는 편이 좋습니다.']
  ]},
  { slug: 'process', title: '고독사 청소 절차 6단계', short: '초기 상담부터 현장 통제, 분류, 오염 제거, 탈취·소독, 인계까지 실제 흐름을 정리했습니다.', intent: '절차 확인', sections: [
    ['1. 현장 정보와 접근 조건 확인', '주소, 주거 형태, 발견 시점, 경찰 또는 관리 주체의 현장 인계 여부, 엘리베이터와 주차 조건을 확인합니다. 출입이 가능한 상태인지 먼저 확인해야 불필요한 이동을 줄일 수 있습니다.'],
    ['2. 오염 범위와 반출량 파악', '보이는 흔적뿐 아니라 바닥재 접합부, 벽면, 가구 하부를 살펴 공정 범위를 정합니다. 유품과 폐기 대상은 의뢰인의 기준을 받아 분류합니다.'],
    ['3. 제거·세척·소독·탈취', '오염원을 제거한 뒤 표면 세척과 소독을 진행합니다. 냄새는 원인 자재와 공기 중 잔류를 나눠 처리하며 필요하면 반복 공정을 거칩니다.']
  ]},
  { slug: 'first-response', title: '현장 발견 후 먼저 해야 할 일', short: '직접 들어가거나 치우기 전에 관계 기관 확인, 출입 통제, 건물 관리 주체 연락 순서를 살펴보세요.', intent: '초기 대응', sections: [
    ['현장을 임의로 정리하지 마세요', '관계 기관의 확인과 인계가 끝나기 전에는 물건을 옮기거나 청소를 시작하지 않는 것이 좋습니다. 상황에 따라 필요한 절차가 달라질 수 있으므로 먼저 담당 기관의 안내를 따르세요.'],
    ['출입과 환기를 임의로 늘리지 마세요', '보호 장비 없이 들어가면 오염에 노출될 수 있고, 무리한 환기는 냄새가 공용부로 퍼질 수 있습니다. 문을 닫고 불필요한 출입을 줄인 뒤 전문가와 관리 주체에게 상황을 공유하세요.'],
    ['상담 전에 정리할 정보', '현장 주소와 주거 형태, 발견 시점, 출입 가능 여부, 엘리베이터·주차 조건, 유품 분류 필요 여부를 메모해 두면 상담이 빠릅니다. 가능한 범위에서 출입문 바깥과 공간 전체 사진을 준비하되 무리해서 촬영할 필요는 없습니다.']
  ]},
];

const favicon = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="#0b766f"/><path d="M18 35c9-2 13-8 15-18 8 7 12 15 9 23-3 8-13 11-20 6-4-3-6-7-4-11Z" fill="white"/><path d="M25 40c6-3 10-8 13-15" fill="none" stroke="#0d2f38" stroke-width="4" stroke-linecap="round"/></svg>')}`;

function href(path = '/') { return path; }
function absolute(path = '/') { return `${SITE_URL}${path}`; }
function findDistrict(slug) { return districts.find((d) => d.slug === slug); }

function escapeJson(data) { return JSON.stringify(data).replace(/</g, '\\u003c'); }

function head({ title, description, path, type = 'website', schema = [] }) {
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="format-detection" content="telephone=yes">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${absolute(path)}">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <meta property="og:locale" content="ko_KR">
  <meta property="og:type" content="${type}">
  <meta property="og:site_name" content="${BRAND}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${absolute(path)}">
  <meta name="twitter:card" content="summary">
  <link rel="icon" type="image/svg+xml" href="${favicon}">
  <link rel="stylesheet" href="/assets/site.css">
  ${schema.map((item) => `<script type="application/ld+json">${escapeJson(item)}</script>`).join('\n  ')}
</head>`;
}

function header(current = '') {
  const links = [
    ['/services/unattended-death-cleaning/', '고독사 청소', 'service'],
    ['/services/estate-clearance/', '유품정리', 'estate'],
    ['/regions/busan/', '부산 출장', 'busan'],
    ['/regions/gyeongnam/', '경남 출장', 'gyeongnam'],
    ['/guides/cost/', '비용 안내', 'guide'],
  ];
  return `<a class="skip-link" href="#main">본문으로 바로가기</a>
<header class="site-header">
  <div class="container header-inner">
    <a class="brand" href="/" aria-label="${BRAND} 홈">
      <span class="brand-mark" aria-hidden="true">온</span>
      <span>${BRAND}<small>BUSAN · GYEONGNAM</small></span>
    </a>
    <button class="menu-button" type="button" aria-label="메뉴 열기" aria-expanded="false"><span></span></button>
    <nav class="nav" aria-label="주요 메뉴">
      ${links.map(([url, label, key]) => `<a href="${url}"${current === key ? ' aria-current="page"' : ''}>${label}</a>`).join('')}
      <a class="header-cta" href="${PHONE_HREF}" aria-label="${BRAND} 전화문의 ${PHONE_DISPLAY}">전화문의</a>
    </nav>
  </div>
</header>`;
}

function footer() {
  return `<footer class="site-footer" id="contact">
  <div class="container">
    <div class="footer-grid">
      <div>
        <a class="brand" href="/"><span class="brand-mark" aria-hidden="true">온</span><span>${BRAND}</span></a>
        <p>부산 전 구·군과 경남권 현장을 대상으로 고독사 현장 특수청소, 유품정리, 오염 제거와 탈취 공정을 안내합니다. 고인의 존엄과 의뢰인의 사생활을 먼저 생각합니다.</p>
      </div>
      <div><h2>서비스</h2>${services.map((s) => `<a href="/services/${s.slug}/">${s.title}</a>`).join('')}</div>
      <div><h2>전화문의</h2><a href="${PHONE_HREF}">${PHONE_DISPLAY}</a><a href="/guides/first-response/">현장 초기 대응 보기</a><a href="/guides/cost/">비용 결정 기준 보기</a></div>
    </div>
    <div class="footer-bottom">© ${new Date().getFullYear()} ${BRAND}. 부산·경남 고독사 현장 특수청소.</div>
  </div>
</footer>
<a class="call-float" href="${PHONE_HREF}" aria-label="${BRAND}에 전화문의 ${PHONE_DISPLAY}">
  <span class="call-float-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="27" height="27"><path d="M6.6 10.8c1.7 3.3 3.3 4.9 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.2 1.2.4 2.4.7 3.7.7.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.7 21 3 13.3 3 3.8c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.7 3.7.1.4 0 .8-.2 1.1l-2.3 2.2Z" fill="currentColor"/></svg></span>
  <span class="call-float-copy"><small>지금 바로 전화문의</small><strong>${PHONE_DISPLAY}</strong></span>
</a>
<script src="/assets/site.js" defer></script>`;
}

function breadcrumb(items) {
  const list = [{ name: '홈', url: '/' }, ...items];
  const schema = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: list.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: absolute(item.url) })) };
  const html = `<nav class="breadcrumb container" aria-label="현재 위치"><ol>${list.map((item, i) => `<li>${i === list.length - 1 ? `<span aria-current="page">${item.name}</span>` : `<a href="${item.url}">${item.name}</a>`}</li>`).join('')}</ol></nav>`;
  return { html, schema };
}

function faq(items) {
  return `<div class="faq-list">${items.map(([q, a], i) => `<div class="faq-item${i === 0 ? ' open' : ''}"><button type="button" aria-expanded="${i === 0 ? 'true' : 'false'}">${q}</button><div class="faq-answer">${a}</div></div>`).join('')}</div>`;
}

function faqSchema(items) {
  return { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) };
}

function consultationCta(title = '현장 상황부터 차분히 확인하겠습니다') {
  return `<section class="section"><div class="container"><div class="cta-panel"><div><h2>${title}</h2><p>주소, 주거 형태, 출입 가능 여부, 유품 분류 필요 여부를 알려주시면 확인할 항목부터 정리해 드립니다.</p></div><a class="button" href="${PHONE_HREF}">지금 전화문의</a></div></div></section>`;
}

const organizationSchema = {
  '@context': 'https://schema.org', '@type': ['Organization', 'LocalBusiness'], name: BRAND, url: SITE_URL,
  areaServed: [{ '@type': 'AdministrativeArea', name: '부산광역시' }, { '@type': 'AdministrativeArea', name: '경상남도' }],
  telephone: PHONE_DISPLAY,
  knowsAbout: ['고독사 청소', '특수청소', '유품정리', '악취 제거', '오염 구역 소독']
};

function homePage() {
  const path = '/';
  const title = `부산·경남 특수청소 업체 | ${BRAND}`;
  const description = '부산 전 구·군과 경남권 출장. 고독사 현장 특수청소, 유품정리, 오염 제거, 소독과 탈취를 한 흐름으로 안내합니다.';
  return `${head({ title, description, path, schema: [organizationSchema] })}
<body>${header('')}
<main id="main">
  <section class="hero"><div class="container hero-grid">
    <div><p class="eyebrow">Respectful scene recovery</p><h1>남겨진 공간을<br><em>조용히, 제대로</em></h1><p class="hero-copy">부산 전 구·군과 경남권 현장을 방문합니다. 유품 분류부터 오염 제거, 세척·소독, 전문 탈취, 정돈까지 현장 상태에 맞춰 필요한 공정만 설명합니다.</p><div class="hero-actions"><a class="button button-primary" href="${PHONE_HREF}">전화문의 ${PHONE_DISPLAY}</a><a class="button button-secondary" href="/regions/busan/">부산 출장 지역 보기</a></div><ul class="hero-points"><li>사생활 보호 중심</li><li>현장별 공정 안내</li><li>부산·경남 출장</li></ul></div>
    <div class="hero-media"><img src="/assets/hero-team.webp" width="1600" height="900" alt="부산 아파트 현장 앞에서 전문 장비를 준비하는 특수청소 작업자" fetchpriority="high"><div class="hero-note"><strong>자극적인 설명 없이</strong><span>필요한 범위와 작업 순서를 먼저 알려드립니다.</span></div></div>
  </div></section>
  <section class="trust-strip"><div class="container trust-grid"><div class="trust-item"><b>현장 보호</b><span>공용부 보양과 출입 동선 확인</span></div><div class="trust-item"><b>유품 분류</b><span>보관·확인·폐기 기준 분리</span></div><div class="trust-item"><b>오염원 제거</b><span>표면 아래 침투 가능성 확인</span></div><div class="trust-item"><b>탈취·마감</b><span>원인 제거 후 반복 확인</span></div></div></section>
  <section class="section"><div class="container"><div class="section-head"><div><p class="eyebrow">Services</p><h2>현장에 필요한 공정을<br>따로, 또 함께</h2></div><p>모든 현장에 같은 패키지를 적용하지 않습니다. 오염 범위와 공간 상태, 의뢰인이 원하는 인계 수준에 맞춰 구성합니다.</p></div><div class="card-grid">${services.map((s, i) => `<a class="card" href="/services/${s.slug}/"><span class="card-number">0${i + 1}</span><h3>${s.title}</h3><p>${s.short}</p><span class="card-link">자세히 보기 →</span></a>`).join('')}</div></div></section>
  <section class="section section-soft"><div class="container process-grid"><img class="process-photo" src="/assets/process-sanitation.webp" width="1400" height="1050" alt="전문 장비로 실내 세척과 탈취 작업을 진행하는 특수청소 작업자" loading="lazy"><div><p class="eyebrow">Process</p><div class="section-head"><h2>보이는 흔적보다<br>원인부터 확인합니다</h2></div><div class="steps">${[['01','초기 확인','현장 인계 여부와 출입 조건, 주거 형태, 유품 분류 필요성을 확인합니다.'],['02','범위 진단','오염이 스며든 자재와 반출 대상을 나눠 작업 범위를 설명합니다.'],['03','제거·세척','오염원을 제거하고 공간과 자재에 맞춰 세척·소독을 진행합니다.'],['04','탈취·인계','원인 제거 후 잔류 냄새를 확인하고 정돈 상태를 함께 점검합니다.']].map(([n,t,p]) => `<div class="step"><b>${n}</b><div><h3>${t}</h3><p>${p}</p></div></div>`).join('')}</div></div></div></section>
  <section class="section section-dark"><div class="container"><div class="section-head"><div><p class="eyebrow">Coverage</p><h2>부산 16개 구·군<br>전 지역 출장</h2></div><p>지역명을 바꾼 복제 페이지가 아니라, 각 구·군의 주거 형태와 진입 조건을 반영한 안내 페이지로 연결합니다.</p></div><div class="region-panel"><strong>부산광역시</strong><div class="district-grid">${districts.map((d) => `<a class="district-link" href="/busan/${d.slug}/">${d.name} 고독사 청소</a>`).join('')}</div></div></div></section>
  <section class="section"><div class="container image-split"><div><p class="eyebrow">Handover</p><h2 style="margin:0;font-size:clamp(2rem,4vw,3.4rem);line-height:1.18;letter-spacing:-.05em">다시 들어갈 수 있는<br>공간을 목표로</h2><p style="color:var(--ink-soft)">작업이 끝났다는 말보다 실제로 무엇을 제거했고 어떤 부분을 확인해야 하는지 설명하는 것이 중요합니다. 철거나 복구가 추가로 필요한 부분도 숨기지 않고 구분합니다.</p><ul class="check-list"><li>보관할 유품과 확인이 필요한 물품 별도 분류</li><li>공용 복도와 엘리베이터 등 이동 구간 정리</li><li>잔류 냄새와 교체 필요 자재 확인</li></ul></div><img src="/assets/result-room.webp" width="1400" height="1050" alt="특수청소 후 깨끗하게 정돈되어 인계를 기다리는 원룸" loading="lazy"></div></section>
  <section class="section section-soft"><div class="container"><div class="section-head"><div><p class="eyebrow">Guides</p><h2>상담 전에 읽어볼 안내</h2></div><p>비용과 절차, 발견 직후 대응은 서비스 페이지와 분리해 정보 탐색 의도에 맞췄습니다.</p></div><div class="card-grid">${guides.map((g, i) => `<a class="card" href="/guides/${g.slug}/"><span class="card-number">G${i + 1}</span><h3>${g.title}</h3><p>${g.short}</p><span class="card-link">안내 읽기 →</span></a>`).join('')}</div></div></section>
  ${consultationCta()}
</main>${footer()}</body></html>`;
}

function regionPage(region) {
  const busan = region === 'busan';
  const name = busan ? '부산' : '경남';
  const path = `/regions/${region}/`;
  const title = `${name} 고독사 청소 출장 안내 | ${BRAND}`;
  const description = busan ? '부산 고독사 청소 출장 권역 안내. 16개 구·군별 주거 형태와 진입 조건을 고려해 유품정리, 오염 제거, 소독, 탈취를 진행합니다.' : '경남 고독사 청소 출장 안내. 창원, 김해, 양산, 거제, 진주 등 경남권 현장 조건을 확인해 필요한 특수청소 공정을 안내합니다.';
  const bc = breadcrumb([{ name: `${name} 출장`, url: path }]);
  const regionFaq = busan ? [
    ['부산 모든 구·군에 출장하나요?', '중구부터 기장군까지 부산 16개 구·군을 안내 범위로 두고 있습니다. 일정은 현장 위치와 작업 범위를 확인한 뒤 조율합니다.'],
    ['아파트 관리사무소 협의도 필요한가요?', '엘리베이터 보양, 차량 진입, 폐기물 이동 시간 등 건물 규정이 있는 경우 의뢰인 또는 관리 주체와 사전 확인이 필요합니다.'],
    ['구별로 작업 방식이 다른가요?', '핵심 공정은 같지만 주거 형태, 계단과 승강기, 주차, 공용부 노출 정도에 따라 장비와 반출 계획이 달라집니다.']
  ] : [
    ['경남 어디까지 출장하나요?', '창원, 김해, 양산, 거제, 진주를 비롯한 경남권을 대상으로 상담합니다. 정확한 일정은 이동 거리와 작업 범위를 함께 확인해 조율합니다.'],
    ['거리가 멀면 사진만으로 견적이 가능한가요?', '사진과 현장 정보로 예상 범위를 안내할 수 있지만 냄새와 자재 침투 상태는 방문 확인 후 달라질 수 있습니다.'],
    ['하루에 작업이 끝나나요?', '공간 크기보다 오염 범위, 반출량, 탈취 반복 여부가 작업 기간에 영향을 줍니다. 현장 확인 후 예상 일정을 설명합니다.']
  ];
  return `${head({ title, description, path, schema: [bc.schema, faqSchema(regionFaq)] })}<body>${header(busan ? 'busan' : 'gyeongnam')}${bc.html}<main id="main">
  <section class="article-hero"><div class="container article-hero-inner"><p class="eyebrow">${name} service area</p><h1>${name} 고독사 청소<br>출장 권역 안내</h1><p>${busan ? '도심 오피스텔, 산복도로 주택, 해안 인접 공동주택, 외곽 단독주택까지 부산은 구·군마다 작업 동선이 다릅니다.' : '도시 간 이동 거리와 공동주택·전원형 주택의 차이를 고려해 현장 정보와 필요한 장비를 먼저 확인합니다.'}</p><div class="article-meta"><span>사생활 보호</span><span>현장별 동선 확인</span><span>유품 분류·오염 제거·탈취</span></div></div></section>
  <section class="section"><div class="container content-layout"><article class="prose">
    <h2>지역보다 먼저 보는 것은 현장 조건입니다</h2><p>같은 ${name} 안에서도 원룸과 단독주택, 고층 아파트의 작업 조건은 크게 다릅니다. 엘리베이터 사용 가능 시간, 계단 폭, 차량 대기 위치, 공용부 보호 범위를 확인해 이웃에게 불필요하게 노출되지 않는 동선을 세웁니다.</p>
    <div class="info-box"><strong>상담 전에 준비하면 좋은 정보</strong>주소와 건물 형태, 현장 인계 여부, 출입 가능 시간, 엘리베이터 유무, 유품 분류 필요 여부를 알려주세요. 사진은 가능한 범위에서만 준비하셔도 됩니다.</div>
    ${busan ? `<h2>부산 16개 구·군 안내</h2><div class="district-cards">${districts.map((d) => `<a class="card" style="padding:20px" href="/busan/${d.slug}/"><h3>${d.name}</h3><p>${d.focus}</p></a>`).join('')}</div>` : `<h2>경남권 주요 출장 지역</h2><p>창원시, 김해시, 양산시, 거제시, 진주시, 통영시, 밀양시와 그 밖의 경남 지역을 상담합니다. 먼 지역일수록 현장 사진, 반출량, 출입 조건을 먼저 확인하면 장비 누락과 재방문 가능성을 줄일 수 있습니다.</p><div class="table-wrap"><table><thead><tr><th>권역</th><th>사전 확인 포인트</th></tr></thead><tbody><tr><td>창원·김해·양산</td><td>공동주택 관리 절차와 차량 진입</td></tr><tr><td>거제·통영</td><td>이동 시간과 해안 인접 환기 조건</td></tr><tr><td>진주·밀양 등</td><td>장거리 장비 구성과 반출 동선</td></tr></tbody></table></div>`}
    <h2>작업 범위는 이렇게 나눕니다</h2><p>유품 분류, 폐기 대상 반출, 오염원 제거, 세척·소독, 전문 탈취, 마감 확인을 구분합니다. 필요한 경우에만 부분 철거나 반복 탈취 가능성을 설명하며, 일반 정리만 필요한 구역과 오염 대응이 필요한 구역을 같은 방식으로 처리하지 않습니다.</p>
    <h2>자주 묻는 질문</h2>${faq(regionFaq)}
  </article>${sidebar()}</div></section>${consultationCta(`${name} 현장 조건부터 확인하겠습니다`)}</main>${footer()}</body></html>`;
}

function sidebar() {
  return `<aside class="sidebar" aria-label="관련 안내"><div class="sidebar-card"><h2>관련 서비스</h2>${services.map((s) => `<a href="/services/${s.slug}/">${s.title}</a>`).join('')}</div><div class="sidebar-card"><h2>준비 안내</h2>${guides.map((g) => `<a href="/guides/${g.slug}/">${g.title}</a>`).join('')}</div></aside>`;
}

function districtPage(d) {
  const path = `/busan/${d.slug}/`;
  const title = `${d.name} 고독사 청소·유품정리 출장 | ${BRAND}`;
  const description = `부산 ${d.name} 고독사 청소와 유품정리 출장 안내. ${d.areas} 등 지역 특성에 맞춰 오염 제거, 세척·소독, 악취 제거 동선을 계획합니다.`;
  const bc = breadcrumb([{ name: '부산 출장', url: '/regions/busan/' }, { name: d.name, url: path }]);
  const near = d.nearby.map(findDistrict);
  const localFaq = [
    [`${d.name} 어느 동까지 방문하나요?`, `${d.areas}을 포함한 ${d.name} 전 지역을 상담합니다. 정확한 일정은 주소와 현장 범위를 확인한 뒤 조율합니다.`],
    ['현장 사진만으로 비용을 알 수 있나요?', '사진으로 1차 범위를 확인할 수 있지만 냄새와 바닥재 하부 침투, 반출량은 방문 후 달라질 수 있습니다. 비용을 좌우하는 항목을 나눠 설명합니다.'],
    ['이웃에게 알려지지 않게 진행할 수 있나요?', '완전한 비공개를 보장한다고 말할 수는 없지만 복장과 장비 이동, 공용부 사용 시간을 조율해 불필요한 노출을 줄이는 방향으로 계획합니다.'],
  ];
  const serviceSchema = { '@context': 'https://schema.org', '@type': 'Service', name: `${d.name} 고독사 청소`, provider: { '@type': 'Organization', name: BRAND }, areaServed: { '@type': 'AdministrativeArea', name: `부산광역시 ${d.name}` }, serviceType: '고독사 현장 특수청소·유품정리·악취 제거' };
  return `${head({ title, description, path, schema: [bc.schema, serviceSchema, faqSchema(localFaq)] })}<body>${header('busan')}${bc.html}<main id="main">
  <section class="article-hero"><div class="container article-hero-inner"><p class="eyebrow">Busan · ${d.name}</p><h1>${d.name} 고독사 청소</h1><p>${d.character} ${d.areas}을 포함한 전 지역에서 현장 조건을 먼저 확인합니다.</p><div class="article-meta"><span>${d.focus}</span><span>유품정리</span><span>오염 제거·탈취</span></div></div></section>
  <section class="section"><div class="container content-layout"><article class="prose">
    <h2>${d.name} 현장은 무엇부터 확인할까요</h2><p>${d.name}에서는 ${d.focus}을 먼저 봅니다. 작업자와 장비가 드나드는 경로, 유품과 폐기 대상의 임시 분류 위치, 공용부 사용 조건을 정한 뒤 오염 구역을 구분합니다. 현장 규모가 작아도 계단 반출이나 주차 제한이 있으면 작업 순서가 달라질 수 있습니다.</p>
    <div class="info-box"><strong>${d.name} 주요 상담 지역</strong>${d.areas}. 여기에 적히지 않은 동도 ${d.name} 관내라면 상담할 수 있습니다. 현장 인계가 끝나고 출입 권한이 확인된 뒤 일정을 조율합니다.</div>
    <h2>유품정리와 오염 청소는 분리해서 봅니다</h2><p>사진, 문서, 귀중품처럼 의뢰인 확인이 필요한 물건은 먼저 구분합니다. 오염된 물건과 일반 생활 물품을 같은 방식으로 반출하지 않으며, 보관 대상이 섞이지 않도록 작업 전 기준을 정합니다. 자세한 분류 원칙은 <a href="/services/estate-clearance/" style="color:var(--teal-dark);font-weight:800">유품정리 안내</a>에서 확인할 수 있습니다.</p>
    <h2>냄새는 향이 아니라 원인을 제거합니다</h2><p>환기나 방향제만으로 사라지지 않는 냄새는 바닥재, 벽체 접합부, 가구 하부처럼 오염이 남은 지점을 다시 확인해야 합니다. 오염원 제거 후 세척과 흡착, 장비 탈취를 조합하고 공간을 닫은 뒤 잔류 여부를 확인합니다. <a href="/services/odor-removal/" style="color:var(--teal-dark);font-weight:800">악취 제거 공정</a>은 별도 페이지에서 상세히 설명합니다.</p>
    <h2>${d.name} 작업 전 확인표</h2><div class="table-wrap"><table><thead><tr><th>항목</th><th>확인 내용</th></tr></thead><tbody><tr><td>출입</td><td>현장 인계 여부, 출입 권한, 가능한 시간</td></tr><tr><td>동선</td><td>${d.focus}</td></tr><tr><td>분류</td><td>보관·확인·폐기 대상 기준</td></tr><tr><td>마감</td><td>잔류 냄새, 교체 자재, 추가 복구 필요 여부</td></tr></tbody></table></div>
    <h2>인접 지역 안내</h2><p>${d.name} 인근 현장도 같은 부산 권역 흐름으로 상담합니다.</p><div class="related-grid">${near.map((n) => `<a class="related-link" href="/busan/${n.slug}/"><b>${n.name} 고독사 청소</b><span>${n.focus}</span></a>`).join('')}</div>
    <h2>자주 묻는 질문</h2>${faq(localFaq)}
  </article>${sidebar()}</div></section>${consultationCta(`${d.name} 현장, 먼저 해야 할 일부터`)}</main>${footer()}</body></html>`;
}

function servicePage(s, index) {
  const path = `/services/${s.slug}/`;
  const title = `${s.title} | 부산·경남 출장 ${BRAND}`;
  const description = `${s.short} 부산 전 구·군과 경남권 출장 상담.`;
  const bc = breadcrumb([{ name: '서비스', url: '/services/' }, { name: s.title, url: path }]);
  const serviceFaq = [
    ['작업 범위는 어떻게 정하나요?', '현장 사진과 상담 내용으로 1차 범위를 확인하고, 오염 침투와 반출량, 공간 자재를 현장에서 살펴 필요한 공정을 구분합니다.'],
    ['일반 청소와 무엇이 다른가요?', '오염원 분리, 보호 장비, 교차 오염 통제, 자재 침투 확인, 전문 탈취처럼 일반 생활 청소에서 다루기 어려운 공정이 포함됩니다.'],
    ['부산 외 지역도 가능한가요?', '부산 16개 구·군과 경남권을 상담 범위로 두고 있습니다. 위치와 작업 범위를 확인한 뒤 일정을 조율합니다.']
  ];
  const bodies = [
    ['현장 확인', '오염 범위와 자재 침투, 유품과 폐기물의 양, 작업자 이동 경로를 확인합니다. 사진만으로 단정하지 않고 추가 공정이 필요한 조건을 설명합니다.'],
    ['분리와 보호', '오염 구역과 일반 구역을 나누고 공용부를 보양합니다. 보관할 물품이 있다면 작업 전에 별도 기준으로 분류합니다.'],
    ['공정과 마감', '원인 제거 후 세척·소독·탈취를 진행합니다. 작업이 끝난 뒤 잔류 냄새와 교체가 필요한 자재, 추가 복구 여부를 확인합니다.'],
  ];
  const serviceSchema = { '@context': 'https://schema.org', '@type': 'Service', name: s.title, description: s.short, provider: { '@type': 'Organization', name: BRAND }, areaServed: ['부산광역시', '경상남도'] };
  return `${head({ title, description, path, schema: [bc.schema, serviceSchema, faqSchema(serviceFaq)] })}<body>${header(index === 2 ? 'estate' : 'service')}${bc.html}<main id="main">
  <section class="article-hero"><div class="container article-hero-inner"><p class="eyebrow">Service · 0${index + 1}</p><h1>${s.title}</h1><p>${s.intro}</p><div class="article-meta"><span>${s.intent}</span><span>부산 전 구·군</span><span>경남권 출장</span></div></div></section>
  <section class="section"><div class="container content-layout"><article class="prose">
    <h2>이 서비스가 필요한 상황</h2><p>${s.short} 작업 전에는 현장 인계와 출입 권한이 확인되어야 하며, 의뢰인이 원하는 인계 수준과 보관할 물품 기준을 함께 정합니다.</p>
    <div class="info-box"><strong>한 가지 방식으로 모든 공간을 처리하지 않습니다</strong>원룸, 아파트, 단독주택은 자재와 환기, 반출 동선이 다릅니다. 눈에 보이는 흔적이 비슷해도 경과 시간과 침투 깊이에 따라 공정이 달라집니다.</div>
    <h2>진행 흐름</h2>${bodies.map(([t, p], i) => `<h3>${i + 1}. ${t}</h3><p>${p}</p>`).join('')}
    <h2>함께 확인하는 서비스</h2><div class="related-grid">${services.filter((x) => x.slug !== s.slug).map((x) => `<a class="related-link" href="/services/${x.slug}/"><b>${x.title}</b><span>${x.short}</span></a>`).join('')}</div>
    <h2>출장 권역</h2><p><a href="/regions/busan/" style="color:var(--teal-dark);font-weight:800">부산 전 구·군 안내</a>와 <a href="/regions/gyeongnam/" style="color:var(--teal-dark);font-weight:800">경남권 출장 안내</a>에서 지역별 확인 항목을 볼 수 있습니다. 부산 지역은 각 구·군 전용 페이지를 분리해 중복 키워드 경쟁을 줄였습니다.</p>
    <h2>자주 묻는 질문</h2>${faq(serviceFaq)}
  </article>${sidebar()}</div></section>${consultationCta(`${s.title}, 범위부터 확인하겠습니다`)}</main>${footer()}</body></html>`;
}

function serviceHubPage() {
  const path = '/services/';
  const title = `특수청소 서비스 안내 | ${BRAND}`;
  const description = '고독사 현장 특수청소, 전문 악취 제거, 유품정리, 오염 구역 세척·소독의 범위와 차이를 안내합니다.';
  const bc = breadcrumb([{ name: '서비스', url: path }]);
  return `${head({ title, description, path, schema: [bc.schema] })}<body>${header('service')}${bc.html}<main id="main">
  <section class="article-hero"><div class="container article-hero-inner"><p class="eyebrow">Service pillar</p><h1>특수청소 서비스 안내</h1><p>현장을 한 단어로 묶지 않고 유품 분류, 오염 제거, 세척·소독, 악취 제거를 각각 구분해 필요한 공정을 찾을 수 있도록 정리했습니다.</p></div></section>
  <section class="section"><div class="container"><div class="section-head"><div><p class="eyebrow">4 services</p><h2>상태에 맞는 서비스부터</h2></div><p>각 페이지는 상업적 서비스 의도를 맡고, 비용·절차 같은 정보성 검색은 별도 안내 페이지로 연결합니다.</p></div><div class="card-grid">${services.map((s, i) => `<a class="card" href="/services/${s.slug}/"><span class="card-number">0${i + 1}</span><h3>${s.title}</h3><p>${s.short}</p><span class="card-link">서비스 범위 보기 →</span></a>`).join('')}</div></div></section>
  <section class="section section-soft"><div class="container image-split"><img src="/assets/process-sanitation.webp" width="1400" height="1050" alt="오염 구역을 전문 장비로 세척하는 특수청소 작업자" loading="lazy"><div><p class="eyebrow">Choose by need</p><h2 style="margin:0;font-size:clamp(2rem,4vw,3.4rem);line-height:1.18;letter-spacing:-.05em">청소와 정리,<br>탈취는 같은 일이 아닙니다</h2><p>물건을 비우는 일, 오염원을 제거하는 일, 표면을 소독하는 일, 남은 냄새를 처리하는 일은 목적이 다릅니다. 견적에서도 각 범위가 어떻게 포함되는지 구분해 보는 편이 좋습니다.</p><a class="button button-secondary" href="/guides/cost/">비용 결정 기준 보기</a></div></div></section>
  ${consultationCta('필요한 서비스가 헷갈려도 괜찮습니다')}
  </main>${footer()}</body></html>`;
}

function guidePage(g) {
  const path = `/guides/${g.slug}/`;
  const title = `${g.title} | ${BRAND}`;
  const description = g.short;
  const bc = breadcrumb([{ name: '현장 안내', url: '/guides/' }, { name: g.title, url: path }]);
  const guideFaq = [
    ['사진을 꼭 보내야 하나요?', '필수는 아닙니다. 가능한 범위의 사진은 초기 상담에 도움이 되지만 보호 장비 없이 현장에 다시 들어가 촬영할 필요는 없습니다.'],
    ['현장에 바로 들어가도 되나요?', '관계 기관 확인과 현장 인계가 끝났는지 먼저 확인하세요. 인계 전 임의로 물건을 옮기거나 청소를 시작하지 않는 편이 좋습니다.'],
    ['상담할 때 무엇을 알려야 하나요?', '주소, 주거 형태, 발견 시점, 출입 가능 여부, 엘리베이터와 주차 조건, 유품 분류 필요 여부를 준비하면 좋습니다.']
  ];
  const articleSchema = { '@context': 'https://schema.org', '@type': 'Article', headline: g.title, description: g.short, author: { '@type': 'Organization', name: BRAND }, publisher: { '@type': 'Organization', name: BRAND }, mainEntityOfPage: absolute(path) };
  return `${head({ title, description, path, type: 'article', schema: [bc.schema, articleSchema, faqSchema(guideFaq)] })}<body>${header('guide')}${bc.html}<main id="main">
  <section class="article-hero"><div class="container article-hero-inner"><p class="eyebrow">Guide · ${g.intent}</p><h1>${g.title}</h1><p>${g.short}</p><div class="article-meta"><span>정보성 안내</span><span>부산·경남 공통</span><span>업데이트 ${new Date().getFullYear()}</span></div></div></section>
  <section class="section"><div class="container content-layout"><article class="prose">
    ${g.sections.map(([t, p]) => `<h2>${t}</h2><p>${p}</p>`).join('')}
    <div class="info-box"><strong>안전이 먼저입니다</strong>보호 장비 없이 현장에 들어가거나 강한 약품을 임의로 섞어 사용하지 마세요. 관계 기관의 확인과 현장 인계가 끝난 뒤 전문 업체와 범위를 상의하는 편이 안전합니다.</div>
    <h2>다음으로 확인할 내용</h2><div class="related-grid">${guides.filter((x) => x.slug !== g.slug).map((x) => `<a class="related-link" href="/guides/${x.slug}/"><b>${x.title}</b><span>${x.short}</span></a>`).join('')}<a class="related-link" href="/services/unattended-death-cleaning/"><b>고독사 현장 특수청소</b><span>실제 서비스 범위와 공정 보기</span></a></div>
    <h2>자주 묻는 질문</h2>${faq(guideFaq)}
  </article>${sidebar()}</div></section>${consultationCta('정보가 정리되지 않아도 괜찮습니다')}</main>${footer()}</body></html>`;
}

function guideHubPage() {
  const path = '/guides/';
  const title = `고독사 청소 준비 안내 | ${BRAND}`;
  const description = '고독사 청소 비용, 실제 작업 절차, 현장 발견 직후 해야 할 일을 정보 탐색 목적에 맞춰 정리했습니다.';
  const bc = breadcrumb([{ name: '현장 안내', url: path }]);
  return `${head({ title, description, path, type: 'article', schema: [bc.schema] })}<body>${header('guide')}${bc.html}<main id="main">
  <section class="article-hero"><div class="container article-hero-inner"><p class="eyebrow">Knowledge pillar</p><h1>고독사 청소 준비 안내</h1><p>지금 무엇을 해야 하는지, 비용은 무엇으로 달라지는지, 실제 작업은 어떤 순서로 진행되는지 필요한 질문부터 골라 확인하세요.</p></div></section>
  <section class="section"><div class="container"><div class="card-grid">${guides.map((g, i) => `<a class="card" href="/guides/${g.slug}/"><span class="card-number">G${i + 1}</span><h3>${g.title}</h3><p>${g.short}</p><span class="card-link">안내 읽기 →</span></a>`).join('')}</div><div class="info-box" style="margin-top:36px"><strong>급한 상황이라면</strong>관계 기관의 현장 확인과 인계가 끝났는지 먼저 확인하고, 보호 장비 없이 들어가거나 물건을 옮기지 마세요. <a href="/guides/first-response/" style="color:var(--teal-dark);font-weight:800">초기 대응 안내</a>에서 순서를 볼 수 있습니다.</div></div></section>
  ${consultationCta('상담 전에 무엇을 준비할지 알려드립니다')}
  </main>${footer()}</body></html>`;
}

async function writePage(path, html) {
  const target = path === '/' ? join(OUT, 'index.html') : join(OUT, path, 'index.html');
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, html);
}

async function build() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(join(OUT, 'assets'), { recursive: true });
  await copyFile(join(ROOT, 'assets/site.css'), join(OUT, 'assets/site.css'));
  await copyFile(join(ROOT, 'assets/site.js'), join(OUT, 'assets/site.js'));
  for (const asset of ['hero-team.webp', 'process-sanitation.webp', 'result-room.webp']) await copyFile(join(ROOT, 'assets', asset), join(OUT, 'assets', asset));

  const pages = [{ path: '/', html: homePage() }];
  pages.push({ path: '/regions/busan/', html: regionPage('busan') }, { path: '/regions/gyeongnam/', html: regionPage('gyeongnam') });
  districts.forEach((d) => pages.push({ path: `/busan/${d.slug}/`, html: districtPage(d) }));
  pages.push({ path: '/services/', html: serviceHubPage() });
  services.forEach((s, i) => pages.push({ path: `/services/${s.slug}/`, html: servicePage(s, i) }));
  pages.push({ path: '/guides/', html: guideHubPage() });
  guides.forEach((g) => pages.push({ path: `/guides/${g.slug}/`, html: guidePage(g) }));
  for (const page of pages) await writePage(page.path, page.html);

  const urls = pages.map((page) => `${SITE_URL}${page.path}`);
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${url}</loc><changefreq>${url === SITE_URL + '/' ? 'weekly' : 'monthly'}</changefreq><priority>${url === SITE_URL + '/' ? '1.0' : url.includes('/busan/') ? '0.8' : '0.7'}</priority></url>`).join('\n')}\n</urlset>\n`;
  await writeFile(join(OUT, 'sitemap.xml'), sitemap);
  await writeFile(join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
  await writeFile(join(OUT, '_headers'), `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n\n/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n`);
  await writeFile(join(OUT, '404.html'), `${head({ title: `페이지를 찾을 수 없습니다 | ${BRAND}`, description: '요청한 페이지를 찾을 수 없습니다.', path: '/404.html' })}<body>${header()}<main id="main"><section class="section"><div class="container" style="text-align:center"><p class="eyebrow">404</p><h1 style="font-size:clamp(2rem,6vw,4rem);margin:0 0 16px">페이지를 찾을 수 없습니다</h1><p>주소를 다시 확인하거나 출장 지역 안내로 이동해 주세요.</p><a class="button button-primary" href="/regions/busan/">부산 출장 지역 보기</a></div></section></main>${footer()}</body></html>`);
  console.log(`Built ${pages.length} indexed pages + 404`);
}

await build();
