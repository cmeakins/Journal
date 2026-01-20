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

  const gratitudeInput = document.getElementById('gratitude');
  const feelingInput = document.getElementById('feeling');
  const onMindInput = document.getElementById('on-mind');
  const saveStatus = document.getElementById('save-status');
  const userDisplay = document.getElementById('user-display');

  let currentDate = new Date();
  let saveTimeout = null;

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
        loadEntry();
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
        loadEntry();
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
        loadEntry();
      } else {
        registerError.textContent = data.error || 'Registration failed';
      }
    } catch (e) {
      registerError.textContent = 'Connection error';
    }
  });

  async function loadEntry() {
    const dateStr = formatDate(currentDate);
    datePicker.value = dateStr;
    dateLabel.textContent = formatDisplayDate(currentDate);

    try {
      const res = await fetch(`/api/entry/${dateStr}`);
      if (res.ok) {
        const entry = await res.json();
        gratitudeInput.value = entry.gratitude || '';
        feelingInput.value = entry.feeling || '';
        onMindInput.value = entry.on_mind || '';
      }
    } catch (e) {
      console.error('Failed to load entry:', e);
    }
  }

  async function saveEntry() {
    const dateStr = formatDate(currentDate);
    saveStatus.textContent = 'Saving...';

    try {
      const res = await fetch(`/api/entry/${dateStr}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gratitude: gratitudeInput.value,
          feeling: feelingInput.value,
          on_mind: onMindInput.value
        })
      });

      if (res.ok) {
        saveStatus.textContent = 'Saved';
        setTimeout(() => {
          if (saveStatus.textContent === 'Saved') {
            saveStatus.textContent = '';
          }
        }, 2000);
      }
    } catch (e) {
      saveStatus.textContent = 'Save failed';
    }
  }

  function scheduleAutoSave() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveStatus.textContent = '';
    saveTimeout = setTimeout(saveEntry, 1000);
  }

  [gratitudeInput, feelingInput, onMindInput].forEach(input => {
    input.addEventListener('input', scheduleAutoSave);
  });

  prevDayBtn.addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() - 1);
    loadEntry();
  });

  nextDayBtn.addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() + 1);
    loadEntry();
  });

  datePicker.addEventListener('change', () => {
    currentDate = new Date(datePicker.value + 'T12:00:00');
    loadEntry();
  });

  // Initialize
  checkAuth();
})();
