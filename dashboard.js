(function () {
    'use strict';

    let currentUser = null;

    document.addEventListener('DOMContentLoaded', async () => {
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
            try {
                const { data: profile } = await window.supabaseClient
                    .from('profiles')
                    .select('full_name')
                    .eq('id', currentUser.id)
                    .single();

                if (profile && profile.full_name) {
                    profileName = profile.full_name;
                }
            } catch (profileErr) {
                console.warn("No se pudo obtener el perfil extendido:", profileErr);
                // No rompemos la ejecución, simplemente usamos el email como nombre
            }

            userDisplay.innerHTML = `<i class="fas fa-user-shield"></i> ${profileName}`;

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
                    quotesList.innerHTML = '<p style="color: var(--text-muted); text-align:center; padding: 2rem;">No hay operaciones registradas en el núcleo.</p>';
                    return;
                }

                quotesList.innerHTML = '';
                data.forEach(quote => {
                    const card = document.createElement('div');
                    card.className = 'quote-card';

                    const dateObj = new Date(quote.created_at);
                    const formattedDate = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString();

                    card.innerHTML = `
                        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                            <div>
                                <h4 style="font-family: var(--font-heading); color: var(--text-light); font-size:1.1rem; margin-bottom: 0.2rem;">${quote.project_title}</h4>
                                <p style="font-size: 0.8rem; color: var(--text-muted);">${formattedDate}</p>
                            </div>
                            <span class="status-badge">${quote.status.toUpperCase().replace('_', ' ')}</span>
                        </div>
                        <p style="margin-top: 1rem; color: var(--text-muted); font-size: 0.9rem;"><strong>Material:</strong> ${quote.preferred_material}</p>
                        ${quote.quoted_price ? `<p style="margin-top: 0.5rem; color: var(--primary); font-family: var(--font-heading);"><strong>PRECIO FIJADO: ${quote.quoted_price}€</strong></p>` : ''}
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
