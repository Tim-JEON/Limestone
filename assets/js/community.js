const threadListEl = document.getElementById('threadList');
const threadForm = document.getElementById('threadForm');
const statusBar = document.getElementById('statusBar');
const heroTitleEl = document.querySelector('[data-hero-title]');
const heroSummaryEl = document.querySelector('[data-hero-summary]');
const heroBadgeEl = document.querySelector('[data-hero-badge]');
const threadCountEl = document.querySelector('[data-thread-count]');
const sortNewestBtn = document.getElementById('sortNewest');
const modal = document.getElementById('threadModal');
const openModalButtons = document.querySelectorAll('[data-open-modal]');
const modalCloseTriggers = document.querySelectorAll('[data-modal-close]');
const bodyEl = document.body;

const COVER_OPTIONS = new Set(['arcade', 'pixel', 'boss', 'retro']);
const THREAD_STORAGE_KEY = 'superbThreads';
const THREAD_SELECTED_KEY = 'superbSelectedThread';

let lastFocusedElement = null;

const threads = [
  {
    id: 'dungeon-notes',
    badge: '운영 노트',
    title: '던전나잇 운영 노트',
    author: '운영진 BRICK',
    role: '운영진',
    timestamp: '24시간 전',
    summary:
      '슈팅 챕터 3의 난이도 조절안을 공유합니다. 팬 피드백을 반영해 보스 패턴과 드랍 밸런스를 조정했어요. 베타 테스터 의견을 기다립니다.',
    cover: 'arcade',
    tags: ['패치노트', '슈팅게임', '베타테스트'],
    content:
      '이번 패치에서는 초반 구간에서 난이도 급상승을 호소하던 의견을 반영해 스테이지 3의 미니 보스를 조정했습니다. 체력과 탄막 패턴을 재설계했으며, 하드 모드에는 신규 패턴을 추가해 도전 욕구를 유지하도록 했습니다. 추가 피드백은 댓글로 남겨주세요.',
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
    cover: 'pixel',
    tags: ['팬아트', '픽셀아트', '굿즈제작'],
    content:
      '공모전 참가 방법과 타임라인을 정리했습니다. 원본 PSD 파일과 애니메이션 프레임 샘플을 공유하니 자유롭게 활용하고, 완성본은 10월 10일까지 업로드해주세요. 우승자에게는 한정 굿즈와 VIP 라운지 초대권을 드립니다.',
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
    cover: 'boss',
    tags: ['레이드전략', '길드운영', '게임디자인'],
    content:
      '속성 상성 매트릭스를 기반으로 한 신규 협업 레이드 스크립트를 테스트 중입니다. 각 파티는 최소 두 가지 속성을 조합해야 하며, 페이즈 전환 시 랜덤 패턴을 대응해야 합니다. 공략 로그를 공유하면 운영진이 피드백을 제공할 예정입니다.',
    stats: { comments: 29, highlight: '⭐ 4.8/5 피드백' },
    createdAt: Date.parse('2025-09-15T20:10:00+09:00'),
  },
];

document.addEventListener('DOMContentLoaded', () => {
  sortThreadsByLatest();
  renderThreads();
  wireEvents();
});

function wireEvents() {
  if (threadForm) {
    threadForm.addEventListener('submit', handleThreadSubmit);
  }

  if (sortNewestBtn) {
    sortNewestBtn.addEventListener('click', () => {
      sortThreadsByLatest();
      renderThreads();
      flashStatus('최신 순으로 정렬했어요.');
    });
  }

  if (threadListEl) {
    threadListEl.addEventListener('click', handleThreadClick);
  }

  openModalButtons.forEach((button) => {
    button.addEventListener('click', () => openModal(button));
  });

  modalCloseTriggers.forEach((trigger) => {
    trigger.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isModalOpen()) {
      closeModal();
    }
  });
}

function handleThreadSubmit(event) {
  event.preventDefault();
  const formData = new FormData(threadForm);

  const title = formData.get('title')?.toString().trim() ?? '';
  const author = formData.get('author')?.toString().trim() ?? '';
  const role = formData.get('role')?.toString().trim() ?? '';
  const badge = formData.get('badge')?.toString().trim() ?? '';
  const summary = formData.get('summary')?.toString().trim() ?? '';
  const content = formData.get('content')?.toString().trim() ?? '';
  const tagsInput = formData.get('tags')?.toString() ?? '';
  const cover = sanitizeCover(formData.get('cover'));
  const commentsRaw = formData.get('comments');
  const highlight = formData.get('highlight')?.toString().trim() ?? '';

  if (!title || !author || !summary) {
    flashStatus('필수 항목을 모두 입력해주세요.', true);
    return;
  }

  const comments = Number.parseInt(commentsRaw ?? '0', 10);
  const tags = tagsInput
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

  const now = Date.now();

  const newThread = {
    id: `thread-${now}`,
    badge,
    title,
    author,
    role,
    timestamp: '방금 전',
    summary,
    content: content || summary,
    cover,
    tags,
    stats: {
      comments: Number.isNaN(comments) ? 0 : Math.max(comments, 0),
      highlight,
    },
    createdAt: now,
  };

  threads.push(newThread);
  sortThreadsByLatest();
  renderThreads();
  threadForm.reset();
  if (threadForm.comments) {
    threadForm.comments.value = '0';
  }
  if (threadForm.cover) {
    threadForm.cover.value = 'arcade';
  }
  if (threadForm.title) {
    threadForm.title.focus();
  }
  flashStatus('새 포럼 스레드를 추가했어요.');
}

function renderThreads() {
  if (!threadListEl) {
    return;
  }

  if (!threads.length) {
    threadListEl.innerHTML = '<p>등록된 스레드가 없습니다.</p>';
    updateThreadCount();
    updateHero();
    return;
  }

  const cardsHtml = threads.map((thread) => createThreadCard(thread)).join('');
  threadListEl.innerHTML = cardsHtml;
  updateThreadCount();
  updateHero();
  persistThreads();
}

function createThreadCard(thread) {
  const badge = thread.badge ? `<span class="thread-badge">${escapeHtml(thread.badge)}</span>` : '';
  const tags = thread.tags?.length
    ? `<div class="thread-tags">${thread.tags
        .map((tag) => `<span>#${escapeHtml(tag.replace(/^#/, ''))}</span>`)
        .join('')}</div>`
    : '';

  const highlight = thread.stats?.highlight
    ? `<span>${escapeHtml(thread.stats.highlight)}</span>`
    : '';

  const rawComments = Number.parseInt(thread.stats?.comments ?? 0, 10);
  const comments = Number.isFinite(rawComments) ? rawComments : 0;

  return `
    <a class="thread-card" href="community-thread.html?id=${encodeURIComponent(thread.id)}" data-thread-id="${escapeAttr(thread.id)}">
      <div class="thread-top">
        <div class="thread-avatar">${escapeHtml(createAvatar(thread.author))}</div>
        <div class="thread-info">
          <strong>${escapeHtml(thread.title)}</strong>
          <span>${escapeHtml(thread.author)}${thread.role ? ` · ${escapeHtml(thread.role)}` : ''} · ${escapeHtml(thread.timestamp)}</span>
        </div>
        ${badge}
      </div>
      <div class="thread-preview">
        <div class="thread-cover" data-cover="${escapeAttr(thread.cover)}"></div>
        <p>${escapeHtml(thread.summary)}</p>
      </div>
      ${tags}
      <div class="thread-meta">
        <span>💬 ${comments} 댓글</span>
        ${highlight}
      </div>
    </a>
  `;
}

function updateThreadCount() {
  if (!threadCountEl) {
    return;
  }
  threadCountEl.textContent = threads.length.toString();
}

function updateHero() {
  if (!threads.length) {
    return;
  }

  const feature = threads[0];
  if (heroTitleEl) {
    heroTitleEl.textContent = feature.title;
  }
  if (heroSummaryEl) {
    heroSummaryEl.textContent = feature.summary;
  }
  if (heroBadgeEl) {
    heroBadgeEl.textContent = feature.badge || '추천 토픽';
  }
}

function sortThreadsByLatest() {
  threads.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

function sanitizeCover(value) {
  const cover = value?.toString().trim() ?? 'arcade';
  return COVER_OPTIONS.has(cover) ? cover : 'arcade';
}

function createAvatar(author) {
  const name = author?.toString().trim();
  if (!name) {
    return 'SB';
  }
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  const firstTwo = name.slice(0, 2);
  return firstTwo.toUpperCase();
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

function escapeAttr(value) {
  return escapeHtml(value).replace(/"/g, '&quot;');
}

let statusTimeoutId;

function flashStatus(message, isError = false) {
  if (!statusBar) {
    return;
  }
  statusBar.textContent = message;
  statusBar.classList.add('is-visible');
  statusBar.style.background = isError ? 'rgba(220, 38, 38, 0.12)' : 'rgba(127, 90, 255, 0.12)';
  statusBar.style.color = isError ? '#dc2626' : 'var(--color-accent)';
  clearTimeout(statusTimeoutId);
  statusTimeoutId = window.setTimeout(() => {
    statusBar.classList.remove('is-visible');
  }, 2400);
}

function handleThreadClick(event) {
  const card = event.target.closest('[data-thread-id]');
  if (!card) {
    return;
  }

  const threadId = card.getAttribute('data-thread-id');
  if (threadId) {
    try {
      sessionStorage.setItem(THREAD_SELECTED_KEY, threadId);
    } catch (error) {
      console.warn('Failed to persist selected thread', error);
    }
  }
}

function persistThreads() {
  try {
    sessionStorage.setItem(THREAD_STORAGE_KEY, JSON.stringify(threads));
  } catch (error) {
    console.warn('Failed to persist threads', error);
  }
}

function openModal(trigger) {
  if (!modal) {
    return;
  }
  lastFocusedElement = trigger || document.activeElement;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  bodyEl.classList.add('is-modal-open');
  const firstInput = modal.querySelector('input, textarea, select, button');
  firstInput?.focus();
}

function closeModal() {
  if (!modal || !isModalOpen()) {
    return;
  }
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  bodyEl.classList.remove('is-modal-open');
  if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
    lastFocusedElement.focus();
  }
}

function isModalOpen() {
  return modal?.classList.contains('is-open');
}
