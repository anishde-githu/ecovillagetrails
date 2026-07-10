const tabs = document.querySelectorAll('.p-tab');
  const signupForm = document.getElementById('signupForm');
  const loginForm = document.getElementById('loginForm');
  const alertBox = document.getElementById('alertBox');
  let selectedRole = 'owner';

  // If already logged in, go straight to the dashboard
  if (Auth.isLoggedIn()) window.location.href = 'partner-dashboard.html';

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const isSignup = tab.dataset.tab === 'signup';
      signupForm.style.display = isSignup ? 'block' : 'none';
      loginForm.style.display = isSignup ? 'none' : 'block';
      hideAlert();
    });
  });

  document.querySelectorAll('.p-role-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.p-role-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedRole = opt.dataset.role;
    });
  });

  function showAlert(msg, type = 'error') {
    alertBox.textContent = msg;
    alertBox.className = `p-alert show ${type}`;
  }
  function hideAlert() { alertBox.className = 'p-alert'; }

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();
    const btn = document.getElementById('signupBtn');
    btn.disabled = true; btn.innerHTML = '<span class="p-spinner"></span> Creating account...';

    try {
      const { token, user } = await Api.signup({
        name: document.getElementById('suName').value.trim(),
        email: document.getElementById('suEmail').value.trim(),
        phone: document.getElementById('suPhone').value.trim(),
        password: document.getElementById('suPassword').value,
        role: selectedRole,
      });
      Auth.setSession(token, user);
      window.location.href = 'partner-dashboard.html';
    } catch (err) {
      showAlert(err.message);
      btn.disabled = false; btn.textContent = 'Create partner account';
    }
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();
    const btn = document.getElementById('loginBtn');
    btn.disabled = true; btn.innerHTML = '<span class="p-spinner"></span> Logging in...';

    try {
      const { token, user } = await Api.login({
        email: document.getElementById('liEmail').value.trim(),
        password: document.getElementById('liPassword').value,
      });
      Auth.setSession(token, user);
      window.location.href = user.role === 'admin' ? 'admin-dashboard.html' : 'partner-dashboard.html';
    } catch (err) {
      showAlert(err.message);
      btn.disabled = false; btn.textContent = 'Log in';
    }
  });
