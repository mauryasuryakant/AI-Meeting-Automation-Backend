/* Employees page logic */

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
    const avatarEl = document.getElementById('user-avatar');
    const dropdown = document.getElementById('user-dropdown');

    avatarEl.textContent = getUserInitials(user.name);
    document.getElementById('dropdown-name').textContent  = user.name;
    document.getElementById('dropdown-email').textContent = user.email;

    avatarEl.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
    });
    document.addEventListener('click', () => dropdown.classList.remove('open'));

    document.getElementById('btn-logout').addEventListener('click', () => {
        clearSession();
        window.location.href = 'index.html';
    });

    // ─── Load employees ────────────────────────────────────────────────────
    async function loadEmployees() {
        try {
            const res  = await fetch(`${API}/employees?user_id=${user.user_id}`);
            const data = await res.json();
            renderEmployees(data.employees || []);
        } catch {
            showToast('Failed to load team members.', 'error');
        }
    }

    function renderEmployees(list) {
        const listEl  = document.getElementById('employee-list');
        const countEl = document.getElementById('emp-count');
        countEl.textContent = `${list.length} member${list.length !== 1 ? 's' : ''}`;

        if (!list.length) {
            listEl.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👤</div>
                    <p>No team members yet. Add one using the form.</p>
                </div>`;
            return;
        }

        listEl.innerHTML = list.map(emp => `
            <div class="employee-item">
                <div>
                    <div class="emp-name">${esc(emp.name)}</div>
                    <div class="emp-email">${esc(emp.email)}</div>
                </div>
                <div class="emp-actions">
                    <button
                        class="btn btn-secondary btn-sm"
                        onclick="editEmployee(${emp.row_index}, '${esc(emp.name)}', '${esc(emp.email)}')"
                    >Edit</button>
                    <button
                        class="btn btn-danger btn-sm"
                        onclick="deleteEmployee(${emp.row_index}, '${esc(emp.name)}')"
                    >Remove</button>
                </div>
            </div>
        `).join('');
    }

    // ─── Add employee ──────────────────────────────────────────────────────
    const addForm     = document.getElementById('add-form');
    const addAlertEl  = document.getElementById('add-alert');
    const addSpinner  = document.getElementById('add-spinner');
    const addBtn      = document.getElementById('add-btn');
    const addBtnText  = addBtn.querySelector('.btn-text');

    addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        addAlertEl.className = 'alert';

        const name  = document.getElementById('emp-name').value.trim();
        const email = document.getElementById('emp-email').value.trim();

        if (!name || !email) {
            addAlertEl.textContent = 'Name and email are required.';
            addAlertEl.className = 'alert alert-error show';
            return;
        }

        addSpinner.style.display = 'block';
        addBtnText.textContent   = 'Adding…';
        addBtn.disabled          = true;

        try {
            const res  = await fetch(`${API}/employees`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.user_id, name, email }),
            });
            const data = await res.json();

            if (data.status === 'error') {
                addAlertEl.textContent = data.message;
                addAlertEl.className = 'alert alert-error show';
            } else {
                addForm.reset();
                showToast(`${name} added to your team.`, 'success');
                loadEmployees();
            }
        } catch {
            addAlertEl.textContent = 'Cannot connect to server.';
            addAlertEl.className = 'alert alert-error show';
        } finally {
            addSpinner.style.display = 'none';
            addBtnText.textContent   = 'Add Member';
            addBtn.disabled          = false;
        }
    });

    // ─── Edit (via prompt — simple and lightweight) ────────────────────────
    window.editEmployee = async (rowIndex, currentName, currentEmail) => {
        const newName  = prompt(`Edit name for "${currentName}":`, currentName);
        if (newName === null) return;
        const newEmail = prompt(`Edit email for "${currentName}":`, currentEmail);
        if (newEmail === null) return;

        const name  = newName.trim();
        const email = newEmail.trim();
        if (!name || !email) { showToast('Name and email cannot be empty.', 'error'); return; }

        try {
            const res  = await fetch(`${API}/employees/${rowIndex}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email }),
            });
            const data = await res.json();
            if (data.status === 'success') {
                showToast('Employee updated.', 'success');
                loadEmployees();
            }
        } catch {
            showToast('Failed to update employee.', 'error');
        }
    };

    // ─── Delete ────────────────────────────────────────────────────────────
    window.deleteEmployee = async (rowIndex, name) => {
        if (!confirm(`Remove "${name}" from your team?`)) return;
        try {
            await fetch(`${API}/employees/${rowIndex}`, { method: 'DELETE' });
            showToast(`${name} removed.`, 'success');
            loadEmployees();
        } catch {
            showToast('Failed to remove employee.', 'error');
        }
    };

    // Escape HTML for safe inline interpolation
    function esc(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Initial load
    loadEmployees();
});
