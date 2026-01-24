(function() {
  const loginScreen = document.getElementById('login-screen');
  const registerScreen = document.getElementById('register-screen');
  const journalScreen = document.getElementById('journal-screen');

  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');

  const registerForm = document.getElementById('register-form');
  const registerError = document.getElementById('register-error');
  const regUsernameInput = document.getElementById('reg-username');
  const regPasswordInput = document.getElementById('reg-password');

  const showRegisterLink = document.getElementById('show-register');
  const showLoginLink = document.getElementById('show-login');

  const datePicker = document.getElementById('date-picker');
  const dateLabel = document.getElementById('date-label');
  const prevDayBtn = document.getElementById('prev-day');
  const nextDayBtn = document.getElementById('next-day');

  const entriesList = document.getElementById('entries-list');
  const newEntryBtn = document.getElementById('new-entry-btn');
  const saveStatus = document.getElementById('save-status');
  const userDisplay = document.getElementById('user-display');

  // Modal elements
  const entryModal = document.getElementById('entry-modal');
  const entryTime = document.getElementById('entry-time');
  const saveEntryBtn = document.getElementById('save-entry-btn');
  const deleteEntryBtn = document.getElementById('delete-entry-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const gratitudeInput = document.getElementById('gratitude');
  const feelingInput = document.getElementById('feeling');
  const onMindInput = document.getElementById('on-mind');

  let currentDate = new Date();
  let currentEntryId = null;

  function formatDate(date) {
    return date.toISOString().split('T')[0];
  }

  function formatDisplayDate(date) {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (formatDate(date) === formatDate(today)) {
      return 'Today';
    } else if (formatDate(date) === formatDate(yesterday)) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', options);
  }

  function formatTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  function showScreen(screen) {
    loginScreen.classList.add('hidden');
    registerScreen.classList.add('hidden');
    journalScreen.classList.add('hidden');
    screen.classList.remove('hidden');
  }

  async function checkAuth() {
    try {
      const res = await fetch('/auth-status');
      const data = await res.json();
      if (data.authenticated) {
        userDisplay.textContent = data.username;
        showScreen(journalScreen);
        loadEntries();
      } else {
        showScreen(loginScreen);
      }
    } catch (e) {
      showScreen(loginScreen);
    }
  }

  // Toggle between login and register screens
  showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginError.textContent = '';
    showScreen(registerScreen);
  });

  showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    registerError.textContent = '';
    showScreen(loginScreen);
  });

  // Login form submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';

    try {
      const res = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: usernameInput.value,
          password: passwordInput.value
        })
      });

      const data = await res.json();

      if (res.ok) {
        usernameInput.value = '';
        passwordInput.value = '';
        userDisplay.textContent = data.username;
        showScreen(journalScreen);
        loadEntries();
      } else {
        loginError.textContent = data.error || 'Login failed';
      }
    } catch (e) {
      loginError.textContent = 'Connection error';
    }
  });

  // Register form submission
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    registerError.textContent = '';

    try {
      const res = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsernameInput.value,
          password: regPasswordInput.value
        })
      });

      const data = await res.json();

      if (res.ok) {
        regUsernameInput.value = '';
        regPasswordInput.value = '';
        userDisplay.textContent = data.username;
        showScreen(journalScreen);
        loadEntries();
      } else {
        registerError.textContent = data.error || 'Registration failed';
      }
    } catch (e) {
      registerError.textContent = 'Connection error';
    }
  });

  // Load entries for current date
  async function loadEntries() {
    const dateStr = formatDate(currentDate);
    datePicker.value = dateStr;
    dateLabel.textContent = formatDisplayDate(currentDate);

    try {
      const res = await fetch(`/api/entries/${dateStr}`);
      if (res.ok) {
        const entries = await res.json();
        renderEntries(entries);
      }
    } catch (e) {
      console.error('Failed to load entries:', e);
    }
  }

  function renderEntries(entries) {
    entriesList.innerHTML = '';

    if (entries.length === 0) {
      entriesList.innerHTML = '<p class="no-entries">No entries yet. Click "+ New Entry" to start writing.</p>';
      return;
    }

    entries.forEach(entry => {
      const card = document.createElement('div');
      card.className = 'entry-card';
      card.dataset.id = entry.id;

      const time = formatTime(entry.created_at);
      const preview = getPreview(entry);

      card.innerHTML = `
        <div class="entry-card-time">${time}</div>
        <div class="entry-card-preview">${preview}</div>
      `;

      card.addEventListener('click', () => openEntry(entry));
      entriesList.appendChild(card);
    });
  }

  function getPreview(entry) {
    const text = entry.gratitude || entry.feeling || entry.on_mind || '';
    if (!text) return '<em>Empty entry</em>';
    const truncated = text.substring(0, 100);
    return truncated + (text.length > 100 ? '...' : '');
  }

  // Open existing entry in modal
  function openEntry(entry) {
    currentEntryId = entry.id;
    entryTime.textContent = formatTime(entry.created_at);
    gratitudeInput.value = entry.gratitude || '';
    feelingInput.value = entry.feeling || '';
    onMindInput.value = entry.on_mind || '';
    deleteEntryBtn.classList.remove('hidden');
    entryModal.classList.remove('hidden');
  }

  // Open modal for new entry (doesn't create in DB until save)
  function openNewEntry() {
    currentEntryId = null;
    entryTime.textContent = 'New Entry';
    gratitudeInput.value = '';
    feelingInput.value = '';
    onMindInput.value = '';
    deleteEntryBtn.classList.add('hidden');
    entryModal.classList.remove('hidden');
  }

  // Save entry (create if new, update if existing)
  async function saveEntry() {
    saveStatus.textContent = 'Saving...';

    try {
      let res;
      if (currentEntryId) {
        // Update existing entry
        res = await fetch(`/api/entry/${currentEntryId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gratitude: gratitudeInput.value,
            feeling: feelingInput.value,
            on_mind: onMindInput.value
          })
        });
      } else {
        // Create new entry
        res = await fetch('/api/entry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: formatDate(currentDate),
            gratitude: gratitudeInput.value,
            feeling: feelingInput.value,
            on_mind: onMindInput.value
          })
        });
        if (res.ok) {
          const entry = await res.json();
          currentEntryId = entry.id;
          deleteEntryBtn.classList.remove('hidden');
        }
      }

      if (res.ok) {
        saveStatus.textContent = 'Saved';
        loadEntries();
        setTimeout(() => {
          if (saveStatus.textContent === 'Saved') {
            saveStatus.textContent = '';
          }
        }, 2000);
      } else {
        saveStatus.textContent = 'Save failed';
      }
    } catch (e) {
      saveStatus.textContent = 'Save failed';
    }
  }

  // Delete current entry
  async function deleteEntry() {
    if (!currentEntryId) return;

    if (!confirm('Delete this entry?')) return;

    try {
      const res = await fetch(`/api/entry/${currentEntryId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        closeModal();
        loadEntries();
      }
    } catch (e) {
      console.error('Failed to delete entry:', e);
    }
  }

  function closeModal() {
    entryModal.classList.add('hidden');
    currentEntryId = null;
    saveStatus.textContent = '';
  }

  // Event listeners
  newEntryBtn.addEventListener('click', openNewEntry);
  saveEntryBtn.addEventListener('click', saveEntry);
  deleteEntryBtn.addEventListener('click', deleteEntry);
  closeModalBtn.addEventListener('click', closeModal);

  entryModal.addEventListener('click', (e) => {
    if (e.target === entryModal) closeModal();
  });

  prevDayBtn.addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() - 1);
    loadEntries();
  });

  nextDayBtn.addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() + 1);
    loadEntries();
  });

  datePicker.addEventListener('change', () => {
    currentDate = new Date(datePicker.value + 'T12:00:00');
    loadEntries();
  });

  // Initialize
  checkAuth();
})();
