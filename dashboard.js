(function () {
    'use strict';

    let currentUser = null;

    document.addEventListener('DOMContentLoaded', async () => {
        // ==== FILE:/// BYPASS (Firefox Isolated Origin Fix) ====
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('access_token');
        const urlRefresh = urlParams.get('refresh_token');
        if (urlToken && urlRefresh) {
            await window.supabaseClient.auth.setSession({
                access_token: urlToken,
                refresh_token: urlRefresh
            });
            // Clean the URL so it looks professional
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        const userDisplay = document.getElementById('user-display');
        const logoutBtn = document.getElementById('logout-btn');
        const fileInput = document.getElementById('qt-file');
        const fileNameDisplay = document.getElementById('file-name-display');
        const quoteForm = document.getElementById('new-quote-form');
        const qtBtnText = document.getElementById('qt-btn-text');
        const errorDiv = document.getElementById('quote-error');
        const quotesList = document.getElementById('my-quotes-list');
        const submitBtn = quoteForm.querySelector('button[type="submit"]');

        // ==== AUTH CHECK ====
        try {
            const { data: { session }, error } = await window.supabaseClient.auth.getSession();

            // Si no hay sesión, al login directo.
            if (!session || error) {
                console.error("Dashboard Auth Error:", error);

                if (error) {
                    await window.supabaseClient.auth.signOut();
                }

                document.body.innerHTML = `
                    <div style="min-height: 100vh; display: flex; flex-direction:column; align-items: center; justify-content: center; padding: 2rem; color: white; background: var(--bg-dark); text-align:center;">
                        <h2 style="font-family: var(--font-heading); color: #ff3333; margin-bottom: 1rem;">SESIÓN INVÁLIDA O INEXISTENTE</h2>
                        <p style="margin-bottom: 2rem; color: var(--text-muted);">
                           <strong>Diagnostic Info:</strong><br>
                           Session object: ${session ? 'Exists' : 'Null'}<br>
                           Error object: ${error ? JSON.stringify(error) : 'None'}<br>
                           LocalStorage (sb-token): ${localStorage.getItem('sb-kvtietlcmyubphenthfo-auth-token') ? 'Found' : 'Missing'}<br>
                           Origin: ${window.location.origin}<br>
                        </p>
                        <a href="login.html" class="btn primary glow-effect" style="text-decoration:none; display:inline-block;">VOLVER AL PORTAL</a>
                    </div>
                `;
                return;
            }
            currentUser = session.user;

            // Fetch Profile Name (No redirigir si falla, solo mostrar email)
            let profileName = currentUser.email;
            let isAdmin = false;
            try {
                const { data: profile } = await window.supabaseClient
                    .from('profiles')
                    .select('full_name, is_admin')
                    .eq('id', currentUser.id)
                    .single();

                if (profile) {
                    if (profile.full_name) profileName = profile.full_name;
                    if (profile.is_admin) isAdmin = true;
                }
            } catch (profileErr) {
                console.warn("No se pudo obtener el perfil extendido:", profileErr);
            }

            userDisplay.innerHTML = `<i class="fas fa-user-shield"></i> ${profileName}`;

            if (isAdmin) {
                const navLinks = document.querySelector('.nav-links');
                const adminLi = document.createElement('li');
                const { data } = await window.supabaseClient.auth.getSession();
                const at = data?.session?.access_token || '';
                const rt = data?.session?.refresh_token || '';
                adminLi.innerHTML = `<a href="admin.html?access_token=${at}&refresh_token=${rt}" style="color:#ff6600; font-family:var(--font-heading);"><i class="fas fa-crown"></i> PANEL DE ADMINISTRADOR</a>`;
                navLinks.insertBefore(adminLi, navLinks.firstChild);
            }

        } catch (e) {
            console.error("CRITICAL ERROR IN DASHBOARD INIT:", e);
            // Ya no redirigir aquí para evitar ciclos infinitos si falla el DOM o una extensión
            const userDisplay = document.getElementById('user-display');
            if (userDisplay) {
                userDisplay.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ERROR DE INTERFAZ`;
            }
            return;
        }

        // ==== LOGOUT ====
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await window.supabaseClient.auth.signOut();
            window.location.href = 'index.html';
        });

        // ==== LOAD EXISTING QUOTES ====
        const loadQuotes = async () => {
            try {
                const { data, error } = await window.supabaseClient
                    .from('print_quotes')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (!data || data.length === 0) {
                    quotesList.innerHTML = `
                        <div class="glass-card rounded-2xl p-6 flex flex-col items-center justify-center text-gray-500 h-64 border-dashed border-white/5">
                            <i class="fas fa-box-open text-3xl mb-4 text-gray-600"></i>
                            <p class="text-sm font-medium">No hay operaciones registradas en el núcleo.</p>
                        </div>
                    `;
                    return;
                }

                quotesList.innerHTML = '';
                data.forEach(quote => {
                    const card = document.createElement('div');
                    card.className = 'glass-card rounded-2xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform cursor-default';

                    const dateObj = new Date(quote.created_at);
                    const formattedDate = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString();

                    card.innerHTML = `
                        <div class="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-xl group-hover:bg-luart-500/10 transition-colors"></div>
                        <div class="flex justify-between items-start relative z-10">
                            <div>
                                <h4 class="font-display text-white text-lg font-bold tracking-tight mb-1">${quote.project_title}</h4>
                                <p class="text-xs text-gray-500 font-mono">${formattedDate}</p>
                            </div>
                            <span class="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-luart-500/30 text-luart-500 bg-luart-500/10">
                                ${quote.status.replace('_', ' ')}
                            </span>
                        </div>
                        <div class="mt-4 relative z-10 space-y-2">
                            <p class="text-sm text-gray-400"><span class="text-gray-500">Material:</span> <span class="text-gray-300 font-medium">${quote.preferred_material}</span></p>
                            ${quote.quoted_price ? `<p class="text-sm text-green-400 font-mono font-bold mt-2 pt-2 border-t border-white/10">FACTURACIÓN: €${quote.quoted_price}</p>` : ''}
                        </div>
                    `;
                    quotesList.appendChild(card);
                });

            } catch (err) {
                console.error("Error loading quotes:", err);
                quotesList.innerHTML = '<p style="color:#ff3333;">Error en sincronización de datos con el mainframe.</p>';
            }
        };

        loadQuotes();

        // ==== FILE INPUT UX ====
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                fileNameDisplay.textContent = `Listos para procesar: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
            } else {
                fileNameDisplay.textContent = '';
            }
        });

        // ==== FORM SUBMISSION ====
        quoteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorDiv.textContent = '';
            submitBtn.disabled = true;
            const origTxt = qtBtnText.textContent;
            submitBtn.style.opacity = '0.7';

            const title = document.getElementById('qt-title').value;
            const material = document.getElementById('qt-material').value;
            const desc = document.getElementById('qt-desc').value;
            const fileObj = fileInput.files[0];

            if (!fileObj) {
                errorDiv.textContent = 'SE REQUIERE ARCHIVO 3D.';
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
                return;
            }

            try {
                qtBtnText.textContent = 'INYECTANDO MODELO A STORAGE...';

                // RLS requires folder to be user's UUID
                const fileExt = fileObj.name.split('.').pop();
                const safeName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `${currentUser.id}/${safeName}`;

                const { error: uploadError } = await window.supabaseClient.storage
                    .from('3d_models')
                    .upload(filePath, fileObj);

                if (uploadError) throw new Error("Error subiendo el modelo 3D. Verifica los permisos de Storage.");

                qtBtnText.textContent = 'REGISTRANDO OPERACIÓN...';

                const { error: insertError } = await window.supabaseClient
                    .from('print_quotes')
                    .insert([{
                        user_id: currentUser.id,
                        project_title: title,
                        preferred_material: material,
                        description: desc,
                        file_path: filePath,
                        file_size_bytes: fileObj.size,
                        mime_type: fileObj.type || 'application/octet-stream'
                    }]);

                if (insertError) throw insertError;

                qtBtnText.textContent = '¡TRANSMISIÓN COMPLETADA!';
                quoteForm.reset();
                fileNameDisplay.textContent = '';

                // Reload list
                setTimeout(() => {
                    qtBtnText.textContent = origTxt;
                    submitBtn.disabled = false;
                    submitBtn.style.opacity = '1';
                    loadQuotes();
                }, 2000);

            } catch (err) {
                console.error("Submission error:", err);
                errorDiv.textContent = err.message || "Fallo en la conexión cifrada.";
                qtBtnText.textContent = "INTENTAR DE NUEVO";
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
            }
        });

    });
})();
