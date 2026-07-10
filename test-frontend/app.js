document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle Handler
    const themeToggleBtn = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    const form = document.getElementById('analyze-form');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const loader = document.getElementById('loader');
    const errorMsg = document.getElementById('error-message');
    const resultContent = document.getElementById('result-content');

    // DOM Elements for Result
    const resTitle = document.getElementById('res-title');
    const resType = document.getElementById('res-type');
    const resDate = document.getElementById('res-date');
    const resParticipants = document.getElementById('res-participants');
    const resSummary = document.getElementById('res-summary');
    const resDecisions = document.getElementById('res-decisions');
    const resActionItems = document.getElementById('res-action-items');
    const resCommitments = document.getElementById('res-commitments');
    const resTranscript = document.getElementById('res-transcript');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Reset state
        errorMsg.textContent = '';
        resultContent.classList.add('hidden');
        
        const transcriptInput = document.getElementById('transcript').value.trim();
        const audioInput = document.getElementById('audio').files[0];

        if (!transcriptInput && !audioInput) {
            errorMsg.textContent = 'Please provide either a transcript or an audio file.';
            return;
        }

        // Prepare FormData
        const formData = new FormData();
        if (transcriptInput) {
            formData.append('transcript', transcriptInput);
        }
        if (audioInput) {
            formData.append('audio', audioInput);
        }

        // Loading state
        submitBtn.disabled = true;
        btnText.textContent = 'Analyzing...';
        loader.style.display = 'block';

        try {
            // Note: Update URL if backend runs on a different port
            const response = await fetch('http://127.0.0.1:8000/analyze-meeting', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok || data.status === 'error') {
                throw new Error(data.message || 'Something went wrong on the server.');
            }

            // Populate Results
            populateResults(data);

        } catch (error) {
            errorMsg.textContent = error.message;
        } finally {
            // Reset Loading state
            submitBtn.disabled = false;
            btnText.textContent = 'Analyze Meeting';
            loader.style.display = 'none';
        }
    });

    function populateResults(data) {
        resTitle.textContent = data.title || 'Untitled Meeting';
        resType.textContent = data.meeting_type || 'General';
        resDate.textContent = data.date || '-';
        resParticipants.textContent = data.participants || '-';
        resSummary.textContent = data.summary || 'No summary available.';
        
        resTranscript.textContent = data.transcript || 'No transcript available.';

        populateList(resDecisions, data.key_decisions);
        populateList(resActionItems, data.action_items);
        populateList(resCommitments, data.team_commitments);

        resultContent.classList.remove('hidden');
    }

    function populateList(element, items) {
        element.innerHTML = '';
        if (items && items.length > 0) {
            items.forEach(item => {
                const li = document.createElement('li');
                if (typeof item === 'object' && item !== null) {
                    if ('task' in item) {
                        li.innerHTML = `<strong>${item.task}</strong><br><small style="color: var(--text-muted)">Person: ${item.responsible_person || 'N/A'} | Deadline: ${item.deadline || 'N/A'} | Priority: ${item.priority || 'N/A'}</small>`;
                    } else if ('commitment' in item) {
                        li.innerHTML = `<strong>${item.person || 'N/A'}</strong>: ${item.commitment}`;
                    } else {
                        li.textContent = JSON.stringify(item);
                    }
                } else {
                    li.textContent = item;
                }
                element.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'None found';
            li.style.color = 'var(--text-muted)';
            li.style.fontStyle = 'italic';
            element.appendChild(li);
        }
    }
});
