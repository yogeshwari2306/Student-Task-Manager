const SUBJECT_COLORS = [
  '#4a3fa5','#1c5fa8','#0f6e56','#9a5e0a',
  '#993556','#a32d2d','#3b6d11','#854f0b',
  '#534ab7','#993c1d','#185fa5',
];

let state = {
  tasks: [],
  subjects: [],
  view: 'all',
  filter: 'all',
  editingTaskId: null,
  selectedColor: SUBJECT_COLORS[0],
};

function save() {
  localStorage.setItem('studydesk', JSON.stringify({ tasks: state.tasks, subjects: state.subjects }));
}

function load() {
  const d = localStorage.getItem('studydesk');
  if (d) {
    try {
      const p = JSON.parse(d);
      state.tasks = p.tasks || [];
      state.subjects = p.subjects || [];
    } catch (e) {
      console.error('Storage error', e);
    }
  }
}

function uid() { 
  return Date.now().toString(36) + Math.random().toString(36).slice(2); 
}

function today() { 
  return new Date().toISOString().slice(0, 10); 
}

function isOverdue(task) {
  return !task.done && task.dueDate && task.dueDate < today();
}

function isToday(task) { 
  return task.dueDate === today(); 
}

function isUpcoming(task) { 
  return !task.done && task.dueDate && task.dueDate > today(); 
}

function getFilteredTasks() {
  let tasks = [...state.tasks];
  const q = document.getElementById('search-input').value.toLowerCase().trim();

  if (state.view === 'today') tasks = tasks.filter(t => !t.done && isToday(t));
  else if (state.view === 'upcoming') tasks = tasks.filter(t => isUpcoming(t));
  else if (state.view === 'overdue') tasks = tasks.filter(t => isOverdue(t));
  else if (state.view === 'done') tasks = tasks.filter(t => t.done);
  else if (state.view.startsWith('subject:')) {
    const sid = state.view.slice(8);
    tasks = tasks.filter(t => t.subjectId === sid);
  }

  if (state.filter !== 'all') tasks = tasks.filter(t => t.priority === state.filter);
  if (q) tasks = tasks.filter(t => t.name.toLowerCase().includes(q) || (t.notes || '').toLowerCase().includes(q));

  return tasks.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const dp = { high: 0, medium: 1, low: 2 };
    if (dp[a.priority] !== dp[b.priority]) return dp[a.priority] - dp[b.priority];
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });
}

function formatDate(dateStr, timeStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T12:00:00');
  const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return timeStr ? `${label} at ${timeStr}` : label;
}

function renderSubjectNav() {
  const el = document.getElementById('subject-nav');
  el.innerHTML = state.subjects.map(s => {
    const cnt = state.tasks.filter(t => t.subjectId === s.id && !t.done).length;
    const isActive = state.view === 'subject:' + s.id;
    return `
      <div class="subject-row">
        <button class="nav-item ${isActive ? 'active' : ''}" onclick="setView('subject:${s.id}')">
          <span class="subject-dot" style="background:${s.color}"></span>
          <span class="subject-title">${escHtml(s.name)}</span>
          ${cnt ? `<span class="nav-count">${cnt}</span>` : ''}
        </button>
        <button type="button" class="subject-del-btn" onclick="deleteSubject('${s.id}', event)" title="Delete subject">
          <i class="ti ti-trash"></i>
        </button>
      </div>`;
  }).join('');
}

function deleteSubject(subjectId, event) {
  if (event) event.stopPropagation();
  if (!confirm("Delete this subject? Associated tasks will lose their subject tag.")) return;

  state.subjects = state.subjects.filter(s => s.id !== subjectId);
  state.tasks.forEach(t => {
    if (t.subjectId === subjectId) t.subjectId = null;
  });

  if (state.view === 'subject:' + subjectId) {
    setView('all');
  } else {
    save();
    render();
  }
  toast('Subject deleted');
}

function renderCounts() {
  document.getElementById('count-all').textContent = state.tasks.filter(t => !t.done).length;
  document.getElementById('count-today').textContent = state.tasks.filter(t => !t.done && isToday(t)).length;
  document.getElementById('count-upcoming').textContent = state.tasks.filter(t => isUpcoming(t)).length;
  document.getElementById('count-overdue').textContent = state.tasks.filter(t => isOverdue(t)).length;
  document.getElementById('count-done').textContent = state.tasks.filter(t => t.done).length;
}

function renderStats() {
  const all = state.tasks.length;
  const done = state.tasks.filter(t => t.done).length;
  const overdue = state.tasks.filter(t => isOverdue(t)).length;
  document.getElementById('stat-total').textContent = all;
  document.getElementById('stat-done').textContent = done;
  document.getElementById('stat-pending').textContent = all - done;
  document.getElementById('stat-overdue').textContent = overdue;
  const pct = all ? Math.round((done / all) * 100) : 0;
  document.getElementById('prog-pct').textContent = pct + '%';
  document.getElementById('prog-fill').style.width = pct + '%';
}

function renderTasks() {
  const list = document.getElementById('task-list');
  const tasks = getFilteredTasks();

  if (!tasks.length) {
    list.innerHTML = `<div class="empty-state">
      <i class="ti ti-clipboard-list"></i>
      <p>No tasks here yet.</p>
    </div>`;
    return;
  }

  list.innerHTML = tasks.map(t => {
    const subj = state.subjects.find(s => s.id === t.subjectId);
    const overdue = isOverdue(t);
    const dateLabel = formatDate(t.dueDate, t.dueTime);
    return `<div class="task-card" id="card-${t.id}">
      <button class="task-check ${t.done ? 'done' : ''}" onclick="toggleTask('${t.id}')" title="${t.done ? 'Mark undone' : 'Mark done'}">
        ${t.done ? '<i class="ti ti-check"></i>' : ''}
      </button>
      <div class="task-body">
        <div class="task-title-row">
          <span class="task-name ${t.done ? 'done' : ''}">${escHtml(t.name)}</span>
          ${subj ? `<span class="task-subject-badge" style="background:${subj.color}22;color:${subj.color}">${escHtml(subj.name)}</span>` : ''}
          <span class="priority-badge priority-${t.priority}">${cap(t.priority)}</span>
        </div>
        ${t.notes ? `<div style="font-size:12px;color:var(--muted);margin-top:3px">${escHtml(t.notes)}</div>` : ''}
        <div class="task-meta">
          ${dateLabel ? `<span class="task-meta-item ${overdue && !t.done ? 'overdue-badge' : ''}">
            <i class="ti ti-calendar"></i>${dateLabel}${overdue && !t.done ? ' · Overdue' : ''}
          </span>` : ''}
        </div>
      </div>
      <div class="task-actions">
        <button class="icon-btn" onclick="editTask('${t.id}')" title="Edit"><i class="ti ti-pencil"></i></button>
        <button class="icon-btn danger" onclick="deleteTask('${t.id}')" title="Delete"><i class="ti ti-trash"></i></button>
      </div>
    </div>`;
  }).join('');
}

function render() {
  renderSubjectNav();
  renderCounts();
  renderStats();
  renderTasks();
  document.querySelectorAll('[data-view]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === state.view);
  });
}

function setView(v) {
  state.view = v;
  const titles = { all: 'All tasks', today: 'Due today', upcoming: 'Upcoming', overdue: 'Overdue', done: 'Completed' };
  let t = titles[v];
  if (!t && v.startsWith('subject:')) {
    const s = state.subjects.find(s => s.id === v.slice(8));
    t = s ? s.name : 'Subject';
  }
  document.getElementById('topbar-title').textContent = t;
  document.getElementById('section-title').textContent = t;
  render();
}

function setFilter(p) {
  state.filter = p;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.toggle('active', c.dataset.priority === p));
  renderTasks();
}

function toggleTask(id) {
  const t = state.tasks.find(t => t.id === id);
  if (!t) return;
  t.done = !t.done;
  save(); 
  render();
  toast(t.done ? 'Task completed!' : 'Marked as pending');
}

function deleteTask(id) {
  state.tasks = state.tasks.filter(t => t.id !== id);
  save(); 
  render();
  toast('Task deleted');
}

function editTask(id) {
  const t = state.tasks.find(t => t.id === id);
  if (!t) return;
  state.editingTaskId = id;
  document.getElementById('modal-title').textContent = 'Edit task';
  document.getElementById('task-name-input').value = t.name;
  document.getElementById('task-notes-input').value = t.notes || '';
  document.getElementById('task-priority-input').value = t.priority;
  document.getElementById('task-date-input').value = t.dueDate || '';
  document.getElementById('task-time-input').value = t.dueTime || '';
  populateSubjectSelect();
  document.getElementById('task-subject-input').value = t.subjectId || '';
  document.getElementById('task-modal').classList.add('open');
}

function openTaskModal() {
  state.editingTaskId = null;
  document.getElementById('modal-title').textContent = 'Add new task';
  document.getElementById('task-name-input').value = '';
  document.getElementById('task-notes-input').value = '';
  document.getElementById('task-priority-input').value = 'medium';
  document.getElementById('task-date-input').value = '';
  document.getElementById('task-time-input').value = '';
  populateSubjectSelect();
  document.getElementById('task-modal').classList.add('open');
  setTimeout(() => document.getElementById('task-name-input').focus(), 50);
}

function closeTaskModal() { 
  document.getElementById('task-modal').classList.remove('open'); 
}

function saveTask() {
  const name = document.getElementById('task-name-input').value.trim();
  if (!name) { 
    document.getElementById('task-name-input').focus(); 
    return; 
  }
  
  if (state.editingTaskId) {
    const idx = state.tasks.findIndex(t => t.id === state.editingTaskId);
    if (idx !== -1) {
      state.tasks[idx] = {
        ...state.tasks[idx],
        name,
        notes: document.getElementById('task-notes-input').value.trim(),
        priority: document.getElementById('task-priority-input').value,
        dueDate: document.getElementById('task-date-input').value,
        dueTime: document.getElementById('task-time-input').value,
        subjectId: document.getElementById('task-subject-input').value || null,
      };
      toast('Task updated');
    }
  } else {
    state.tasks.unshift({
      id: uid(),
      name,
      notes: document.getElementById('task-notes-input').value.trim(),
      priority: document.getElementById('task-priority-input').value,
      dueDate: document.getElementById('task-date-input').value,
      dueTime: document.getElementById('task-time-input').value,
      subjectId: document.getElementById('task-subject-input').value || null,
      done: false,
    });
    toast('Task added');
  }
  save(); 
  render(); 
  closeTaskModal();
}

function populateSubjectSelect() {
  const sel = document.getElementById('task-subject-input');
  sel.innerHTML = '<option value="">No subject</option>' +
    state.subjects.map(s => `<option value="${s.id}">${escHtml(s.name)}</option>`).join('');
}

function openSubjectModal() {
  document.getElementById('subject-name-input').value = '';
  state.selectedColor = SUBJECT_COLORS[0];
  renderColorPicker();
  document.getElementById('subject-modal').classList.add('open');
  setTimeout(() => document.getElementById('subject-name-input').focus(), 50);
}

function closeSubjectModal() { 
  document.getElementById('subject-modal').classList.remove('open'); 
}

function saveSubject() {
  const name = document.getElementById('subject-name-input').value.trim();
  if (!name) { 
    document.getElementById('subject-name-input').focus(); 
    return; 
  }
  state.subjects.push({ id: uid(), name, color: state.selectedColor });
  save(); 
  render(); 
  closeSubjectModal();
  toast('Subject added');
}

function renderColorPicker() {
  const el = document.getElementById('color-picker');
  el.innerHTML = SUBJECT_COLORS.map(c =>
    `<div class="color-swatch ${c === state.selectedColor ? 'selected' : ''}" style="background:${c}" onclick="selectColor('${c}')"></div>`
  ).join('');
}

function selectColor(c) {
  state.selectedColor = c;
  renderColorPicker();
}

function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function cap(s) { 
  return s.charAt(0).toUpperCase() + s.slice(1); 
}

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', e => { 
    if (e.target === m) m.classList.remove('open'); 
  });
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
  }
});

// Load saved data and initial render
load();
render();