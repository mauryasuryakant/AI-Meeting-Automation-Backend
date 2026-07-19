/* Signup page logic */

const API = 'http://localhost:8000';


// ─── Google OAuth handler (called by Google Identity Services) ────────────────

async function handleGoogleCredential(response) {
    const alertEl = document.getElementById('alert');

    function showError(msg) {
        alertEl.textContent = msg;
        alertEl.className = 'alert alert-error show';
    }

    try {
        const res  = await fetch(`${API}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: response.credential }),
        });
        const data = await res.json();

        if (data.status === 'error') return showError(data.message);

        setSession(data.user);
        alertEl.textContent = 'Signed in with Google! Redirecting…';
        alertEl.className = 'alert alert-success show';
        setTimeout(() => window.location.href = 'dashboard.html', 800);

    } catch {
        showError('Google Sign-In failed. Make sure the backend is running.');
    }
}


document.addEventListener('DOMContentLoaded', () => {
    redirectIfLoggedIn();
});
