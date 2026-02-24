(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', async () => {
        // ==== ARCHITECTURE: FILE:/// SANDBOX BYPASS ====
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('access_token');
        const urlRefresh = urlParams.get('refresh_token');
        if (urlToken && urlRefresh) {
            await window.supabaseClient.auth.setSession({
                access_token: urlToken,
                refresh_token: urlRefresh
            });
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        const adminName = document.getElementById('admin-name');
        const errDiv = document.getElementById('admin-error-msg');

        // Tabular bodies
        const tContacts = document.querySelector('#table-public-contacts tbody');
        const tQuotes = document.querySelector('#table-print-quotes tbody');
        const tPurchases = document.querySelector('#table-product-purchases tbody');
        const tFinance = document.querySelector('#table-payments-log tbody');

        // ==== AUTH & SECURITY CHECK ====
        try {
            const { data: { session }, error } = await window.supabaseClient.auth.getSession();
            if (!session || error) {
                if (error) await window.supabaseClient.auth.signOut();
                document.body.innerHTML = `
                    <div class="h-screen flex flex-col items-center justify-center bg-black text-white">
                        <h1 class="text-4xl text-red-500 mb-4 font-bold tracking-tighter">NIVEL 5 REQUERIDO</h1>
                        <p class="text-gray-400 mb-8 max-w-md text-center">Para acceder al panel ejecutivo de LUART debes iniciar sesión como Administrador en el portal principal.</p>
                        <a href="login.html" class="px-8 py-3 bg-white/10 hover:bg-white/20 transition-all rounded text-sm font-medium tracking-wide">ENTRAR AL PORTAL</a>
                    </div>
                `;
                return;
            }

            // Set Admin Name
            adminName.textContent = session.user.email;
            window.supabaseClient.from('profiles').select('full_name').eq('id', session.user.id).single()
                .then(({ data }) => { if (data && data.full_name) adminName.textContent = data.full_name; });

            // LOGOUT BINDING
            document.getElementById('admin-logout-btn').addEventListener('click', async (e) => {
                e.preventDefault();
                await window.supabaseClient.auth.signOut();
                window.location.href = 'index.html';
            });

            // ====== CEO DATA MODULES ======

            // 1. Fetch Contactos (ARREGLO DE FOTOS)
            const fetchContacts = async () => {
                const { data, error } = await window.supabaseClient.from('public_contacts').select('*').order('created_at', { ascending: false });
                if (error) throw error;
                tContacts.innerHTML = '';
                document.getElementById('stat-contacts').textContent = data.length || 0;

                if (data.length === 0) {
                    tContacts.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-gray-500 italic">Buzón vacío</td></tr>';
                    return;
                }
                data.forEach(item => {
                    const tr = document.createElement('tr');
                    const d = new Date(item.created_at);

                    // FOTO FIX: Renderizar como Botones Visuales si existen, usando un badge Tailwind
                    let imgLinks = '<span class="text-gray-600 italic">Sin archivos</span>';
                    if (item.reference_images && item.reference_images.length > 0) {
                        imgLinks = '<div class="flex flex-col gap-1 items-end">';
                        item.reference_images.forEach((img, i) => {
                            imgLinks += `<a href="${img}" target="_blank" class="text-xs bg-luart-500/10 text-luart-500 hover:bg-luart-500/20 px-2 py-1 rounded inline-flex items-center gap-1 border border-luart-500/20 transition-all"><i class="fas fa-image"></i> Ver Archivo ${i + 1}</a>`;
                        });
                        imgLinks += '</div>';
                    }

                    tr.innerHTML = `
                        <td class="px-6 py-4 whitespace-nowrap"><div class="font-medium text-white">${d.toLocaleDateString()}</div><div class="text-xs text-gray-500">${d.toLocaleTimeString()}</div></td>
                        <td class="px-6 py-4"><div class="font-medium text-blue-200">${item.client_name}</div><a href="mailto:${item.client_email}" class="text-xs text-gray-400 hover:text-white">${item.client_email}</a></td>
                        <td class="px-6 py-4 text-gray-300 text-sm italic border-l border-white/5 bg-white/5 p-4 rounded-lg my-2 block w-[90%]">${item.message}</td>
                        <td class="px-6 py-4 text-right align-top">${imgLinks}</td>
                    `;
                    tContacts.appendChild(tr);
                });
            };

            // 2. Fetch Cotizaciones 3D (Taller)
            const fetchQuotes = async () => {
                const { data, error } = await window.supabaseClient.from('print_quotes').select('*').order('created_at', { ascending: false });
                if (error) throw error;
                tQuotes.innerHTML = '';
                document.getElementById('stat-quotes').textContent = data.length || 0;

                if (data.length === 0) {
                    tQuotes.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500 italic">No hay órdenes en cola de manufactura.</td></tr>';
                    return;
                }
                data.forEach(item => {
                    const tr = document.createElement('tr');
                    const d = new Date(item.created_at);

                    let dlLink = `<a href="javascript:void(0)" class="text-xs text-luart-500 hover:underline">Solicitar Enlace Seguro</a>`;
                    tr.innerHTML = `
                        <td class="px-6 py-4 whitespace-nowrap"><div class="font-medium text-white">${d.toLocaleDateString()}</div><div class="text-xs text-gray-500">${d.toLocaleTimeString()}</div></td>
                        <td class="px-6 py-4"><span class="bg-white/10 text-gray-300 px-2 py-1 rounded text-xs font-mono">${item.user_id.substring(0, 8)}...</span></td>
                        <td class="px-6 py-4"><div class="font-medium text-white">${item.project_title}</div><div class="text-xs text-gray-400">Material Req: ${item.preferred_material}</div></td>
                        <td class="px-6 py-4"><span class="px-2 py-1 rounded-full text-[10px] uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30">En Cola</span></td>
                        <td class="px-6 py-4 text-right">${dlLink}</td>
                    `;
                    tQuotes.appendChild(tr);
                });
            };

            // 3. Fetch Producto Compras (Shop)
            const fetchPurchases = async () => {
                const { data, error } = await window.supabaseClient.from('product_purchases').select('*').order('created_at', { ascending: false });
                if (error) console.warn("No purchases table setup yet:", error);

                tPurchases.innerHTML = '';
                const rows = data || [];
                document.getElementById('stat-purchases').textContent = rows.length;

                if (rows.length === 0) {
                    tPurchases.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500 italic">No hay ventas directas en sistema.</td></tr>';
                    return;
                }
                rows.forEach(item => {
                    const tr = document.createElement('tr');
                    const d = new Date(item.created_at);
                    tr.innerHTML = `
                        <td class="px-6 py-4 whitespace-nowrap"><div class="font-medium text-white">${d.toLocaleDateString()}</div></td>
                        <td class="px-6 py-4 text-gray-300"><span class="font-mono text-xs opacity-50 block">${item.user_id}</span></td>
                        <td class="px-6 py-4 font-semibold text-purple-200">${item.product_name}</td>
                        <td class="px-6 py-4 font-mono text-white">€ ${item.price.toFixed(2)}</td>
                        <td class="px-6 py-4 text-right"><span class="text-purple-400 text-xs tracking-wider">${item.status}</span></td>
                    `;
                    tPurchases.appendChild(tr);
                });
            };

            // 4. Fetch Ingresos Economicos (Cashflow)
            const fetchFinances = async () => {
                const { data, error } = await window.supabaseClient.from('payments_log').select('*').order('created_at', { ascending: false });
                if (error) console.warn("No finance table setup yet:", error);

                tFinance.innerHTML = '';
                const rows = data || [];

                let revenueSum = 0;
                if (rows.length === 0) {
                    tFinance.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500 italic">No hay transacciones registradas este mes.</td></tr>';
                } else {
                    rows.forEach(item => {
                        revenueSum += parseFloat(item.amount);
                        const tr = document.createElement('tr');
                        const d = new Date(item.created_at);
                        tr.innerHTML = `
                            <td class="px-6 py-4 whitespace-nowrap"><div class="text-gray-400">${d.toLocaleDateString()}</div></td>
                            <td class="px-6 py-4"><span class="font-mono text-xs opacity-50 block">${item.user_id}</span></td>
                            <td class="px-6 py-4 text-white">${item.concept}</td>
                            <td class="px-6 py-4 font-mono text-green-400 font-bold">+ € ${parseFloat(item.amount).toFixed(2)}</td>
                            <td class="px-6 py-4 text-right"><span class="px-2 py-1 bg-green-500/10 text-green-500 text-xs rounded border border-green-500/20"><i class="fas fa-check-circle"></i> ${item.status}</span></td>
                        `;
                        tFinance.appendChild(tr);
                    });
                }
                document.getElementById('stat-revenue').textContent = `€ ${revenueSum.toFixed(2)}`;
            };

            // INIT
            await Promise.all([
                fetchContacts(),
                fetchQuotes(),
                fetchPurchases(),
                fetchFinances()
            ]);

        } catch (e) {
            console.error("Panel Fatal Error:", e);
            errDiv.textContent = `FATAL EXCEPTION: ${e.message}`;
            errDiv.classList.remove('hidden');
        }
    });

})();
