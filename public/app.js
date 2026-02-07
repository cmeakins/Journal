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
  const todayBtn = document.getElementById('today-btn');

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
  const copyEntryBtn = document.getElementById('copy-entry-btn');
  const gratitudeInput = document.getElementById('gratitude');
  const feelingInput = document.getElementById('feeling');
  const onMindInput = document.getElementById('on-mind');

  // Timeline elements
  const timelineBtn = document.getElementById('timeline-btn');
  const timelinePanel = document.getElementById('timeline-panel');
  const closeTimelineBtn = document.getElementById('close-timeline-btn');
  const timelineList = document.getElementById('timeline-list');

  const mainArea = document.getElementById('main-area');
  const greetingEl = document.getElementById('greeting');

  let currentDate = new Date();
  let currentEntryId = null;
  let isDirty = false;
  let deleteTimeout = null;
  let currentUsername = '';

  // --- Utility functions ---

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

  function showToast(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  }

  function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  function markDirty() {
    isDirty = true;
  }

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  function updateGreeting() {
    const isToday = formatDate(currentDate) === formatDate(new Date());
    if (isToday && currentUsername) {
      const fullDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      greetingEl.innerHTML = `<h2>${getGreeting()}, ${currentUsername}</h2><p>${fullDate}</p>`;
      greetingEl.style.display = '';
    } else {
      greetingEl.style.display = 'none';
    }
  }

  // --- Auth ---

  async function checkAuth() {
    try {
      const res = await fetch('/auth-status');
      const data = await res.json();
      if (data.authenticated) {
        currentUsername = data.username;
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
    const btn = loginForm.querySelector('button');
    btn.textContent = 'Logging in...';
    btn.disabled = true;

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
        currentUsername = data.username;
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
    } finally {
      btn.textContent = 'Login';
      btn.disabled = false;
    }
  });

  // Register form submission
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    registerError.textContent = '';
    const btn = registerForm.querySelector('button');
    btn.textContent = 'Creating account...';
    btn.disabled = true;

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
        currentUsername = data.username;
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
    } finally {
      btn.textContent = 'Create Account';
      btn.disabled = false;
    }
  });

  // --- Entries ---

  async function loadEntries() {
    const dateStr = formatDate(currentDate);
    datePicker.value = dateStr;
    dateLabel.textContent = formatDisplayDate(currentDate);

    // Show/hide today button
    if (formatDate(currentDate) === formatDate(new Date())) {
      todayBtn.classList.add('hidden');
    } else {
      todayBtn.classList.remove('hidden');
    }

    updateGreeting();

    // Show loading state
    entriesList.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';

    try {
      const res = await fetch(`/api/entries/${dateStr}`);
      if (res.ok) {
        const entries = await res.json();
        renderEntries(entries);
      }
    } catch (e) {
      console.error('Failed to load entries:', e);
      entriesList.innerHTML = '';
    }
  }

  function renderEntries(entries) {
    entriesList.innerHTML = '';

    if (entries.length === 0) {
      entriesList.innerHTML = `
        <div class="no-entries">
          <div class="no-entries-icon">&#9997;&#65039;</div>
          <h3>No entries yet</h3>
          <p>Start writing to capture your thoughts for today.</p>
          <button class="no-entries-cta" onclick="document.getElementById('new-entry-btn').click()">Write an entry</button>
        </div>
      `;
      return;
    }

    entries.forEach((entry, index) => {
      const card = document.createElement('div');
      card.className = 'entry-card';
      card.dataset.id = entry.id;
      card.style.animationDelay = `${index * 0.05}s`;

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
    const parts = [];
    if (entry.gratitude) parts.push(entry.gratitude.substring(0, 60));
    if (entry.feeling) parts.push(entry.feeling.substring(0, 60));
    if (entry.on_mind) parts.push(entry.on_mind.substring(0, 60));
    if (parts.length === 0) return '<em>Empty entry</em>';
    return parts.join(' &middot; ');
  }

  // --- Modal ---

  function openModal() {
    entryModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    isDirty = false;
    resetDeleteBtn();
  }

  function closeModal() {
    if (isDirty) {
      if (!confirm('You have unsaved changes. Discard?')) return;
    }
    entryModal.classList.remove('active');
    document.body.style.overflow = '';
    currentEntryId = null;
    saveStatus.textContent = '';
    isDirty = false;
    resetDeleteBtn();
  }

  function openEntry(entry) {
    currentEntryId = entry.id;
    entryTime.textContent = formatTime(entry.created_at);
    gratitudeInput.value = entry.gratitude || '';
    feelingInput.value = entry.feeling || '';
    onMindInput.value = entry.on_mind || '';
    deleteEntryBtn.classList.remove('hidden');
    openModal();
    // Auto-resize textareas to fit content
    [gratitudeInput, feelingInput, onMindInput].forEach(autoResize);
  }

  function openNewEntry() {
    currentEntryId = null;
    entryTime.textContent = 'New Entry';
    gratitudeInput.value = '';
    feelingInput.value = '';
    onMindInput.value = '';
    deleteEntryBtn.classList.add('hidden');
    openModal();
    // Reset textarea heights
    [gratitudeInput, feelingInput, onMindInput].forEach(ta => {
      ta.style.height = 'auto';
    });
  }

  // --- Save ---

  async function saveEntry() {
    saveEntryBtn.textContent = 'Saving...';
    saveEntryBtn.disabled = true;

    try {
      let res;
      if (currentEntryId) {
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
        isDirty = false;
        saveEntryBtn.textContent = 'Saved!';
        saveEntryBtn.classList.add('saved');
        loadEntries();
        setTimeout(() => {
          saveEntryBtn.textContent = 'Save';
          saveEntryBtn.classList.remove('saved');
        }, 1500);
      } else {
        saveEntryBtn.textContent = 'Failed';
        setTimeout(() => { saveEntryBtn.textContent = 'Save'; }, 2000);
      }
    } catch (e) {
      saveEntryBtn.textContent = 'Failed';
      setTimeout(() => { saveEntryBtn.textContent = 'Save'; }, 2000);
    } finally {
      saveEntryBtn.disabled = false;
    }
  }

  // --- Delete with inline confirmation ---

  function resetDeleteBtn() {
    if (deleteTimeout) clearTimeout(deleteTimeout);
    deleteEntryBtn.textContent = 'Delete';
    deleteEntryBtn.classList.remove('confirming');
    deleteEntryBtn.dataset.confirming = 'false';
  }

  async function performDelete() {
    if (!currentEntryId) return;
    try {
      const res = await fetch(`/api/entry/${currentEntryId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        isDirty = false;
        closeModal();
        loadEntries();
      }
    } catch (e) {
      console.error('Failed to delete entry:', e);
    }
  }

  function handleDelete() {
    if (deleteEntryBtn.dataset.confirming === 'true') {
      clearTimeout(deleteTimeout);
      resetDeleteBtn();
      performDelete();
    } else {
      deleteEntryBtn.dataset.confirming = 'true';
      deleteEntryBtn.textContent = 'Confirm?';
      deleteEntryBtn.classList.add('confirming');
      deleteTimeout = setTimeout(resetDeleteBtn, 3000);
    }
  }

  // --- Copy to clipboard ---

  function copyEntry() {
    const lines = [];
    if (gratitudeInput.value) lines.push('Grateful for: ' + gratitudeInput.value);
    if (feelingInput.value) lines.push('Feeling: ' + feelingInput.value);
    if (onMindInput.value) lines.push('On my mind: ' + onMindInput.value);
    const text = lines.join('\n\n');
    if (!text) {
      showToast('Nothing to copy');
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      showToast('Copied to clipboard');
    }).catch(() => {
      showToast('Failed to copy');
    });
  }

  // --- Timeline ---

  async function openTimeline() {
    timelinePanel.classList.remove('hidden');
    // Small delay so the hidden→visible transition can trigger
    requestAnimationFrame(() => {
      timelinePanel.classList.add('active');
    });
    document.body.style.overflow = 'hidden';
    timelineList.innerHTML = '<div class="timeline-loading"><div class="spinner"></div></div>';

    try {
      const res = await fetch('/api/entries');
      if (res.ok) {
        const dates = await res.json();
        renderTimeline(dates);
      }
    } catch (e) {
      timelineList.innerHTML = '<div class="timeline-loading">Failed to load</div>';
    }
  }

  function closeTimeline() {
    timelinePanel.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => {
      timelinePanel.classList.add('hidden');
    }, 300);
  }

  function renderTimeline(dates) {
    timelineList.innerHTML = '';

    if (dates.length === 0) {
      timelineList.innerHTML = '<div class="timeline-loading">No entries yet</div>';
      return;
    }

    let currentMonth = '';

    dates.forEach(item => {
      const d = new Date(item.date + 'T12:00:00');
      const monthKey = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      // Add month header if new month
      if (monthKey !== currentMonth) {
        currentMonth = monthKey;
        const monthEl = document.createElement('div');
        monthEl.className = 'timeline-month';
        monthEl.textContent = monthKey;
        timelineList.appendChild(monthEl);
      }

      const el = document.createElement('div');
      el.className = 'timeline-date';

      const label = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });

      el.innerHTML = `
        <span class="timeline-date-label">${label}</span>
        <span class="timeline-date-count">${item.count}</span>
      `;

      el.addEventListener('click', () => {
        currentDate = new Date(item.date + 'T12:00:00');
        loadEntries();
        closeTimeline();
      });

      timelineList.appendChild(el);
    });
  }

  // --- Swipe navigation ---

  let touchStartX = 0;
  let touchEndX = 0;

  mainArea.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  mainArea.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 80) {
      if (diff > 0) {
        currentDate.setDate(currentDate.getDate() + 1);
      } else {
        currentDate.setDate(currentDate.getDate() - 1);
      }
      loadEntries();
    }
  }, { passive: true });

  // --- Textarea auto-resize and dirty tracking ---

  [gratitudeInput, feelingInput, onMindInput].forEach(ta => {
    ta.addEventListener('input', () => {
      autoResize(ta);
      markDirty();
    });
  });

  // --- Keyboard shortcuts ---

  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd+S to save when modal is open
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      if (entryModal.classList.contains('active')) {
        e.preventDefault();
        saveEntry();
      }
    }
    // Escape to close modal or timeline
    if (e.key === 'Escape') {
      if (entryModal.classList.contains('active')) {
        closeModal();
      } else if (timelinePanel.classList.contains('active')) {
        closeTimeline();
      }
    }
  });

  // --- Event listeners ---

  newEntryBtn.addEventListener('click', openNewEntry);
  saveEntryBtn.addEventListener('click', saveEntry);
  deleteEntryBtn.addEventListener('click', handleDelete);
  closeModalBtn.addEventListener('click', closeModal);
  copyEntryBtn.addEventListener('click', copyEntry);

  timelineBtn.addEventListener('click', openTimeline);
  closeTimelineBtn.addEventListener('click', closeTimeline);
  timelinePanel.addEventListener('click', (e) => {
    if (e.target === timelinePanel) closeTimeline();
  });

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

  todayBtn.addEventListener('click', () => {
    currentDate = new Date();
    loadEntries();
  });

  datePicker.addEventListener('change', () => {
    currentDate = new Date(datePicker.value + 'T12:00:00');
    loadEntries();
  });

  // Initialize
  checkAuth();
})();
