const STORAGE_KEY = 'dayAnchorData:v2';
const DB_NAME = 'dayAnchorVoiceDB';
const DB_STORE = 'voiceBlobs';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

let state = loadState();
let activeDate = getLocalDateString(new Date());
let calendarCursor = monthStartString(activeDate);
let deferredInstallPrompt = null;
let mediaRecorder = null;
let recordChunks = [];
let recordingStartedAt = null;

const blockTypeLabel = {
  deep_work: '집중작업',
  admin: '잡무',
  meeting: '미팅/약속',
  move: '이동',
  recovery: '휴식',
  capture: '메모',
  review: '회고'
};

const blockStatusLabel = {
  planned: '예정',
  doing: '진행중',
  done: '완료',
  delayed: '미룸'
};

const taskStatusLabel = {
  todo: '대기',
  done: '완료',
  skipped: '미룸',
  carried: '내일로 넘김'
};

function uid(prefix = 'id') {
  const cryptoObj = window.crypto || window.msCrypto;
  if (cryptoObj?.randomUUID) return `${prefix}_${cryptoObj.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function getLocalDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function monthStartString(dateString) {
  return `${dateString.slice(0, 7)}-01`;
}

function formatKoreanDate(dateString) {
  const d = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  }).format(d);
}

function formatKoreanMonth(dateString) {
  const d = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long'
  }).format(d);
}

function nowTimeString() {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date());
}

function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function escapeHTML(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('dayAnchorData:v1');
  if (!raw) return createEmptyState();
  try {
    const parsed = JSON.parse(raw);
    return {
      days: parsed.days || [],
      scheduleBlocks: parsed.scheduleBlocks || [],
      tasks: parsed.tasks || [],
      notes: parsed.notes || [],
      reminders: parsed.reminders || [],
      events: parsed.events || []
    };
  } catch (error) {
    console.warn('Failed to parse state. Creating a fresh state.', error);
    return createEmptyState();
  }
}

function createEmptyState() {
  return {
    days: [],
    scheduleBlocks: [],
    tasks: [],
    notes: [],
    reminders: [],
    events: []
  };
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function saveState(eventName, payload = {}) {
  if (eventName) logEvent(eventName, payload, false);
  persistState();
  renderAll();
}

function logEvent(eventName, payload = {}, rerender = true) {
  state.events.unshift({
    id: uid('event'),
    eventName,
    payload,
    date: activeDate,
    createdAt: new Date().toISOString()
  });
  state.events = state.events.slice(0, 180);
  persistState();
  if (rerender) renderEventLog();
}

function toast(message) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), 2200);
}

function getDay(date = activeDate) {
  return state.days.find((day) => day.date === date);
}

function ensureDay(date = activeDate) {
  let day = getDay(date);
  if (!day) {
    day = {
      id: uid('day'),
      date,
      mainGoal: '',
      avoidThing: '',
      focusWindow: '',
      reviewCompleted: false,
      createdAt: new Date().toISOString()
    };
    state.days.push(day);
  }
  return day;
}

function getBlocks(date = activeDate) {
  return state.scheduleBlocks
    .filter((block) => block.date === date)
    .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
}

function getTasks(date = activeDate) {
  return state.tasks
    .filter((task) => task.date === date)
    .sort((a, b) => Number(a.priority) - Number(b.priority) || timeToMinutes(a.dueTime) - timeToMinutes(b.dueTime));
}

function getNotes(date = activeDate) {
  return state.notes
    .filter((note) => note.date === date)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getReminders(date = activeDate) {
  return state.reminders
    .filter((reminder) => reminder.date === date)
    .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
}

function setActiveDate(dateString, syncMonth = true, eventName = 'date_changed') {
  activeDate = dateString;
  if (syncMonth) calendarCursor = monthStartString(activeDate);
  ensureDay(activeDate);
  if (eventName) logEvent(eventName, { activeDate }, false);
  renderAll();
}

function shiftCalendarMonth(diff) {
  const cursor = new Date(`${calendarCursor}T00:00:00`);
  cursor.setMonth(cursor.getMonth() + diff, 1);
  calendarCursor = monthStartString(getLocalDateString(cursor));
  activeDate = calendarCursor;
  ensureDay(activeDate);
  logEvent('calendar_month_changed', { calendarCursor, activeDate }, false);
  renderAll();
}

function calculateStats(date = activeDate) {
  const tasks = getTasks(date);
  const blocks = getBlocks(date);
  const notes = getNotes(date);
  const taskCompletion = tasks.length ? Math.round((tasks.filter((t) => t.status === 'done').length / tasks.length) * 100) : 0;
  const blockCompletion = blocks.length ? Math.round((blocks.filter((b) => b.status === 'done').length / blocks.length) * 100) : 0;
  const completion = tasks.length && blocks.length ? Math.round((taskCompletion * 0.65) + (blockCompletion * 0.35)) : Math.max(taskCompletion, blockCompletion);
  const memoCount = notes.length;
  const voiceCount = notes.filter((n) => n.noteType === 'voice').length;
  const delayedTasks = tasks.filter((t) => ['skipped', 'carried'].includes(t.status)).length;
  const day = getDay(date);
  const morningPlanBonus = day?.mainGoal ? 10 : 0;
  const reviewBonus = day?.reviewCompleted ? 10 : 0;
  const memoBonus = Math.min(memoCount * 4, 16);
  const flowScore = Math.min(100, Math.round(completion * 0.64 + morningPlanBonus + reviewBonus + memoBonus));

  return {
    completion,
    taskCompletion,
    blockCompletion,
    flowScore,
    taskCount: tasks.length,
    doneTaskCount: tasks.filter((t) => t.status === 'done').length,
    delayedTasks,
    carryCount: tasks.filter((t) => t.status === 'carried').length,
    blockCount: blocks.length,
    memoCount,
    voiceCount
  };
}

function getCurrentBlock() {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return getBlocks(activeDate).find((block) => timeToMinutes(block.start) <= currentMinutes && currentMinutes < timeToMinutes(block.end));
}

function findBlockTitle(blockId) {
  if (!blockId) return '연결 일정 없음';
  return state.scheduleBlocks.find((block) => block.id === blockId)?.title || '삭제된 일정';
}

function renderCalendar() {
  const calendar = $('#monthCalendar');
  const title = $('#calendarTitle');
  if (!calendar || !title) return;

  title.textContent = formatKoreanMonth(calendarCursor);

  const cursor = new Date(`${calendarCursor}T00:00:00`);
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - first.getDay());
  const todayString = getLocalDateString(new Date());
  const monthKey = calendarCursor.slice(0, 7);

  const cells = [];
  for (let index = 0; index < 42; index += 1) {
    const cellDate = new Date(gridStart);
    cellDate.setDate(gridStart.getDate() + index);
    const dateString = getLocalDateString(cellDate);
    const stats = calculateStats(dateString);
    const blocks = getBlocks(dateString);
    const tasks = getTasks(dateString);
    const notes = getNotes(dateString);
    const day = getDay(dateString);
    const inMonth = dateString.startsWith(monthKey);
    const isSelected = dateString === activeDate;
    const isToday = dateString === todayString;
    const hasData = Boolean(day?.mainGoal || blocks.length || tasks.length || notes.length);
    const firstBlock = blocks[0];
    const doneTasks = tasks.filter((task) => task.status === 'done').length;

    const preview = firstBlock
      ? `<span class="calendar-event"><b>${escapeHTML(firstBlock.start)}</b> ${escapeHTML(firstBlock.title)}</span>`
      : hasData
        ? `<span class="calendar-event muted-event">기록 있음</span>`
        : `<span class="calendar-empty">비어 있음</span>`;

    cells.push(`
      <button class="calendar-day ${inMonth ? '' : 'outside-month'} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${hasData ? 'has-data' : ''}" type="button" data-date="${dateString}" aria-label="${escapeHTML(formatKoreanDate(dateString))} 선택">
        <span class="day-topline">
          <strong>${cellDate.getDate()}</strong>
          ${isToday ? '<em>오늘</em>' : ''}
        </span>
        <span class="day-metrics">
          <span>일정 ${blocks.length}</span>
          <span>할 일 ${doneTasks}/${tasks.length}</span>
          <span>메모 ${notes.length}</span>
        </span>
        <span class="calendar-events">${preview}${blocks.length > 1 ? `<span class="calendar-more">+${blocks.length - 1}</span>` : ''}</span>
        <span class="day-score">${stats.completion}%</span>
      </button>
    `);
  }
  calendar.innerHTML = cells.join('');
}

function renderHero() {
  const day = getDay();
  const stats = calculateStats();
  $('#todayLabel').textContent = formatKoreanDate(activeDate);
  $('#heroTitle').textContent = day?.mainGoal ? day.mainGoal.split('\n')[0] : '아직 선택한 날짜 보드가 비어 있어요.';
  $('#heroSubtitle').textContent = day?.focusWindow
    ? `중요 시간대: ${day.focusWindow}${day.avoidThing ? ` · 피할 것: ${day.avoidThing}` : ''}`
    : '날짜를 고른 뒤 일정, 체크리스트, 메모를 붙여보세요.';
  $('#statCompletion').textContent = `${stats.completion}%`;
  $('#statBlocks').textContent = stats.blockCount;
  $('#statNotes').textContent = stats.memoCount;
  $('#statVoice').textContent = stats.voiceCount;
}

function renderDayForm() {
  const day = getDay();
  $('#mainGoal').value = day?.mainGoal || '';
  $('#avoidThing').value = day?.avoidThing || '';
  $('#focusWindow').value = day?.focusWindow || '';
}

function renderCurrentBlock() {
  const current = getCurrentBlock();
  $('#currentTimePill').textContent = nowTimeString();
  const target = $('#currentBlockCard');
  if (!current) {
    target.className = 'empty-state';
    target.innerHTML = '현재 시간에 연결된 일정이 없습니다. 달력에서 날짜를 고른 뒤 일정 블록을 추가해보세요.';
    return;
  }
  target.className = 'timeline-item current-mini-card';
  target.innerHTML = `
    <div class="timeline-time">${escapeHTML(current.start)}<br>~ ${escapeHTML(current.end)}</div>
    <div class="timeline-body">
      <strong>${escapeHTML(current.title)}</strong>
      <p>${escapeHTML(current.memo || '지금 이 블록에 집중해보세요.')}</p>
      <div class="meta-row">
        <span class="tag">${blockTypeLabel[current.type] || current.type}</span>
        <span class="tag status-${current.status}">${blockStatusLabel[current.status] || current.status}</span>
      </div>
    </div>
  `;
}

function updateSelectOptions() {
  const blocks = getBlocks();
  const options = ['<option value="">연결하지 않음</option>']
    .concat(blocks.map((block) => `<option value="${block.id}">${escapeHTML(block.start)}-${escapeHTML(block.end)} · ${escapeHTML(block.title)}</option>`))
    .join('');
  ['#taskBlockSelect', '#noteBlockSelect', '#voiceBlockSelect'].forEach((selector) => {
    const select = $(selector);
    if (!select) return;
    const prev = select.value;
    select.innerHTML = options;
    if (blocks.some((b) => b.id === prev)) select.value = prev;
  });
}

function blockItemHTML(block, editable = false) {
  return `
    <article class="timeline-item" data-block-id="${block.id}">
      <div class="timeline-time">${escapeHTML(block.start)}<br>~ ${escapeHTML(block.end)}</div>
      <div class="timeline-body">
        <strong>${escapeHTML(block.title)}</strong>
        <p>${escapeHTML(block.memo || '메모 없음')}</p>
        <div class="meta-row">
          <span class="tag">${blockTypeLabel[block.type] || block.type}</span>
          <span class="tag status-${block.status}">${blockStatusLabel[block.status] || block.status}</span>
          <span class="tag">연결 할 일 ${getTasks().filter((task) => task.blockId === block.id).length}개</span>
        </div>
        ${editable ? `
          <div class="item-actions">
            <button type="button" class="primary-mini" data-action="block-done" data-id="${block.id}">완료</button>
            <button type="button" data-action="block-doing" data-id="${block.id}">진행중</button>
            <button type="button" class="warning-mini" data-action="block-delay" data-id="${block.id}">미룸</button>
            <button type="button" data-action="block-edit" data-id="${block.id}">수정</button>
            <button type="button" data-action="block-delete" data-id="${block.id}">삭제</button>
          </div>
        ` : ''}
      </div>
    </article>
  `;
}

function renderTimeline() {
  const blocks = getBlocks();
  const todayTimeline = $('#todayTimeline');
  const scheduleList = $('#scheduleList');
  const empty = '<div class="empty-state">아직 일정 블록이 없습니다. 달력에서 날짜를 고르고 일정 하나를 추가해보세요.</div>';
  if (!blocks.length) {
    if (todayTimeline) todayTimeline.innerHTML = empty;
    if (scheduleList) scheduleList.innerHTML = empty;
    return;
  }
  if (todayTimeline) todayTimeline.innerHTML = blocks.map((block) => blockItemHTML(block, false)).join('');
  if (scheduleList) scheduleList.innerHTML = blocks.map((block) => blockItemHTML(block, true)).join('');
}

function taskItemHTML(task, compact = false) {
  const done = task.status === 'done';
  const statusClass = task.status === 'done' ? 'status-done' : task.status === 'skipped' ? 'status-skipped' : task.status === 'carried' ? 'status-carried' : '';
  return `
    <article class="task-card" data-task-id="${task.id}">
      <input type="checkbox" data-action="task-toggle" data-id="${task.id}" ${done ? 'checked' : ''} aria-label="할 일 완료 처리" />
      <div>
        <p class="task-title ${done ? 'done' : ''}">${escapeHTML(task.title)}</p>
        <p class="task-meta">
          ${task.dueTime ? `${escapeHTML(task.dueTime)} · ` : ''}${findBlockTitle(task.blockId)} · 우선순위 ${task.priority} · <span class="tag ${statusClass}">${taskStatusLabel[task.status] || task.status}</span>
          ${task.delayReason ? `<br>미룸 이유: ${escapeHTML(task.delayReason)}` : ''}
        </p>
        ${compact ? '' : `
          <div class="item-actions">
            <button type="button" class="primary-mini" data-action="task-done" data-id="${task.id}">완료</button>
            <button type="button" class="warning-mini" data-action="task-skip" data-id="${task.id}">미룸</button>
            <button type="button" data-action="task-carry" data-id="${task.id}">내일로</button>
            <button type="button" data-action="task-edit" data-id="${task.id}">수정</button>
            <button type="button" data-action="task-delete" data-id="${task.id}">삭제</button>
          </div>
        `}
      </div>
    </article>
  `;
}

function renderTasks() {
  const tasks = getTasks();
  const todayTasks = $('#todayTasks');
  const taskList = $('#taskList');
  const empty = '<div class="empty-state">아직 체크리스트가 없습니다. 오늘 꼭 끝낼 일 1개부터 추가해보세요.</div>';
  if (!tasks.length) {
    if (todayTasks) todayTasks.innerHTML = empty;
    if (taskList) taskList.innerHTML = empty;
    return;
  }
  if (todayTasks) todayTasks.innerHTML = tasks.slice(0, 6).map((task) => taskItemHTML(task, true)).join('');
  if (taskList) taskList.innerHTML = tasks.map((task) => taskItemHTML(task, false)).join('');
}

async function renderNotes() {
  const notes = getNotes();
  const list = $('#noteList');
  if (!list) return;
  if (!notes.length) {
    list.innerHTML = '<div class="empty-state">아직 메모가 없습니다. 텍스트 또는 음성으로 첫 기록을 남겨보세요.</div>';
    return;
  }

  list.innerHTML = notes.map((note) => `
    <article class="note-card" data-note-id="${note.id}">
      <div class="meta-row">
        <span class="tag">${new Date(note.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
        <span class="tag">${findBlockTitle(note.blockId)}</span>
        <span class="tag">${note.noteType === 'voice' ? '음성메모' : '텍스트'}</span>
      </div>
      <p>${escapeHTML(note.content)}</p>
      ${note.noteType === 'voice' ? `<div class="voice-slot" id="voice-${note.id}">음성 파일 불러오는 중...</div>` : ''}
      <div class="item-actions">
        <button type="button" data-action="note-delete" data-id="${note.id}">삭제</button>
      </div>
    </article>
  `).join('');

  for (const note of notes.filter((n) => n.noteType === 'voice')) {
    const slot = document.getElementById(`voice-${note.id}`);
    const blob = await getVoiceBlob(note.voiceBlobId);
    if (!slot) continue;
    if (!blob) {
      slot.textContent = '음성 파일을 찾을 수 없습니다.';
      slot.className = 'empty-state';
      continue;
    }
    const url = URL.createObjectURL(blob);
    slot.innerHTML = `<audio controls src="${url}"></audio>`;
  }
}

function renderReview() {
  const stats = calculateStats();
  $('#flowScore').textContent = `${stats.flowScore}점`;
  $('#flowDescription').textContent = stats.flowScore >= 80
    ? '계획-실행-기록 루프가 꽤 안정적입니다.'
    : stats.flowScore >= 50
      ? '흐름은 잡혔지만 미룸 항목을 정리하면 더 좋아집니다.'
      : '아침 계획 또는 첫 체크리스트부터 가볍게 시작해보세요.';
  $('#reviewDoneTasks').textContent = stats.doneTaskCount;
  $('#reviewDelayedTasks').textContent = stats.delayedTasks;
  $('#reviewMemoCount').textContent = stats.memoCount;
  $('#reviewCarryCount').textContent = stats.carryCount;

  const carryList = $('#carryOverList');
  const tasks = getTasks().filter((task) => ['todo', 'skipped', 'carried'].includes(task.status));
  if (!tasks.length) {
    carryList.innerHTML = '<div class="empty-state">내일로 넘길 항목이 없습니다.</div>';
    return;
  }
  carryList.innerHTML = tasks.map((task) => taskItemHTML(task, false)).join('');
}

function renderInsights() {
  const dates = [...Array(7)].map((_, index) => {
    const d = new Date(`${activeDate}T00:00:00`);
    d.setDate(d.getDate() - index);
    return getLocalDateString(d);
  });
  const statsByDate = dates.map((date) => ({ date, ...calculateStats(date) }));
  const avgCompletion = Math.round(statsByDate.reduce((sum, item) => sum + item.completion, 0) / statsByDate.length);
  const totalNotes = statsByDate.reduce((sum, item) => sum + item.memoCount, 0);
  const totalVoice = statsByDate.reduce((sum, item) => sum + item.voiceCount, 0);
  const totalBlocks = statsByDate.reduce((sum, item) => sum + item.blockCount, 0);
  const totalDelayed = statsByDate.reduce((sum, item) => sum + item.delayedTasks, 0);
  const morningPlanDays = dates.filter((date) => getDay(date)?.mainGoal).length;

  $('#insightCards').innerHTML = `
    <div class="insight-card"><strong>${avgCompletion}%</strong><span>평균 완료율</span></div>
    <div class="insight-card"><strong>${morningPlanDays}/7</strong><span>아침 계획 작성일</span></div>
    <div class="insight-card"><strong>${totalBlocks}</strong><span>일정 블록 수</span></div>
    <div class="insight-card"><strong>${totalNotes}</strong><span>전체 메모</span></div>
    <div class="insight-card"><strong>${totalVoice}</strong><span>음성메모</span></div>
    <div class="insight-card"><strong>${totalDelayed}</strong><span>미룸/이월 항목</span></div>
  `;
}

function renderEventLog() {
  const log = $('#eventLog');
  if (!state.events.length) {
    log.innerHTML = '<div class="empty-state">아직 이벤트 로그가 없습니다.</div>';
    return;
  }
  log.innerHTML = state.events.slice(0, 80).map((event) => `
    <div class="event-line">
      <strong>${escapeHTML(event.eventName)}</strong> · ${new Date(event.createdAt).toLocaleString('ko-KR')}<br>
      ${escapeHTML(JSON.stringify(event.payload))}
    </div>
  `).join('');
}

function renderAll() {
  $('#activeDate').value = activeDate;
  ensureDay(activeDate);
  updateSelectOptions();
  renderCalendar();
  renderHero();
  renderDayForm();
  renderCurrentBlock();
  renderTimeline();
  renderTasks();
  renderNotes();
  renderReview();
  renderInsights();
  renderEventLog();
}

function setView(viewName) {
  $$('.nav-link').forEach((link) => link.classList.toggle('active', link.dataset.view === viewName));
  $$('.view').forEach((panel) => panel.classList.toggle('active', panel.dataset.viewPanel === viewName));
  window.location.hash = viewName;
}

function resetBlockForm() {
  $('#editingBlockId').value = '';
  $('#scheduleForm').reset();
  $('#blockStart').value = '09:00';
  $('#blockEnd').value = '10:00';
}

function resetTaskForm() {
  $('#editingTaskId').value = '';
  $('#taskForm').reset();
  $('#taskPriority').value = '2';
  $('#taskStatus').value = 'todo';
}

function askDelayReason() {
  const reasons = ['시간 부족', '우선순위 변경', '집중력 저하', '외부 일정 발생', '생각보다 오래 걸림'];
  const answer = prompt(`미룸 이유를 적어주세요.\n예: ${reasons.join(', ')}`);
  return answer?.trim() || '이유 미기록';
}

function addReminderFromPrompt() {
  const time = prompt('메모 알림 시간을 입력하세요. 예: 15:30');
  if (!time || !/^\d{2}:\d{2}$/.test(time)) {
    toast('시간 형식은 15:30처럼 입력해주세요.');
    return;
  }
  const message = prompt('알림에 표시할 메모 질문을 입력하세요.', '지금 하고 있는 일과 다음 행동을 기록하세요.');
  state.reminders.push({
    id: uid('reminder'),
    date: activeDate,
    time,
    message: message || '지금 기록할 것을 남겨보세요.',
    triggered: false,
    createdAt: new Date().toISOString()
  });
  saveState('reminder_created', { time, message });
  toast(`${time} 메모 알림이 추가되었습니다.`);
}

function requestNotificationPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') Notification.requestPermission();
}

function checkReminders() {
  const compact = new Date().toTimeString().slice(0, 5);
  let changed = false;
  state.reminders.forEach((reminder) => {
    if (reminder.date === activeDate && !reminder.triggered && reminder.time === compact) {
      reminder.triggered = true;
      changed = true;
      const message = reminder.message || '지금 메모를 남겨보세요.';
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Day Anchor 메모 알림', { body: message });
      }
      toast(message);
      logEvent('reminder_triggered', { reminderId: reminder.id, time: reminder.time }, false);
    }
  });
  if (changed) {
    persistState();
    renderAll();
  }
}

function openVoiceDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(DB_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveVoiceBlob(id, blob) {
  const db = await openVoiceDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getVoiceBlob(id) {
  if (!id) return null;
  const db = await openVoiceDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readonly');
    const request = tx.objectStore(DB_STORE).get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function deleteVoiceBlob(id) {
  if (!id) return;
  const db = await openVoiceDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function wireEvents() {
  $$('.nav-link').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      setView(link.dataset.view);
    });
  });

  document.body.addEventListener('click', (event) => {
    const jumpButton = event.target.closest('[data-jump]');
    if (jumpButton) {
      setView(jumpButton.dataset.jump);
      return;
    }

    const dayButton = event.target.closest('.calendar-day[data-date]');
    if (dayButton) {
      setActiveDate(dayButton.dataset.date, true, 'calendar_date_selected');
      return;
    }

    const checkbox = event.target.closest('input[data-action="task-toggle"]');
    if (checkbox) {
      const task = state.tasks.find((item) => item.id === checkbox.dataset.id);
      if (!task) return;
      task.status = checkbox.checked ? 'done' : 'todo';
      saveState('task_toggled', { id: task.id, status: task.status });
      return;
    }

    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const { action, id } = button.dataset;

    if (action?.startsWith('task-')) {
      const task = state.tasks.find((item) => item.id === id);
      if (!task) return;
      if (action === 'task-done') task.status = 'done';
      if (action === 'task-skip') {
        task.status = 'skipped';
        task.delayReason = askDelayReason();
      }
      if (action === 'task-carry') {
        task.status = 'carried';
        task.delayReason = '내일 처리 예정';
      }
      if (action === 'task-edit') {
        $('#editingTaskId').value = task.id;
        $('#taskTitle').value = task.title;
        $('#taskPriority').value = task.priority;
        $('#taskBlockSelect').value = task.blockId;
        $('#taskDue').value = task.dueTime || '';
        $('#taskStatus').value = task.status;
        setView('tasks');
        toast('할 일 수정 모드입니다.');
        return;
      }
      if (action === 'task-delete') {
        if (!confirm('이 할 일을 삭제할까요?')) return;
        state.tasks = state.tasks.filter((item) => item.id !== id);
      }
      saveState('task_status_changed', { id, action, status: task.status });
    }

    if (action === 'note-delete') {
      const note = state.notes.find((item) => item.id === id);
      if (!note) return;
      if (!confirm('이 메모를 삭제할까요?')) return;
      if (note.noteType === 'voice') deleteVoiceBlob(note.voiceBlobId);
      state.notes = state.notes.filter((item) => item.id !== id);
      saveState('note_deleted', { id, noteType: note.noteType });
      toast('메모가 삭제되었습니다.');
    }
  });

  $('#activeDate').addEventListener('change', (event) => setActiveDate(event.target.value, true, 'date_changed'));

  $('#prevDayBtn').addEventListener('click', () => {
    const d = new Date(`${activeDate}T00:00:00`);
    d.setDate(d.getDate() - 1);
    setActiveDate(getLocalDateString(d), true, 'prev_day_clicked');
  });

  $('#nextDayBtn').addEventListener('click', () => {
    const d = new Date(`${activeDate}T00:00:00`);
    d.setDate(d.getDate() + 1);
    setActiveDate(getLocalDateString(d), true, 'next_day_clicked');
  });

  $('#prevMonthBtn').addEventListener('click', () => shiftCalendarMonth(-1));
  $('#nextMonthBtn').addEventListener('click', () => shiftCalendarMonth(1));
  $('#goTodayBtn').addEventListener('click', () => setActiveDate(getLocalDateString(new Date()), true, 'today_clicked'));

  $('#dayForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const day = ensureDay();
    day.mainGoal = $('#mainGoal').value.trim();
    day.avoidThing = $('#avoidThing').value.trim();
    day.focusWindow = $('#focusWindow').value.trim();
    saveState('daily_plan_saved', { date: activeDate });
    toast('선택 날짜 보드가 저장되었습니다.');
  });

  $('#scheduleForm').addEventListener('submit', (event) => {
    event.preventDefault();
    ensureDay();
    const editingId = $('#editingBlockId').value;
    const payload = {
      title: $('#blockTitle').value.trim(),
      start: $('#blockStart').value,
      end: $('#blockEnd').value,
      type: $('#blockType').value,
      status: $('#blockStatus').value,
      memo: $('#blockMemo').value.trim()
    };
    if (timeToMinutes(payload.end) <= timeToMinutes(payload.start)) {
      toast('종료 시간은 시작 시간보다 뒤여야 합니다.');
      return;
    }
    if (editingId) {
      const block = state.scheduleBlocks.find((item) => item.id === editingId);
      Object.assign(block, payload, { updatedAt: new Date().toISOString() });
      logEvent('schedule_block_updated', { id: editingId, title: payload.title }, false);
    } else {
      state.scheduleBlocks.push({ id: uid('block'), date: activeDate, ...payload, createdAt: new Date().toISOString() });
      logEvent('schedule_block_created', { title: payload.title, start: payload.start, end: payload.end }, false);
    }
    persistState();
    resetBlockForm();
    renderAll();
    toast('일정이 저장되었습니다.');
  });

  $('#cancelBlockEdit').addEventListener('click', resetBlockForm);

  $('#scheduleList').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const { action, id } = button.dataset;
    const block = state.scheduleBlocks.find((item) => item.id === id);
    if (!block) return;
    if (action === 'block-edit') {
      $('#editingBlockId').value = block.id;
      $('#blockTitle').value = block.title;
      $('#blockStart').value = block.start;
      $('#blockEnd').value = block.end;
      $('#blockType').value = block.type;
      $('#blockStatus').value = block.status;
      $('#blockMemo').value = block.memo || '';
      toast('일정 수정 모드입니다.');
      return;
    }
    if (action === 'block-delete') {
      if (!confirm('이 일정을 삭제할까요? 연결된 할 일/메모는 유지되지만 연결 정보는 비게 됩니다.')) return;
      state.scheduleBlocks = state.scheduleBlocks.filter((item) => item.id !== id);
      state.tasks.forEach((task) => { if (task.blockId === id) task.blockId = ''; });
      state.notes.forEach((note) => { if (note.blockId === id) note.blockId = ''; });
      saveState('schedule_block_deleted', { id, title: block.title });
      toast('일정이 삭제되었습니다.');
      return;
    }
    if (action === 'block-done' || action === 'block-doing' || action === 'block-delay') {
      block.status = action === 'block-done' ? 'done' : action === 'block-doing' ? 'doing' : 'delayed';
      if (action === 'block-delay') block.delayReason = askDelayReason();
      saveState('schedule_status_changed', { id, status: block.status });
    }
  });

  $('#taskForm').addEventListener('submit', (event) => {
    event.preventDefault();
    ensureDay();
    const editingId = $('#editingTaskId').value;
    const payload = {
      title: $('#taskTitle').value.trim(),
      priority: $('#taskPriority').value,
      blockId: $('#taskBlockSelect').value,
      dueTime: $('#taskDue').value,
      status: $('#taskStatus').value
    };
    if (editingId) {
      const task = state.tasks.find((item) => item.id === editingId);
      Object.assign(task, payload, { updatedAt: new Date().toISOString() });
      logEvent('task_updated', { id: editingId, title: payload.title }, false);
    } else {
      state.tasks.push({ id: uid('task'), date: activeDate, ...payload, createdAt: new Date().toISOString() });
      logEvent('task_created', { title: payload.title, blockId: payload.blockId }, false);
    }
    persistState();
    resetTaskForm();
    renderAll();
    toast('할 일이 저장되었습니다.');
  });

  $('#noteForm').addEventListener('submit', (event) => {
    event.preventDefault();
    ensureDay();
    const content = $('#noteContent').value.trim();
    state.notes.push({
      id: uid('note'),
      date: activeDate,
      blockId: $('#noteBlockSelect').value,
      content,
      noteType: 'text',
      createdAt: new Date().toISOString()
    });
    persistState();
    $('#noteForm').reset();
    saveState('text_note_created', { date: activeDate });
    toast('메모가 저장되었습니다.');
  });

  $('#quickMemoBtn').addEventListener('click', () => {
    const current = getCurrentBlock();
    setView('notes');
    $('#noteBlockSelect').value = current?.id || '';
    $('#noteContent').focus();
  });

  $('#quickTaskBtn').addEventListener('click', () => {
    const current = getCurrentBlock();
    setView('tasks');
    $('#taskBlockSelect').value = current?.id || '';
    $('#taskTitle').focus();
  });

  $('#quickReminderBtn').addEventListener('click', () => {
    requestNotificationPermission();
    addReminderFromPrompt();
  });

  $('#startRecordBtn').addEventListener('click', startRecording);
  $('#stopRecordBtn').addEventListener('click', stopRecording);

  $('#completeReviewBtn').addEventListener('click', () => {
    const day = ensureDay();
    day.reviewCompleted = true;
    saveState('daily_review_completed', { date: activeDate, stats: calculateStats() });
    toast('오늘 회고가 완료 처리되었습니다.');
  });

  $('#seedBtn').addEventListener('click', seedSampleData);

  $('#exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `day-anchor-export-${activeDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
    logEvent('data_exported', { date: activeDate }, true);
  });

  $('#resetBtn').addEventListener('click', () => {
    if (!confirm('모든 로컬 데이터를 초기화할까요?')) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('dayAnchorData:v1');
    state = createEmptyState();
    ensureDay(activeDate);
    renderAll();
    toast('초기화되었습니다.');
  });

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    $('#installBtn').hidden = false;
  });

  $('#installBtn').addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    $('#installBtn').hidden = true;
  });
}

async function startRecording() {
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    toast('이 브라우저에서는 음성 녹음을 지원하지 않습니다.');
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recordChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) recordChunks.push(event.data);
    };
    mediaRecorder.onstop = async () => {
      const blob = new Blob(recordChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
      const voiceBlobId = uid('voice');
      await saveVoiceBlob(voiceBlobId, blob);
      const seconds = Math.round((Date.now() - recordingStartedAt) / 1000);
      const selectedBlock = $('#voiceBlockSelect').value || getCurrentBlock()?.id || '';
      state.notes.push({
        id: uid('note'),
        date: activeDate,
        blockId: selectedBlock,
        content: `음성메모 ${seconds}초`,
        noteType: 'voice',
        voiceBlobId,
        durationSec: seconds,
        createdAt: new Date().toISOString()
      });
      persistState();
      renderAll();
      toast('음성메모가 저장되었습니다.');
      logEvent('voice_note_created', { blockId: selectedBlock, durationSec: seconds }, true);
      stream.getTracks().forEach((track) => track.stop());
    };
    mediaRecorder.start();
    recordingStartedAt = Date.now();
    $('#recorderStatus').textContent = '녹음 중입니다. 말을 마치면 녹음 종료를 눌러주세요.';
    $('#startRecordBtn').disabled = true;
    $('#stopRecordBtn').disabled = false;
    logEvent('voice_recording_started', {}, true);
  } catch (error) {
    console.error(error);
    toast('마이크 권한을 확인해주세요.');
  }
}

function stopRecording() {
  if (!mediaRecorder || mediaRecorder.state === 'inactive') return;
  mediaRecorder.stop();
  $('#recorderStatus').textContent = '저장 중입니다...';
  $('#startRecordBtn').disabled = false;
  $('#stopRecordBtn').disabled = true;
}

function seedSampleData() {
  ensureDay();
  const day = getDay();
  day.mainGoal = '포트폴리오 케이스 페이지를 가설-실험-결과 구조로 정리하기';
  day.avoidThing = '의미 없는 앱 전환과 완벽주의로 시작을 미루는 것';
  day.focusWindow = '10:00~12:00 집중작업';

  if (!getBlocks().length) {
    [
      ['08:30', '09:00', '아침 계획 정리', 'review', 'done', '오늘 핵심 목표와 시간표를 정리합니다.'],
      ['10:00', '12:00', '포트폴리오 집중작업', 'deep_work', 'planned', '케이스 페이지의 문제정의와 지표 문장을 다듬습니다.'],
      ['13:30', '14:30', '지원 공고 분석', 'admin', 'planned', 'JD와 내 경험의 연결점을 정리합니다.'],
      ['15:30', '16:00', '중간 메모 슬롯', 'capture', 'planned', '막힌 부분과 다음 행동을 기록합니다.'],
      ['22:30', '23:00', '하루 회고', 'review', 'planned', '완료/미룸/내일 항목을 정리합니다.']
    ].forEach(([start, end, title, type, status, memo]) => {
      state.scheduleBlocks.push({ id: uid('block'), date: activeDate, start, end, title, type, status, memo, createdAt: new Date().toISOString() });
    });
  }

  const portfolioBlock = getBlocks().find((block) => block.title.includes('포트폴리오'))?.id || '';
  if (!getTasks().length) {
    [
      ['포트폴리오 첫 화면 문장 수정', '1', portfolioBlock, '11:00'],
      ['케이스 페이지에 가설-실험-결과 구조 추가', '1', portfolioBlock, '12:00'],
      ['지원 공고 5개 저장 후 JD 키워드 정리', '2', '', '14:30'],
      ['하루 회고에서 내일 할 일 3개 확정', '2', '', '22:50']
    ].forEach(([title, priority, blockId, dueTime]) => {
      state.tasks.push({ id: uid('task'), date: activeDate, title, priority, blockId, dueTime, status: 'todo', createdAt: new Date().toISOString() });
    });
  }

  if (!getNotes().length) {
    state.notes.push({
      id: uid('note'),
      date: activeDate,
      blockId: portfolioBlock,
      content: '이 앱 자체도 PM 포트폴리오 프로젝트로 설명 가능하다. 핵심은 계획-실행-회고 루프를 데이터화했다는 점.',
      noteType: 'text',
      createdAt: new Date().toISOString()
    });
  }

  if (!getReminders().length) {
    state.reminders.push({ id: uid('reminder'), date: activeDate, time: '15:30', message: '지금 막힌 부분과 다음 행동을 1줄로 기록하세요.', triggered: false, createdAt: new Date().toISOString() });
  }

  saveState('sample_data_seeded', { date: activeDate });
  toast('샘플 데이터가 채워졌습니다.');
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch((error) => console.warn('SW registration failed', error));
  }
}

function init() {
  const initialHash = window.location.hash.replace('#', '') || 'today';
  activeDate = getLocalDateString(new Date());
  calendarCursor = monthStartString(activeDate);
  $('#activeDate').value = activeDate;
  ensureDay(activeDate);
  resetBlockForm();
  resetTaskForm();
  wireEvents();
  setView(['today', 'schedule', 'tasks', 'notes', 'review', 'insights'].includes(initialHash) ? initialHash : 'today');
  renderAll();
  registerServiceWorker();
  setInterval(() => {
    renderCurrentBlock();
    checkReminders();
  }, 15000);
}

document.addEventListener('DOMContentLoaded', init);
