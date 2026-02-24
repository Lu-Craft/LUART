(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', async () => {
        const errorDiv = document.getElementById('admin-error-msg');
        const contactTbody = document.querySelector('#table-public-contacts tbody');
        const quotesTbody = document.querySelector('#table-print-quotes tbody');

        try {
            // Check Auth
            const { data: { session }, error } = await window.supabaseClient.auth.getSession();
            if (error || !session) {
                window.location.href = 'login.html'; // Redirige a login temporalmente
                return;
            }

            document.getElementById('admin-user-display').innerHTML = `<i class="fas fa-shield-alt"></i> ADMIN: ${session.user.email}`;

            document.getElementById('admin-logout-btn').addEventListener('click', async (e) => {
                e.preventDefault();
                await window.supabaseClient.auth.signOut();
                window.location.href = 'index.html';
            });

            // 1. Fetch Public Contacts
            const fetchContacts = async () => {
                const { data, error } = await window.supabaseClient
                    .from('public_contacts')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                contactTbody.innerHTML = '';
                if (data.length === 0) {
                    contactTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay mensajes.</td></tr>';
                } else {
                    data.forEach(item => {
                        const tr = document.createElement('tr');
                        const dateObj = new Date(item.created_at);

                        let imgLinks = 'Ninguno';
                        if (item.reference_images && item.reference_images.length > 0) {
                            imgLinks = item.reference_images.map((img, index) => `<a href="${img}" target="_blank" class="link-url">Foto ${index + 1}</a>`).join(' | ');
                        }

                        tr.innerHTML = `
                            <td>${dateObj.toLocaleDateString()}<br><small>${dateObj.toLocaleTimeString()}</small></td>
                            <td>${item.client_name}</td>
                            <td><a href="mailto:${item.client_email}" class="link-url">${item.client_email}</a></td>
                            <td style="max-width:300px; white-space:pre-wrap;">${item.message}</td>
                            <td>${imgLinks}</td>
                        `;
                        contactTbody.appendChild(tr);
                    });
                }
            };

            // 2. Fetch Client Portal Quotes
            const fetchQuotes = async () => {
                const { data, error } = await window.supabaseClient
                    .from('print_quotes')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) {
                    // It will fail if admin doesn't have RLS permissions yet
                    throw error;
                }

                quotesTbody.innerHTML = '';
                if (data.length === 0) {
                    quotesTbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No hay ordenes privadas registradas.</td></tr>';
                } else {
                    data.forEach(item => {
                        const tr = document.createElement('tr');
                        const dateObj = new Date(item.created_at);

                        // We need the public URL for the models if they are in 3d_models bucket.
                        // Or we can just provide a download string calling Supabase API.
                        const { data: fileUrlData } = window.supabaseClient.storage
                            .from('3d_models')
                            .getPublicUrl(item.file_path);

                        tr.innerHTML = `
                            <td>${dateObj.toLocaleDateString()}<br><small>${dateObj.toLocaleTimeString()}</small></td>
                            <td style="font-size:0.7rem;">${item.user_id}</td>
                            <td><strong>${item.project_title}</strong></td>
                            <td>${item.preferred_material}</td>
                            <td style="max-width:200px;">${item.description}</td>
                            <td><a href="${fileUrlData.publicUrl}" target="_blank" class="link-url"><i class="fas fa-download"></i> Descargar (Si es público)</a></td>
                            <td style="color:var(--primary); font-weight:bold;">${item.status}</td>
                        `;
                        quotesTbody.appendChild(tr);
                    });
                }
            };

            await Promise.all([fetchContacts(), fetchQuotes()]);

        } catch (e) {
            console.error(e);
            errorDiv.textContent = '❌ ACCESO DENEGADO O ERROR DE LECTURA. Asegúrate de configurar las reglas RLS de Administrador en el panel de Supabase: ' + e.message;
        }

    });
})();
