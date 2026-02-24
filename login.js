(function () {
    'use strict';

    let isLoginMode = true;

    document.addEventListener('DOMContentLoaded', async () => {
        const authForm = document.getElementById('authForm');
        const toggleModeBtn = document.getElementById('toggle-auth-mode');
        const nameGroup = document.getElementById('name-group');
        const nameInput = document.getElementById('auth-name');
        const authTitle = document.getElementById('auth-title');
        const authSubtitle = document.getElementById('auth-subtitle');
        const authBtnText = document.getElementById('auth-btn-text');
        const errorDiv = document.getElementById('auth-error');
        const submitBtn = authForm.querySelector('button');

        // Comprobar si ya estamos logueados de forma segura (sin redirects automáticos)
        try {
            const { data: { session }, error } = await window.supabaseClient.auth.getSession();
            if (session && !error) {
                const container = document.querySelector('.contact-container');
                if (container) {
                    container.innerHTML = `
                        <h2 style="text-align:center; font-family:var(--font-heading); color:var(--text-light);">SESIÓN ACTIVA</h2>
                        <p style="text-align:center; color: var(--text-muted); margin-bottom: 2rem;">Ya te encuentras autenticado en la plataforma.</p>
                        <button onclick="window.location.href='dashboard.html'" class="btn primary full-width glow-effect">INGRESAR AL DASHBOARD</button>
                        <button onclick="window.supabaseClient.auth.signOut().then(() => window.location.reload())" style="margin-top: 1rem; background:transparent; border:1px solid rgba(255,255,255,0.2); color:white; padding: 0.8rem; width:100%; cursor:pointer; font-family:var(--font-heading);">CERRAR SESIÓN DE SEGURIDAD</button>
                    `;
                }
                return;
            }
        } catch (e) {
            console.error("Error checked session:", e);
        }

        toggleModeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            isLoginMode = !isLoginMode;
            errorDiv.textContent = '';

            if (isLoginMode) {
                nameGroup.style.display = 'none';
                nameInput.removeAttribute('required');
                authTitle.textContent = 'ENLACE SEGURO';
                authSubtitle.textContent = 'Acceso al túnel privado del cliente.';
                authBtnText.textContent = 'INICIAR CONEXIÓN';
                toggleModeBtn.textContent = 'SOLICITAR NUEVO ACCESO (REGISTRO)';
            } else {
                nameGroup.style.display = 'block';
                nameInput.setAttribute('required', 'true');
                authTitle.textContent = 'CREAR NÚCLEO';
                authSubtitle.textContent = 'Apertura de nuevo túnel para cliente.';
                authBtnText.textContent = 'REGISTRAR MI HUELLA';
                toggleModeBtn.textContent = 'YA TENGO UN ACCESO (INICIAR SESIÓN)';
            }
        });

        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorDiv.textContent = '';
            submitBtn.disabled = true;
            const originalText = authBtnText.textContent;
            authBtnText.textContent = 'AUTENTICANDO...';
            submitBtn.style.opacity = '0.7';

            const email = document.getElementById('auth-email').value;
            const password = document.getElementById('auth-password').value;
            const fullName = document.getElementById('auth-name').value;

            try {
                if (isLoginMode) {
                    const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                        email: email,
                        password: password,
                    });

                    if (error) throw error;

                    window.location.href = 'dashboard.html';
                } else {
                    const { data, error } = await window.supabaseClient.auth.signUp({
                        email: email,
                        password: password,
                        options: {
                            data: {
                                full_name: fullName
                            }
                        }
                    });

                    if (error) throw error;

                    if (data.user && data.user.identities && data.user.identities.length === 0) {
                        throw new Error("El usuario ya existe. Por favor inicie sesión.");
                    }

                    authBtnText.textContent = '¡REGISTRO EXITOSO!';
                    errorDiv.style.color = 'var(--primary)';
                    errorDiv.textContent = 'Revisa tu bandeja de entrada o intenta iniciar sesión directamente (si el auto-confirm está activado).';

                    setTimeout(() => {
                        toggleModeBtn.click(); // Cambiar a modo login
                    }, 4000);
                }
            } catch (error) {
                console.error("Auth error:", error);
                errorDiv.style.color = '#ff3333';
                errorDiv.textContent = `Error: ${error.message}`;
            } finally {
                submitBtn.disabled = false;
                if (isLoginMode || errorDiv.style.color === 'rgb(255, 51, 51)') {
                    authBtnText.textContent = originalText;
                }
                submitBtn.style.opacity = '1';
            }
        });
    });
})();
