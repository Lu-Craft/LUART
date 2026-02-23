/**
 * LUART Systems - Main Controller
 * Refactored for Security & Performance
 * @version 2.0 (SecDevOps Enhanced)
 */
(function () {
    'use strict';

    // --- CONFIGURATION & STATE ---
    const STATE = {
        mouseX: 0,
        mouseY: 0,
        cursorX: 0,
        cursorY: 0,
        lastTrailX: 0,
        lastTrailY: 0,
        isHovering: false
    };

    const DOM = {
        cursor: document.querySelector('.cursor-glow'),
        mobileMenuBtn: document.querySelector('.mobile-menu-btn'),
        navLinks: document.querySelector('.nav-links'),
        galleryGrid: document.getElementById('gallery-grid'),
        filterBtns: document.querySelectorAll('.filter-btn'),
        filterPills: document.querySelectorAll('.filter-pill'),
        contactForm: document.getElementById('contactForm'),
        glitchText: document.querySelector('.void-title-hero') || document.querySelector('.glitch'),
        canvasContainer: document.getElementById('canvas-container')
    };

    // --- CURSOR SYSTEM (Photon Tail) ---
    const initCursorSystem = () => {
        if (!DOM.cursor) return;

        document.addEventListener('mousemove', (e) => {
            STATE.mouseX = e.clientX;
            STATE.mouseY = e.clientY;
        });

        const animateCursor = () => {
            // Smooth Follow
            STATE.cursorX += (STATE.mouseX - STATE.cursorX) * 0.25;
            STATE.cursorY += (STATE.mouseY - STATE.cursorY) * 0.25;

            DOM.cursor.style.transform = `translate(${STATE.cursorX}px, ${STATE.cursorY}px)`;
            // Note: CSS handles the centering via translate(-50%, -50%) if set, 
            // but original code used left/top. Let's stick to left/top to match CSS exactly 
            // OR use transform which is more performant. 
            // Original code: cursor.style.left = cursorX + 'px';
            // Let's stick to original behavior to ensure 100% visual match.
            DOM.cursor.style.left = `${STATE.cursorX}px`;
            DOM.cursor.style.top = `${STATE.cursorY}px`;

            // Trail Logic
            const dist = Math.hypot(STATE.cursorX - STATE.lastTrailX, STATE.cursorY - STATE.lastTrailY);
            if (dist > 12) {
                createTrailDot(STATE.cursorX, STATE.cursorY);
                STATE.lastTrailX = STATE.cursorX;
                STATE.lastTrailY = STATE.cursorY;
            }

            requestAnimationFrame(animateCursor);
        };

        const createTrailDot = (x, y) => {
            const dot = document.createElement('div');
            dot.classList.add('trail-dot');
            const offsetX = (Math.random() - 0.5) * 4;
            const offsetY = (Math.random() - 0.5) * 4;
            dot.style.left = `${x + offsetX}px`;
            dot.style.top = `${y + offsetY}px`;
            document.body.appendChild(dot);

            setTimeout(() => dot.remove(), 500);
        };

        // Interactive Elements Hover
        const interactiveSelectors = 'a, button, .void-thumb, input, textarea';
        const interactiveElements = document.querySelectorAll(interactiveSelectors);

        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => DOM.cursor.classList.add('hovered'));
            el.addEventListener('mouseleave', () => DOM.cursor.classList.remove('hovered'));
        });

        animateCursor();
    };

    // --- MOBILE MENU ---
    const initMobileMenu = () => {
        if (!DOM.mobileMenuBtn || !DOM.navLinks) return;

        const toggleMenu = () => {
            DOM.navLinks.classList.toggle('active');
            const icon = DOM.mobileMenuBtn.querySelector('i');
            if (icon) {
                const isActive = DOM.navLinks.classList.contains('active');
                icon.classList.toggle('fa-bars', !isActive);
                icon.classList.toggle('fa-times', isActive);
            }
        };

        DOM.mobileMenuBtn.addEventListener('click', toggleMenu);

        DOM.navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                DOM.navLinks.classList.remove('active');
                const icon = DOM.mobileMenuBtn.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
        });
    };

    // --- GALLERY SYSTEM (Secure) ---
    const initGallery = () => {
        if (typeof galleryData === 'undefined') {
            console.warn('Security Alert: Gallery Data source missing.');
            return;
        }
        if (!DOM.galleryGrid) return;

        let currentFilters = {
            main: 'all',
            sub: 'all'
        };

        const getCategoryName = (sub) => {
            const names = {
                'artistic': 'Artístico',
                'technical': 'Técnico',
                'toys': 'Juguete',
                'prototypes': 'Prototipo'
            };
            return names[sub] || sub;
        };

        const renderGallery = (items) => {
            DOM.galleryGrid.innerHTML = ''; // Clear current content

            if (items.length === 0) {
                const emptyMsg = document.createElement('p');
                emptyMsg.style.cssText = 'color:#666; width:100%; text-align:center;';
                emptyMsg.textContent = 'No se encontraron artefactos en esta frecuencia.';
                DOM.galleryGrid.appendChild(emptyMsg);
                return;
            }

            items.forEach(item => {
                // Secure DOM Creation (No innerHTML)
                const card = document.createElement('div');
                card.className = 'gallery-item';
                card.dataset.category = item.category;
                card.dataset.subcategory = item.subcategory;

                // 1. Content Wrapper
                const content = document.createElement('div');
                content.className = 'card-content';

                // 2. Image Container
                const imgContainer = document.createElement('div');
                imgContainer.className = 'card-image w-full h-full';

                const img = document.createElement('img');
                img.src = (item.images && item.images.length > 0) ? item.images[0] : 'placeholder.jpg';
                img.alt = item.title; // Safe text
                img.loading = 'lazy';
                img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';

                imgContainer.appendChild(img);

                // 3. Overlay
                const overlay = document.createElement('div');
                overlay.className = 'card-overlay';

                const title = document.createElement('h3');
                title.textContent = item.title; // Safe text

                const catLabel = document.createElement('p');
                catLabel.style.cssText = 'color:var(--neon-orange); font-size:0.8rem; letter-spacing:1px; margin-top:0.2rem;';
                catLabel.textContent = getCategoryName(item.subcategory).toUpperCase();

                overlay.appendChild(title);
                overlay.appendChild(catLabel);

                // Author Badge (Conditional)
                if (item.category === 'others' && item.author) {
                    const badge = document.createElement('span');
                    badge.className = 'author-badge';

                    const icon = document.createElement('i');
                    icon.className = 'fas fa-user-circle';

                    // Helper text node to avoid innerHTML even for icon+text pattern
                    badge.appendChild(icon);
                    badge.appendChild(document.createTextNode(` ${item.author}`));

                    overlay.appendChild(badge);
                }

                // Assemble Card
                content.appendChild(imgContainer);
                content.appendChild(overlay);
                card.appendChild(content);

                // Interaction
                card.addEventListener('click', () => {
                    // Navigate securely
                    const safeId = encodeURIComponent(item.id);
                    window.location.href = `product.html?id=${safeId}`;
                });

                DOM.galleryGrid.appendChild(card);
            });
        };

        const applyFilters = () => {
            const filtered = galleryData.filter(item => {
                const matchMain = currentFilters.main === 'all' || item.category === currentFilters.main;
                const matchSub = currentFilters.sub === 'all' || item.subcategory === currentFilters.sub;
                return matchMain && matchSub;
            });
            renderGallery(filtered);
        };

        // Event Listeners
        DOM.filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                DOM.filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilters.main = btn.dataset.filter;
                applyFilters();
            });
        });

        DOM.filterPills.forEach(btn => {
            btn.addEventListener('click', () => {
                DOM.filterPills.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilters.sub = btn.dataset.subfilter;
                applyFilters();
            });
        });

        // Initial Render
        renderGallery(galleryData);
    };

    // --- THREE.JS SCENE ---
    const initThreeJS = () => {
        const container = DOM.canvasContainer;
        if (!container || !window.THREE) return;

        // Cleanup
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        try {
            const scene = new THREE.Scene();
            const width = container.clientWidth || window.innerWidth;
            const height = container.clientHeight || window.innerHeight;

            const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
            camera.position.z = 22;

            const renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: true,
                powerPreference: "high-performance"
            });
            renderer.setSize(width, height);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            container.appendChild(renderer.domElement);

            // Resize Handler
            window.addEventListener('resize', () => {
                const newWidth = container.clientWidth;
                const newHeight = container.clientHeight;
                renderer.setSize(newWidth, newHeight);
                camera.aspect = newWidth / newHeight;
                camera.updateProjectionMatrix();
            });

            // Geometry
            const geometry = new THREE.TorusKnotGeometry(10, 3, 100, 16);
            const material = new THREE.MeshPhongMaterial({
                color: 0xff6600,
                emissive: 0x441100,
                specular: 0xffffff,
                shininess: 80,
                wireframe: true
            });
            const torusKnot = new THREE.Mesh(geometry, material);
            scene.add(torusKnot);

            // Lights
            const pointLight = new THREE.PointLight(0xff6600, 2, 100);
            pointLight.position.set(20, 20, 20);
            scene.add(pointLight);

            const blueLight = new THREE.PointLight(0x0044ff, 1, 100);
            blueLight.position.set(-20, -10, 20);
            scene.add(blueLight);

            // Animation
            let mouseXNorm = 0;
            let mouseYNorm = 0;

            document.addEventListener('mousemove', (event) => {
                mouseXNorm = (event.clientX / window.innerWidth) * 2 - 1;
                mouseYNorm = -(event.clientY / window.innerHeight) * 2 + 1;
            });

            const animate = function () {
                requestAnimationFrame(animate);
                torusKnot.rotation.x += 0.002;
                torusKnot.rotation.y += 0.003;
                torusKnot.rotation.x += mouseYNorm * 0.02;
                torusKnot.rotation.y += mouseXNorm * 0.02;
                renderer.render(scene, camera);
            };

            animate();

        } catch (e) {
            console.warn('WebGL Error:', e);
        }
    };

    // --- UTILITIES ---
    const initUtilities = () => {
        // Smooth Scroll
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) target.scrollIntoView({ behavior: 'smooth' });
            });
        });

        // Scroll Reveal Observer
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add('visible');
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('section').forEach(section => {
            section.classList.add('hidden');
            observer.observe(section);
        });

        // Glitch Effect
        if (DOM.glitchText) {
            setInterval(() => {
                if (Math.random() > 0.95) {
                    DOM.glitchText.style.textShadow = '4px 0 #ff6600';
                    setTimeout(() => DOM.glitchText.style.textShadow = '0 0 50px rgba(0,0,0,0.8)', 100);
                }
            }, 2000);
        }
    };

    // --- FORMS ---
    const initForms = () => {
        if (!DOM.contactForm) return;

        DOM.contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = DOM.contactForm.querySelector('button');
            const btnText = btn.querySelector('.btn-text');

            const inputs = DOM.contactForm.querySelectorAll('input, textarea');
            const clientName = inputs[0].value;
            const clientEmail = inputs[1].value;
            const message = inputs[2].value;

            btn.disabled = true;
            btnText.textContent = 'ENLACE EN PROCESO...';
            btn.style.opacity = '0.7';
            btn.style.cursor = 'wait';

            try {
                // Using the global client from supabaseClient.js
                const { error } = await window.supabaseClient
                    .from('public_contacts')
                    .insert([{ client_name: clientName, client_email: clientEmail, message }]);

                if (error) throw error;

                DOM.contactForm.innerHTML = ''; // Clear

                const wrapper = document.createElement('div');
                wrapper.style.cssText = 'text-align:center; padding: 2rem;';

                const icon = document.createElement('i');
                icon.className = 'fas fa-check-circle';
                icon.style.cssText = 'font-size: 3rem; color: var(--primary); margin-bottom: 1rem;';

                const title = document.createElement('h3');
                title.style.cssText = 'font-family: var(--font-heading); margin-bottom: 1rem;';
                title.textContent = 'ENLACE ESTABLECIDO';

                const msg = document.createElement('p');
                msg.style.cssText = 'color: var(--text-muted);';
                msg.textContent = 'Tu mensaje ha sido cifrado y transmitido. Recibirás respuesta pronto.';

                wrapper.appendChild(icon);
                wrapper.appendChild(title);
                wrapper.appendChild(msg);

                DOM.contactForm.appendChild(wrapper);

            } catch (error) {
                console.error('Submission Error:', error);
                btnText.textContent = 'ERROR DE ENLACE';
                btn.style.opacity = '1';
                setTimeout(() => {
                    btnText.textContent = 'REINTENTAR MENSAJE';
                    btn.disabled = false;
                    btn.style.cursor = 'pointer';
                }, 3000);
            }
        });
    };

    // --- INITIALIZATION ---
    document.addEventListener('DOMContentLoaded', () => {
        initCursorSystem();
        initMobileMenu();
        initGallery();
        initThreeJS();
        initUtilities();
        initForms();
    });

})(); // End IIFE
