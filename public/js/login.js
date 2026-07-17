document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const errorBox = document.getElementById('errorBox');
  const submitBtn = document.getElementById('submitBtn');

  // Verificar si ya hay una sesión activa para redirigir directamente
  fetch('/api/auth/session')
    .then(res => res.json())
    .then(data => {
      if (data.loggedIn) {
        window.location.href = '/';
      }
    })
    .catch(err => console.error("Error al comprobar sesión:", err));

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = emailInput.value;
    const password = passwordInput.value;
    
    // Resetear UI
    errorBox.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Iniciando sesión...';

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión.');
      }

      // Redirigir al inicio si fue exitoso
      window.location.href = '/';
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Entrar al Sistema';
    }
  });
});
