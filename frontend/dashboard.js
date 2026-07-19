/* Dashboard page logic */

const API = 'http://localhost:8000';

document.addEventListener('DOMContentLoaded', () => {
    const user = requireAuth();
    if (!user) return;

    // ─── Toast helper ──────────────────────────────────────────────────────
    const toastEl = document.getElementById('toast');
    let toastTimer;
    function showToast(msg, type = 'success') {
        clearTimeout(toastTimer);
        toastEl.textContent = msg;
        toastEl.className = `toast ${type} show`;
        toastTimer = setTimeout(() => toastEl.classList.remove('show'), 4000);
    }

    // ─── Header ───────────────────────────────────────────────────────────
    const avatarEl  = document.getElementById('user-avatar');
    const dropdown  = document.getElementById('user-dropdown');

    if (user.photo) {
        avatarEl.innerHTML = `<img src="${user.photo}" alt="${user.name}">`;
    } else {
        avatarEl.textContent = getUserInitials(user.name);
    }

    document.getElementById('dropdown-name').textContent  = user.name;
    document.getElementById('dropdown-email').textContent = user.email;

    avatarEl.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
    });
    avatarEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') dropdown.classList.toggle('open');
    });
    document.addEventListener('click', () => dropdown.classList.remove('open'));

    document.getElementById('btn-logout').addEventListener('click', () => {
        clearSession();
        window.location.href = 'index.html';
    });

    // ─── Upload Tabs ──────────────────────────────────────────────────────
    document.querySelectorAll('.upload-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.upload-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.upload-panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`panel-${tab.dataset.tab}`).classList.add('active');
        });
    });

    // Show file name when selected
    document.getElementById('audio').addEventListener('change', (e) => {
        const fileNameEl = document.getElementById('file-name');
        if (e.target.files[0]) {
            fileNameEl.textContent = `✓ ${e.target.files[0].name}`;
            fileNameEl.classList.remove('hidden');
        } else {
            fileNameEl.classList.add('hidden');
        }
    });

    // Drag-and-drop visual feedback
    const dropZone = document.getElementById('drop-zone');
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', () => dropZone.classList.remove('drag-over'));

    // ─── Analyze Form ──────────────────────────────────────────────────────
    const form       = document.getElementById('analyze-form');
    const formAlertEl = document.getElementById('form-alert');
    const analyzeSpinner = document.getElementById('analyze-spinner');
    const analyzeBtn = document.getElementById('analyze-btn');
    const analyzeBtnText = analyzeBtn.querySelector('.btn-text');
    const resultSection  = document.getElementById('result-section');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        formAlertEl.className = 'alert';

        const activeTab   = document.querySelector('.upload-tab.active')?.dataset.tab;
        const transcript  = document.getElementById('transcript').value.trim();
        const audioFile   = document.getElementById('audio').files[0];

        // Validate based on active tab
        if (activeTab === 'transcript' && !transcript) {
            formAlertEl.textContent = 'Please paste a meeting transcript.';
            formAlertEl.className = 'alert alert-error show';
            return;
        }
        if (activeTab === 'audio' && !audioFile) {
            formAlertEl.textContent = 'Please select an audio file.';
            formAlertEl.className = 'alert alert-error show';
            return;
        }

        // Build form data
        const formData = new FormData();
        if (transcript) formData.append('transcript', transcript);
        if (audioFile)  formData.append('audio', audioFile);
        formData.append('user_id', user.user_id);

        // Loading state
        analyzeSpinner.style.display = 'block';
        analyzeBtnText.textContent   = 'Analyzing…';
        analyzeBtn.disabled          = true;
        resultSection.classList.add('hidden');

        try {
            const res  = await fetch(`${API}/analyze-meeting`, {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();

            if (data.status === 'error') {
                formAlertEl.textContent = data.message;
                formAlertEl.className = 'alert alert-error show';
                return;
            }

            renderResults(data);
            showToast('Meeting analyzed! Task emails sent to matched team members.', 'success');

        } catch {
            formAlertEl.textContent = 'Cannot connect to server. Make sure the backend is running on port 8000.';
            formAlertEl.className = 'alert alert-error show';
        } finally {
            analyzeSpinner.style.display = 'none';
            analyzeBtnText.textContent   = '⚡ Analyze Meeting';
            analyzeBtn.disabled          = false;
        }
    });

    function renderResults(data) {
        document.getElementById('res-title').textContent   = data.title || 'Untitled Meeting';
        document.getElementById('res-type').textContent    = data.meeting_type || 'General';
        document.getElementById('res-date').textContent    = `📅 ${data.date || '—'}`;
        document.getElementById('res-summary').textContent = data.summary || 'No summary available.';
        document.getElementById('res-transcript').textContent = data.transcript || '';

        // Meta row
        document.getElementById('res-meta').innerHTML =
            `<div class="meta-item">👥 ${data.participants || '—'}</div>`;

        // Key Decisions
        const decisionsEl = document.getElementById('res-decisions');
        decisionsEl.innerHTML = (data.key_decisions || []).length
            ? (data.key_decisions).map(d => `<div class="list-item">• ${d}</div>`).join('')
            : `<div class="list-item" style="color:var(--text-faint)">None found</div>`;

        // Team Commitments
        const commitEl = document.getElementById('res-commitments');
        commitEl.innerHTML = (data.team_commitments || []).length
            ? (data.team_commitments).map(c =>
                `<div class="list-item"><strong>${c.person || 'Unknown'}</strong>: ${c.commitment}</div>`
              ).join('')
            : `<div class="list-item" style="color:var(--text-faint)">None found</div>`;

        // Action Items
        const actionsEl = document.getElementById('res-action-items');
        actionsEl.innerHTML = (data.action_items || []).length
            ? (data.action_items).map(item => {
                const priorityClass =
                    item.priority === 'High'   ? 'badge-error'   :
                    item.priority === 'Medium' ? 'badge-warning' : 'badge-success';
                return `
                    <div class="action-item-card">
                        <div class="action-task">${item.task}</div>
                        <div class="action-meta">
                            <span class="badge badge-muted">👤 ${item.responsible_person || 'N/A'}</span>
                            <span class="badge badge-muted">📅 ${item.deadline || 'N/A'}</span>
                            <span class="badge ${priorityClass}">${item.priority || 'N/A'}</span>
                        </div>
                    </div>`;
              }).join('')
            : `<div class="list-item" style="color:var(--text-faint)">No action items found</div>`;

        resultSection.classList.remove('hidden');
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // ─── Tasks Drawer ──────────────────────────────────────────────────────
    const overlay   = document.getElementById('drawer-overlay');
    const drawer    = document.getElementById('tasks-drawer');
    const tasksBody = document.getElementById('tasks-body');

    function openDrawer() {
        overlay.classList.add('open');
        drawer.classList.add('open');
        overlay.removeAttribute('aria-hidden');
        loadTasks();
    }

    function closeDrawer() {
        overlay.classList.remove('open');
        drawer.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
    }

    document.getElementById('btn-tasks').addEventListener('click', () => {
        dropdown.classList.remove('open');
        openDrawer();
    });
    document.getElementById('close-drawer').addEventListener('click', closeDrawer);
    overlay.addEventListener('click', closeDrawer);

    async function loadTasks() {
        tasksBody.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⏳</div>
                <p>Loading your tasks…</p>
            </div>`;
        try {
            const res  = await fetch(`${API}/tasks?user_id=${user.user_id}`);
            const data = await res.json();
            renderTasks(data.tasks || []);
        } catch {
            tasksBody.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">❌</div>
                    <p>Failed to load tasks. Is the server running?</p>
                </div>`;
        }
    }

    function renderTasks(tasks) {
        if (!tasks.length) {
            tasksBody.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <p>No tasks yet. Analyze a meeting to get started.</p>
                </div>`;
            return;
        }

        tasksBody.innerHTML = tasks.map(task => `
            <div class="task-card" id="task-row-${task.row_index}">
                <div class="task-card-header">
                    <div class="task-card-title">${task.title}</div>
                    <span class="badge ${task.status === 'completed' ? 'badge-success' : 'badge-warning'}">
                        ${task.status === 'completed' ? '✓ Done' : '⏳ Pending'}
                    </span>
                </div>
                <div class="task-card-date">📅 ${task.date} · 👥 ${task.participants || '—'}</div>
                <div class="task-action-preview">${task.action_items || 'No action items'}</div>
                <div class="task-card-actions">
                    ${task.status !== 'completed' ? `
                        <button class="btn btn-success btn-sm" onclick="completeTask(${task.row_index})">✓ Complete</button>
                    ` : ''}
                    <button class="btn btn-danger btn-sm" onclick="deleteTask(${task.row_index})">🗑 Delete</button>
                </div>
            </div>
        `).join('');
    }

    // Complete task — exposed globally for onclick handlers
    window.completeTask = async (rowIndex) => {
        try {
            await fetch(`${API}/tasks/${rowIndex}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'completed' }),
            });
            showToast('Task marked as completed!', 'success');
            loadTasks();
        } catch {
            showToast('Failed to update task.', 'error');
        }
    };

    // Delete task — exposed globally for onclick handlers
    window.deleteTask = async (rowIndex) => {
        if (!confirm('Delete this task? This cannot be undone.')) return;
        try {
            await fetch(`${API}/tasks/${rowIndex}`, { method: 'DELETE' });
            showToast('Task deleted.', 'success');
            loadTasks();
        } catch {
            showToast('Failed to delete task.', 'error');
        }
    };
});
