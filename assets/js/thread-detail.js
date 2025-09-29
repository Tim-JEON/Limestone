const THREAD_STORAGE_KEY = 'superbThreads';
const THREAD_SELECTED_KEY = 'superbSelectedThread';
const COVER_OPTIONS = new Set(['arcade', 'pixel', 'boss', 'retro']);

const heroEl = document.querySelector('.detail-hero');
const badgeEl = document.querySelector('[data-thread-badge]');
const titleEl = document.querySelector('[data-thread-title]');
const authorEl = document.querySelector('[data-thread-author]');
const roleEl = document.querySelector('[data-thread-role]');
const timestampEl = document.querySelector('[data-thread-timestamp]');
const summaryEl = document.querySelector('[data-thread-summary]');
const contentEl = document.querySelector('[data-thread-content]');
const commentsEl = document.querySelector('[data-thread-comments]');
const highlightEl = document.querySelector('[data-thread-highlight]');
const tagsEl = document.querySelector('[data-thread-tags]');
const relatedEl = document.querySelector('[data-thread-related]');
const relatedWrapper = document.querySelector('[data-related-wrapper]');

const fallbackThreads = [
  {
    id: 'dungeon-notes',
    badge: '운영 노트',
    title: '던전나잇 운영 노트',
    author: '운영진 BRICK',
    role: '운영진',
    timestamp: '24시간 전',
    summary:
      '슈팅 챕터 3의 난이도 조절안을 공유합니다. 팬 피드백을 반영해 보스 패턴과 드랍 밸런스를 조정했어요. 베타 테스터 의견을 기다립니다.',
    content:
      '이번 패치에서는 초반 구간에서 난이도 급상승을 호소하던 의견을 반영해 스테이지 3의 미니 보스를 조정했습니다. 체력과 탄막 패턴을 재설계했으며, 하드 모드에는 신규 패턴을 추가해 도전 욕구를 유지하도록 했습니다. 추가 피드백은 댓글로 남겨주세요.',
    cover: 'arcade',
    tags: ['패치노트', '슈팅게임', '베타테스트'],
    stats: { comments: 42, highlight: '👍 128 추천' },
    createdAt: Date.parse('2025-09-18T09:00:00+09:00'),
  },
  {
    id: 'pixel-art',
    badge: '팬 포스트',
    title: '픽셀러스 팬아트 공모전',
    author: '팬 유키',
    role: '팬',
    timestamp: '2일 전',
    summary:
      '8비트 스타일로 리메이크한 보스 몬스터 샘플러 3종 공유합니다. PSD와 애니 프레임을 받아보고 싶은 분은 댓글로 이메일 남겨주세요.',
    content:
      '공모전 참가 방법과 타임라인을 정리했습니다. 원본 PSD 파일과 애니메이션 프레임 샘플을 공유하니 자유롭게 활용하고, 완성본은 10월 10일까지 업로드해주세요. 우승자에게는 한정 굿즈와 VIP 라운지 초대권을 드립니다.',
    cover: 'pixel',
    tags: ['팬아트', '픽셀아트', '굿즈제작'],
    stats: { comments: 67, highlight: '🔥 5,200 조회' },
    createdAt: Date.parse('2025-09-17T13:30:00+09:00'),
  },
  {
    id: 'boss-raid',
    badge: 'VIP 라운지',
    title: '보스 타임 – 속성 협업 레이드',
    author: 'VIP 멤버 제이',
    role: 'VIP',
    timestamp: '4일 전',
    summary:
      '길드 레이드용 보스 AI 루틴을 공유합니다. 팀별 스킬 콤비네이션을 실험해보고 클리어 로그를 남겨주세요. 상위 5팀에게 굿즈 지급!',
    content:
      '속성 상성 매트릭스를 기반으로 한 신규 협업 레이드 스크립트를 테스트 중입니다. 각 파티는 최소 두 가지 속성을 조합해야 하며, 페이즈 전환 시 랜덤 패턴을 대응해야 합니다. 공략 로그를 공유하면 운영진이 피드백을 제공할 예정입니다.',
    cover: 'boss',
    tags: ['레이드전략', '길드운영', '게임디자인'],
    stats: { comments: 29, highlight: '⭐ 4.8/5 피드백' },
    createdAt: Date.parse('2025-09-15T20:10:00+09:00'),
  },
];

document.addEventListener('DOMContentLoaded', () => {
  const { thread, collection } = resolveThread();
  if (!thread) {
    renderEmptyState();
    return;
  }

  renderThread(thread, collection);
});

function resolveThread() {
  const stored = loadStoredThreads();
  const collection = stored.length ? stored : fallbackThreads;

  const params = new URLSearchParams(window.location.search);
  let threadId = params.get('id');

  if (!threadId) {
    try {
      threadId = sessionStorage.getItem(THREAD_SELECTED_KEY) || undefined;
    } catch (error) {
      console.warn('Failed to read selected thread id', error);
    }
  }

  if (!threadId && collection.length) {
    threadId = collection[0].id;
  }

  const thread = collection.find((item) => item.id === threadId);
  return { thread, collection };
}

function loadStoredThreads() {
  try {
    const raw = sessionStorage.getItem(THREAD_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (error) {
    console.warn('Failed to load stored threads', error);
    return [];
  }
}

function renderThread(thread, collection) {
  document.title = `SUPER-B | ${thread.title}`;

  if (heroEl) {
    const cover = sanitizeCover(thread.cover);
    heroEl.setAttribute('data-cover', cover);
  }

  if (badgeEl) {
    badgeEl.textContent = thread.badge || '추천 토픽';
  }
  if (titleEl) {
    titleEl.textContent = thread.title;
  }
  if (authorEl) {
    authorEl.textContent = thread.author;
  }
  if (roleEl) {
    roleEl.textContent = thread.role || '역할 정보 없음';
  }
  if (timestampEl) {
    timestampEl.textContent = thread.timestamp || '방금 업데이트';
  }
  if (summaryEl) {
    summaryEl.textContent = thread.summary;
  }
  if (commentsEl) {
    const comments = Number.parseInt(thread.stats?.comments ?? 0, 10) || 0;
    commentsEl.textContent = `댓글 ${comments}개`;
  }
  if (highlightEl) {
    highlightEl.textContent = thread.stats?.highlight || '하이라이트 없음';
  }

  renderContent(thread.content || thread.summary);
  renderTags(thread.tags || []);
  renderRelated(collection, thread.id);
}

function renderContent(rawContent) {
  if (!contentEl) {
    return;
  }
  if (!rawContent) {
    contentEl.innerHTML = '<p>아직 본문 내용이 등록되지 않았습니다.</p>';
    return;
  }

  const paragraphs = rawContent.split(/\n{2,}/).filter(Boolean);
  if (!paragraphs.length) {
    contentEl.innerHTML = `<p>${escapeHtml(rawContent)}</p>`;
    return;
  }

  contentEl.innerHTML = paragraphs
    .map((para) => `<p>${escapeHtml(para.trim())}</p>`)
    .join('');
}

function renderTags(tags) {
  if (!tagsEl) {
    return;
  }
  if (!tags.length) {
    tagsEl.innerHTML = '<span>#community</span>';
    return;
  }

  tagsEl.innerHTML = tags
    .map((tag) => `
      <span>#${escapeHtml(tag.replace(/^#/, ''))}</span>
    `)
    .join('');
}

function renderRelated(collection, currentId) {
  if (!relatedEl || !relatedWrapper) {
    return;
  }

  const others = collection.filter((item) => item.id !== currentId).slice(0, 3);
  if (!others.length) {
    relatedWrapper.style.display = 'none';
    return;
  }

  relatedWrapper.style.display = '';
  relatedEl.innerHTML = others
    .map(
      (item) => `
        <a class="related-item" href="community-thread.html?id=${encodeURIComponent(item.id)}">
          <span>${escapeHtml(item.title)}</span>
          <span>${escapeHtml(item.timestamp || '')}</span>
        </a>
      `,
    )
    .join('');
}

function renderEmptyState() {
  if (!contentEl || !summaryEl) {
    return;
  }
  if (heroEl) {
    heroEl.setAttribute('data-cover', 'retro');
  }
  if (titleEl) {
    titleEl.textContent = '스레드를 찾을 수 없습니다';
  }
  if (badgeEl) {
    badgeEl.textContent = '알림';
  }
  summaryEl.textContent = '선택한 스레드가 존재하지 않거나 세션 정보가 만료되었습니다.';
  contentEl.innerHTML = `
    <div class="empty-state">
      <p>세션이 만료되었거나 직접 URL을 입력하신 경우일 수 있습니다.</p>
      <p><a href="community.html#board">커뮤니티 목록으로 돌아가 새로고침</a> 후 다시 시도해주세요.</p>
    </div>
  `;
  if (relatedWrapper) {
    relatedWrapper.style.display = 'none';
  }
}

function sanitizeCover(value) {
  const cover = value?.toString().trim() ?? 'arcade';
  return COVER_OPTIONS.has(cover) ? cover : 'arcade';
}

function escapeHtml(value) {
  return (value ?? '')
    .toString()
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
