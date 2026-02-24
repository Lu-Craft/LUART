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
                const container = document.getElementById('authForm');
                const title = document.getElementById('auth-title');
                const subtitle = document.getElementById('auth-subtitle');
                const toggle = document.getElementById('toggle-auth-mode');
                if (container && title) {
                    const at = session.access_token;
                    const rt = session.refresh_token;

                    title.textContent = 'SESIÓN ACTIVA';
                    subtitle.textContent = 'Conexión segura ya establecida.';
                    toggle.style.display = 'none';

                    container.innerHTML = `
                        <button onclick="window.location.href='dashboard.html?access_token=${at}&refresh_token=${rt}'" class="w-full bg-luart-500 hover:bg-luart-600 text-white font-display font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 mb-3 shadow-[0_0_15px_rgba(255,102,0,0.3)]">ENTRAR AL DASHBOARD</button>
                        <button onclick="window.supabaseClient.auth.signOut().then(() => window.location.reload())" type="button" class="w-full bg-transparent border border-white/20 hover:bg-white/5 text-white py-3 px-4 rounded-lg transition-colors text-sm font-medium">REVOCAR CONEXIÓN</button>
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
            errorDiv.classList.add('hidden');

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
            errorDiv.classList.add('hidden');
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

                    const at = data.session.access_token;
                    const rt = data.session.refresh_token;
                    window.location.href = `dashboard.html?access_token=${at}&refresh_token=${rt}`;
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
                    errorDiv.classList.remove('hidden');
                    errorDiv.style.color = '#22c55e'; // Green success
                    errorDiv.textContent = 'Revisa tu bandeja de entrada o intenta iniciar sesión directamente (si el auto-confirm está activado).';

                    setTimeout(() => {
                        toggleModeBtn.click(); // Cambiar a modo login
                    }, 4000);
                }
            } catch (error) {
                console.error("Auth error:", error);
                errorDiv.classList.remove('hidden');
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
