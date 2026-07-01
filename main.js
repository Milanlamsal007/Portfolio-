'use strict';

/* ============================================================
   MILAN LAMSAL — PORTFOLIO  |  main.js
   ============================================================ */

// ── Utilities ────────────────────────────────────────────────
const qs  = (s, el = document) => el.querySelector(s);
const qsa = (s, el = document) => [...el.querySelectorAll(s)];

/* ============================================================
   LOADER
   ============================================================ */
function initLoader() {
    const el   = qs('#loader');
    const bar  = qs('#boot-fill');
    const text = qs('#boot-pct');
    if (!el) return;

    let pct = 0;
    const bootLines = [qs('#bl-1'), qs('#bl-2'), qs('#bl-3'), qs('#bl-4')];

    const tick = setInterval(() => {
        pct = Math.min(pct + Math.random() * 15 + 4, 100);
        if (bar) bar.style.width = pct + '%';
        if (text) text.textContent = Math.floor(pct) + '%';

        // Update boot lines status
        if (pct > 25 && bootLines[0]) { bootLines[0].textContent = '[ DONE ]'; bootLines[0].className = 'bl-status done'; }
        if (pct > 50 && bootLines[1]) { bootLines[1].textContent = '[ DONE ]'; bootLines[1].className = 'bl-status done'; }
        if (pct > 75 && bootLines[2]) { bootLines[2].textContent = '[ DONE ]'; bootLines[2].className = 'bl-status done'; }
        if (pct >= 100 && bootLines[3]) { bootLines[3].textContent = '[ DONE ]'; bootLines[3].className = 'bl-status done'; }

        if (pct >= 100) {
            clearInterval(tick);
            setTimeout(hideLoader, 600);
        }
    }, 90);

    function hideLoader() {
        if (typeof gsap !== 'undefined') {
            gsap.to(el, {
                opacity: 0, duration: 0.8, ease: 'power2.inOut',
                onComplete: () => { el.style.display = 'none'; revealHero(); }
            });
        } else {
            el.style.transition = 'opacity .8s';
            el.style.opacity    = '0';
            setTimeout(() => { el.style.display = 'none'; revealHero(); }, 800);
        }
    }
}

/* ============================================================
   THREE.JS HERO SCENE
   ============================================================ */
function initHeroScene() {
    const canvas = qs('#bg-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const W = () => window.innerWidth;
    const H = () => window.innerHeight;

    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(58, W() / H(), 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    const clock    = new THREE.Clock();

    renderer.setSize(W(), H());
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    camera.position.z = 6;

    /* --- Main icosahedron ------------------------------------ */
    const icoGeo = new THREE.IcosahedronGeometry(1.8, 1);

    const solidMesh = new THREE.Mesh(icoGeo, new THREE.MeshPhongMaterial({
        color: 0x00d4ff, emissive: 0x001830,
        transparent: true, opacity: 0.12, side: THREE.DoubleSide
    }));
    const wireMesh = new THREE.Mesh(icoGeo, new THREE.MeshBasicMaterial({
        color: 0x00d4ff, wireframe: true, transparent: true, opacity: 0.42
    }));
    const outerMesh = new THREE.Mesh(
        new THREE.IcosahedronGeometry(2.25, 1),
        new THREE.MeshBasicMaterial({ color: 0x7b2fff, wireframe: true, transparent: true, opacity: 0.1 })
    );

    const mainGroup = new THREE.Group();
    mainGroup.add(solidMesh, wireMesh, outerMesh);
    mainGroup.position.set(3.2, 0, 0);
    scene.add(mainGroup);

    /* --- Particle field ------------------------------------- */
    const N = 2200;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
        pos[i*3]   = (Math.random() - .5) * 32;
        pos[i*3+1] = (Math.random() - .5) * 28;
        pos[i*3+2] = (Math.random() - .5) * 22;
        const t = Math.random();
        col[i*3]   = t > .5 ? 0    : .48;
        col[i*3+1] = t > .5 ? .83  : .18;
        col[i*3+2] = 1;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    pGeo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
    const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
        size: 0.025, vertexColors: true, transparent: true, opacity: 0.72
    }));
    scene.add(particles);

    /* --- Grid ----------------------------------------------- */
    const grid = new THREE.GridHelper(40, 50, 0x00d4ff, 0x00d4ff);
    grid.material.opacity = 0.03;
    grid.material.transparent = true;
    grid.position.y = -4;
    scene.add(grid);

    /* --- Lights --------------------------------------------- */
    scene.add(new THREE.AmbientLight(0x0a1a3a, 0.7));
    const pL1 = new THREE.PointLight(0x00d4ff, 2.5, 14);
    pL1.position.set(4, 4, 4);
    const pL2 = new THREE.PointLight(0x7b2fff, 1.8, 12);
    pL2.position.set(-4, -2, 3);
    scene.add(pL1, pL2);

    /* --- Mouse ─────────────────────────────────────────────── */
    const mouse = { x: 0, y: 0 };
    window.addEventListener('mousemove', e => {
        mouse.x =  (e.clientX / W() - .5) * 2;
        mouse.y = -(e.clientY / H() - .5) * 2;
    }, { passive: true });

    /* --- Resize ─────────────────────────────────────────────── */
    window.addEventListener('resize', () => {
        camera.aspect = W() / H();
        camera.updateProjectionMatrix();
        renderer.setSize(W(), H());
    });

    /* --- Animation loop ─────────────────────────────────────── */
    let raf;
    const hero = qs('#hero');

    function animate() {
        raf = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();
        const scrollY = window.scrollY;

        // Continuous auto-rotation
        mainGroup.rotation.x += 0.0025;
        mainGroup.rotation.y += 0.004;

        // Smooth mouse parallax layered on top
        mainGroup.rotation.x += (mouse.y * 0.012 - mainGroup.rotation.x * 0.04) * 0.05;
        mainGroup.rotation.y += (mouse.x * 0.012 - mainGroup.rotation.y * 0.04) * 0.05;

        // Gentle float + Scroll Parallax (moves up as you scroll down)
        mainGroup.position.y = Math.sin(t * 0.55) * 0.22 + (scrollY * 0.008);

        // Grid scroll parallax
        grid.position.y = -4 + (scrollY * 0.008);

        // Slow particle drift + subtle scroll parallax
        particles.rotation.y = t * 0.016;
        particles.rotation.x = t * 0.008;
        particles.position.y = scrollY * 0.003;

        // Camera micro-parallax
        camera.position.x += (mouse.x * 0.35 - camera.position.x) * 0.022;
        camera.position.y += (mouse.y * 0.22 - camera.position.y) * 0.022;

        // Pulsing key light
        pL1.intensity = 2.5 + Math.sin(t * 1.7) * 0.55;

        renderer.render(scene, camera);
    }
    animate();

    // Background runs continuously. No need for intersection observer pausing.
}

/* ============================================================
   HERO REVEAL  (runs after loader hides)
   ============================================================ */
function revealHero() {
    if (typeof gsap === 'undefined') {
        qsa('.hero-name, .hero-callsign, .hero-bio, .hero-btns, .hero-hud-bottom')
            .forEach(el => { el.style.opacity = '1'; });
        initTypewriter();
        initCounters();
        return;
    }

    const tl = gsap.timeline({ onComplete: () => { initTypewriter(); initCounters(); } });

    tl.from('.hero-name',       { opacity: 0, y: 42, duration: .9, ease: 'power3.out' }, 0.05)
      .from('.hero-callsign',    { opacity: 0, y: 28, duration: .85,ease: 'power3.out' }, 0.22)
      .from('.hero-bio',         { opacity: 0, y: 24, duration: .8, ease: 'power3.out' }, 0.38)
      .from('.hero-btns',        { opacity: 0, y: 20, duration: .8, ease: 'power3.out' }, 0.52)
      .from('.hero-hud-bottom',  { opacity: 0, y: 14, duration: .8, ease: 'power3.out' }, 0.65);
}

/* ============================================================
   TYPEWRITER
   ============================================================ */
function initTypewriter() {
    const el = qs('#typing-text');
    if (!el) return;

    const phrases = [
        'UI/UX Designer',
        'Web Developer',
        'Frontend Engineer',
        'Creative Thinker',
        'Computer Engineer',
    ];

    let pi = 0, ci = 0, deleting = false;

    function tick() {
        const phrase = phrases[pi];
        if (!deleting) {
            ci++;
            el.textContent = phrase.slice(0, ci);
            if (ci === phrase.length) {
                deleting = true;
                return setTimeout(tick, 1900);
            }
            setTimeout(tick, 100);
        } else {
            ci--;
            el.textContent = phrase.slice(0, ci);
            if (ci === 0) {
                deleting = false;
                pi = (pi + 1) % phrases.length;
                return setTimeout(tick, 380);
            }
            setTimeout(tick, 52);
        }
    }
    setTimeout(tick, 500);
}

/* ============================================================
   STAT COUNTERS  (triggered by scroll)
   ============================================================ */
function initCounters() {
    const counters = qsa('.counter-val');
    if (!counters.length) return;

    const run = (el) => {
        const target = parseInt(el.dataset.target, 10);
        if (isNaN(target)) return;
        let n = 0;
        const duration = 2000; // 2 seconds
        const startTime = performance.now();

        const update = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOutQuad = t => t * (2 - t);
            n = easeOutQuad(progress) * target;
            el.textContent = Math.floor(n);
            if (progress < 1) requestAnimationFrame(update);
            else el.textContent = target;
        };
        requestAnimationFrame(update);
    };

    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { run(e.target); obs.unobserve(e.target); } });
    }, { threshold: 0.5 });

    counters.forEach(el => obs.observe(el));
}

/* ============================================================
   GSAP SCROLL ANIMATIONS
   ============================================================ */
function initScrollAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        qsa('.csl-fill, .lss-bar div').forEach(f => { 
            const val = f.dataset.level || f.style.getPropertyValue('--w')?.replace('%', '');
            if (val) f.style.width = val + '%'; 
        });
        return;
    }
    gsap.registerPlugin(ScrollTrigger);

    /* Section headers */
    qsa('.section-head').forEach(el => {
        gsap.from(el, { opacity:0, y:44, duration:.85, ease:'power3.out',
            scrollTrigger:{ trigger:el, start:'top 85%', once:true }});
    });

    /* About */
    gsap.from('.about-info', { opacity:0, x:-56, duration:.85, ease:'power3.out',
        scrollTrigger:{trigger:'#about', start:'top 78%', once:true}});
    gsap.from('.about-cards', { opacity:0, x:56, duration:.85, ease:'power3.out',
        scrollTrigger:{trigger:'#about', start:'top 78%', once:true}});

    /* Skills cards */
    gsap.from('.loadout-slot', { opacity:0, y:50, duration:.8, stagger:.14, ease:'power3.out',
        scrollTrigger:{trigger:'.loadout-grid', start:'top 80%', once:true}});

    /* Skill bars */
    ScrollTrigger.create({
        trigger: '#skills', start: 'top 75%', once: true,
        onEnter: () => {
            qsa('.csl-fill, .lss-bar div').forEach(f => {
                const val = f.dataset.level || f.style.getPropertyValue('--w')?.replace('%', '');
                if (val) f.style.width = val + '%';
            });
        }
    });

    /* Weapon Wheel */
    gsap.from('.weapon-wheel', { opacity:0, scale:.88, duration:1, ease:'power3.out',
        scrollTrigger:{trigger:'.weapon-wheel', start:'top 80%', once:true}});

    /* Project cards */
    gsap.from('.mission-card', {
        opacity:0, y:56, duration:.8, stagger:.1, ease:'power3.out',
        clearProps:'transform,opacity',
        scrollTrigger:{trigger:'.missions-grid', start:'top 82%', once:true}
    });

    /* Timeline items */
    qsa('.sl-item').forEach((item, i) => {
        gsap.from(item, { opacity:0, x:-48, duration:.8, ease:'power3.out',
            scrollTrigger:{ trigger:item, start:'top 88%', once:true },
            delay: i * 0.08 });
    });

    /* Medals */
    gsap.from('.medal-card', { opacity:0, y:48, duration:.8, stagger:.14, ease:'power3.out',
        scrollTrigger:{trigger:'.medals-grid', start:'top 82%', once:true}});

    /* Contact */
    gsap.from('.comms-info',        { opacity:0, x:-48, duration:.8, ease:'power3.out',
        scrollTrigger:{trigger:'#contact', start:'top 78%', once:true}});
    gsap.from('.terminal-wrap',{ opacity:0, x: 48, duration:.8, ease:'power3.out',
        scrollTrigger:{trigger:'#contact', start:'top 78%', once:true}});
}

/* ============================================================
   3D TILT ON PROJECT CARDS
   ============================================================ */
function initTiltEffect() {
    qsa('.tilt-card').forEach(card => {
        card.style.transition = 'transform .18s ease, box-shadow .3s ease, border-color .3s ease';

        card.addEventListener('mousemove', e => {
            const r  = card.getBoundingClientRect();
            const xP = (e.clientX - r.left)  / r.width;
            const yP = (e.clientY - r.top)   / r.height;
            const rX = (yP - .5) * -16;
            const rY = (xP - .5) *  16;
            card.style.transform = `perspective(900px) rotateX(${rX}deg) rotateY(${rY}deg) translateZ(10px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0)';
        });
    });
}

/* ============================================================
   FLIP CARD — keyboard support
   ============================================================ */
function initFlipCards() {
    qsa('.flip-card').forEach(card => {
        card.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                card.classList.toggle('flipped');
                card.querySelector('.flip-card-inner').style.transform =
                    card.classList.contains('flipped') ? 'rotateY(180deg)' : '';
            }
        });
    });
}

/* ============================================================
   NAVBAR
   ============================================================ */
function initNavbar() {
    const navbar    = qs('#navbar');
    const hamburger = qs('#hamburger');
    const menu      = qs('#mobile-menu');
    const navLinks  = qsa('.nav-link');
    const sections  = qsa('section[id]');

    /* Scroll behaviour */
    const onScroll = () => {
        navbar.classList.toggle('scrolled', window.scrollY > 28);

        /* Active link highlighting */
        let current = '';
        sections.forEach(s => {
            if (window.scrollY >= s.offsetTop - 110) current = s.id;
        });
        navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + current));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // run once on load

    /* Hamburger */
    hamburger.addEventListener('click', () => {
        const open = menu.classList.toggle('open');
        hamburger.classList.toggle('active', open);
        hamburger.setAttribute('aria-expanded', open);
        menu.setAttribute('aria-hidden', !open);
    });

    /* Close mobile menu on link click */
    qsa('.mobile-link').forEach(l => {
        l.addEventListener('click', () => {
            menu.classList.remove('open');
            hamburger.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
            menu.setAttribute('aria-hidden', 'true');
        });
    });

    /* Close mobile menu on outside click */
    document.addEventListener('click', e => {
        if (menu.classList.contains('open') && !navbar.contains(e.target)) {
            menu.classList.remove('open');
            hamburger.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
            menu.setAttribute('aria-hidden', 'true');
        }
    });
}

/* ============================================================
   THEME TOGGLE
   ============================================================ */
function initThemeToggle() {
    const btn  = qs('#theme-toggle');
    const icon = qs('#theme-icon');
    const html = document.documentElement;
    if (!btn) return;

    const applyTheme = theme => {
        html.setAttribute('data-theme', theme);
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        localStorage.setItem('ml-theme', theme);
    };

    applyTheme(localStorage.getItem('ml-theme') || 'dark');

    btn.addEventListener('click', () => {
        applyTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
}

/* ============================================================
   CONTACT FORM
   ============================================================ */
function initContactForm() {
    const form    = qs('#contact-form');
    const success = qs('#form-success');
    const submitBtn = qs('#submit-btn');
    if (!form) return;

    form.addEventListener('submit', e => {
        e.preventDefault();

        /* Simple client-side validation */
        const name  = qs('#f-name',    form).value.trim();
        const email = qs('#f-email',   form).value.trim();
        const msg   = qs('#f-message', form).value.trim();
        if (!name || !email || !msg) return;

        const orig = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Sending…</span>';
        submitBtn.disabled  = true;

        const data = { name, email, subject: qs('#f-subject', form)?.value?.trim() || '', message: msg };

        fetch('https://formspree.io/f/YOUR_FORMSPREE_ENDPOINT', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        })
            .then(res => {
                if (!res.ok) throw new Error('Send failed');
                submitBtn.innerHTML = orig;
                submitBtn.disabled  = false;
                success.classList.add('show');
                form.reset();
                setTimeout(() => success.classList.remove('show'), 5500);
            })
            .catch(() => {
                submitBtn.innerHTML = orig;
                submitBtn.disabled  = false;
                alert('Transmission failed. Please try again later.');
            });
    });

    /* Focus icon colour */
    qsa('.input-wrapper input, .input-wrapper textarea', form).forEach(inp => {
        inp.addEventListener('focus', () => inp.closest('.input-wrapper').querySelector('i').style.color = 'var(--blue)');
        inp.addEventListener('blur',  () => inp.closest('.input-wrapper').querySelector('i').style.color = '');
    });
}

/* ============================================================
   SMOOTH SCROLL for all anchor links
   ============================================================ */
function initSmoothScroll() {
    document.addEventListener('click', e => {
        const a = e.target.closest('a[href^="#"]');
        if (!a) return;
        const target = qs(a.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
}

/* ============================================================
   CURSOR GLOW  (desktop only)
   ============================================================ */
function initCursorGlow() {
    if (window.matchMedia('(pointer:coarse)').matches) return;
    const glow = document.createElement('div');
    Object.assign(glow.style, {
        position:'fixed',width:'320px',height:'320px',borderRadius:'50%',
        pointerEvents:'none',zIndex:'0',
        background:'radial-gradient(circle,rgba(0,212,255,.045) 0%,transparent 70%)',
        transform:'translate(-50%,-50%)',top:'-999px',left:'-999px',
        transition:'top .05s,left .05s',
    });
    document.body.appendChild(glow);
    window.addEventListener('mousemove', e => {
        glow.style.left = e.clientX + 'px';
        glow.style.top  = e.clientY + 'px';
    }, { passive: true });
}

/* ============================================================
   EXPERIENCE — FLYING WORDS + TAG ENTRANCE
   ============================================================ */
function initExperienceAnimations() {
    /* Wrap each word in a span with stagger index */
    qsa('#experience .sl-card p').forEach(p => {
        const words = p.textContent.trim().split(/\s+/);
        p.innerHTML = words.map((w, i) =>
            `<span class="fly-word" style="--i:${i}">${w}</span>`
        ).join(' ');
    });

    /* Trigger fly-in when paragraph enters viewport */
    const wordObs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.querySelectorAll('.fly-word').forEach(w => w.classList.add('visible'));
            wordObs.unobserve(entry.target);
        });
    }, { threshold: 0.25 });

    qsa('#experience .sl-card p').forEach(p => wordObs.observe(p));

    /* Stagger tag pills in on scroll */
    qsa('#experience .slc-tags').forEach(tags => {
        const spans = [...tags.querySelectorAll('span')];
        spans.forEach(s => { s.style.opacity = '0'; s.style.transform = 'translateY(10px)'; });
        const tagObs = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                spans.forEach((s, i) => {
                    setTimeout(() => {
                        s.style.transition = 'opacity 0.35s ease, transform 0.35s ease, color 0.3s ease, border-color 0.3s ease, background 0.3s ease';
                        s.style.opacity = '1';
                        s.style.transform = 'translateY(0)';
                    }, i * 65 + 180);
                });
                tagObs.unobserve(entry.target);
            });
        }, { threshold: 0.4 });
        tagObs.observe(tags);
    });
}

/* ============================================================
   FOOTER YEAR
   ============================================================ */
function initYear() {
    const el = qs('#year');
    if (el) el.textContent = new Date().getFullYear();
}

/* ============================================================
   LETTER VIEWER
   ============================================================ */
function initLetterViewer() {
    const viewer  = qs('#letter-viewer');
    const frame   = qs('#lv-frame');
    const close   = qs('#lv-close');
    const dlBtn   = qs('#lv-download');
    const cards   = qsa('.letter-card');
    const backdrop = qs('.lv-backdrop');
    if (!viewer || !frame) return;

    const open = (src) => {
        frame.src = src;
        dlBtn.href = src;
        viewer.setAttribute('aria-hidden', 'false');
        viewer.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    const closeViewer = () => {
        viewer.classList.remove('active');
        viewer.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        setTimeout(() => { frame.src = ''; }, 400);
    };

    cards.forEach(c => c.addEventListener('click', () => {
        const iframe = c.querySelector('.letter-pdf');
        if (iframe) open(iframe.src);
    }));

    close.addEventListener('click', closeViewer);
    backdrop.addEventListener('click', closeViewer);

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeViewer();
    });
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    initHeroScene();
    initThemeToggle();
    initNavbar();
    initSmoothScroll();
    initScrollAnimations();
    initTiltEffect();
    initFlipCards();
    initContactForm();
    initCursorGlow();
    initYear();
    initExperienceAnimations();
    initLetterViewer();
    initLoader(); // loader calls revealHero() when done
});
