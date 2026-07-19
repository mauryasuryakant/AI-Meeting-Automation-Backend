/* Shared session helpers — included on every page */

const SESSION_KEY = 'af_user';

function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
    catch { return null; }
}

function setSession(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}

// Redirect to login if not logged in; returns user object if logged in
function requireAuth() {
    const user = getSession();
    if (!user) { window.location.href = 'index.html'; return null; }
    return user;
}

// Redirect to dashboard if already logged in (for auth pages)
function redirectIfLoggedIn() {
    if (getSession()) window.location.href = 'dashboard.html';
}

// Returns up to 2 uppercase initials from a name
function getUserInitials(name) {
    return (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}
