// Initialize GSAP
// Guard: ScrollTrigger is only loaded on index.html via CDN
if (typeof ScrollTrigger !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

document.addEventListener("DOMContentLoaded", () => {

  // =========================================
  // THEME SYSTEM (Light/Dark Mode)
  // =========================================
  const htmlElement = document.documentElement;

  // Initialize Theme
  const initTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const themeToApply = savedTheme || systemTheme;
    htmlElement.setAttribute('data-theme', themeToApply);
  };
  initTheme();

  // Use event delegation for theme toggle
  document.addEventListener('click', (e) => {
    const toggle = e.target.closest('.theme-toggle');
    if (toggle) {
      const currentTheme = htmlElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      htmlElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      gsap.fromTo(toggle, { scale: 0.8 }, { scale: 1, duration: 0.2, ease: "back.out(2)" });
    }
  });

  // =========================================
  // SMOOTH SCROLL FOR ANCHOR LINKS
  // =========================================
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // =========================================
  // CUSTOM CURSOR GLOW (HERO ONLY)
  // =========================================
  const hero = document.querySelector(".hero");
  if (hero) {
    const cursorGlow = document.createElement("div");
    cursorGlow.className = "cursor-glow";
    hero.appendChild(cursorGlow);

    hero.addEventListener("mousemove", (e) => {
      const rect = hero.getBoundingClientRect();
      gsap.to(cursorGlow, {
        x: e.clientX - rect.left - 150,
        y: e.clientY - rect.top - 150,
        duration: 0.8,
        ease: "power2.out"
      });
    });
  }

  // =========================================
  // ANTIGRAVITY FLOATING ORBS ANIMATION
  // =========================================
  document.querySelectorAll(".gravity-orb").forEach(orb => {
    gsap.set(orb, {
      x: Math.random() * window.innerWidth * 0.6,
      y: Math.random() * window.innerHeight * 0.6
    });

    function floatOrb() {
      gsap.to(orb, {
        x: "+=" + (Math.random() * 140 - 70),
        y: "+=" + (Math.random() * 100 - 50),
        rotation: "+=" + (Math.random() * 30 - 15),
        scale: 0.9 + Math.random() * 0.3,
        duration: 4 + Math.random() * 5,
        ease: "sine.inOut",
        onComplete: floatOrb
      });
    }
    floatOrb();
  });

  // =========================================
  // HERO CONTENT ENTRANCE
  // =========================================
  const heroElements = document.querySelectorAll(".hero .animate-up");
  heroElements.forEach(el => el.style.visibility = "visible");

  const heroTl = gsap.timeline();
  heroTl.fromTo(".hero .animate-up", 
    { y: 60, opacity: 0 },
    { y: 0, opacity: 1, duration: 1.2, stagger: 0.25, ease: "power3.out", delay: 0.3 }
  );

  // =========================================
  // NAVBAR SCROLL EFFECT
  // =========================================
  window.addEventListener("scroll", () => {
    const nav = document.querySelector(".navbar");
    if (nav) {
      if (window.scrollY > 50) {
        nav.classList.add("scrolled");
      } else {
        nav.classList.remove("scrolled");
      }
    }
  });

  // =========================================
  // PARALLAX SCROLL ON SECTIONS
  // =========================================
  if (typeof ScrollTrigger !== 'undefined') {
    document.querySelectorAll(".services, .cta-banner").forEach(section => {
      gsap.to(section, {
        backgroundPositionY: "30%",
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          scrub: 1
        }
      });
    });
  }

  // =========================================
  // FADE-IN ON SCROLL
  // =========================================
  document.querySelectorAll(".fade-in").forEach(el => {
    el.style.visibility = "visible";
    if (typeof ScrollTrigger !== 'undefined') {
      gsap.fromTo(el,
        { y: 40, opacity: 0 },
        {
          y: 0, opacity: 1,
          duration: 0.9,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            toggleActions: "play none none none"
          }
        }
      );
    } else {
      gsap.fromTo(el, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "power2.out" });
    }
  });

  // =========================================
  // SLIDE-UP CARDS ON SCROLL
  // =========================================
  document.querySelectorAll(".slide-up").forEach(el => {
    el.style.visibility = "visible";
    if (typeof ScrollTrigger !== 'undefined') {
      gsap.fromTo(el,
        { y: 100, opacity: 0 },
        {
          y: 0, opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
          }
        }
      );
    } else {
      gsap.fromTo(el, { y: 100, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power3.out" });
    }
  });

  // =========================================
  // SERVICE ROW STAGGER ENTRANCE
  // =========================================
  document.querySelectorAll(".service-row").forEach((row, i) => {
    if (typeof ScrollTrigger !== 'undefined') {
      gsap.fromTo(row,
        { x: -40, opacity: 0 },
        {
          x: 0, opacity: 1,
          duration: 0.7,
          delay: i * 0.15,
          ease: "power2.out",
          scrollTrigger: {
            trigger: row,
            start: "top 85%",
          }
        }
      );
    } else {
      gsap.fromTo(row, { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.7, delay: i * 0.15, ease: "power2.out" });
    }
  });

  // =========================================
  // TAG PILLS BOUNCE IN
  // =========================================
  document.querySelectorAll(".tag").forEach((tag, i) => {
    if (typeof ScrollTrigger !== 'undefined') {
      gsap.fromTo(tag,
        { scale: 0, opacity: 0 },
        {
          scale: 1, opacity: 1,
          duration: 0.5,
          delay: 0.5 + i * 0.08,
          ease: "back.out(2)",
          scrollTrigger: {
            trigger: tag,
            start: "top 90%",
          }
        }
      );
    } else {
      gsap.fromTo(tag, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, delay: 0.5 + i * 0.08, ease: "back.out(2)" });
    }
  });

  // =========================================
  // ANIMATED NUMBER COUNTERS
  // =========================================
  function animateCounter(stat) {
    const target = parseInt(stat.getAttribute("data-target"));
    const prefix = stat.getAttribute("data-prefix") || "";
    const suffix = stat.getAttribute("data-suffix") || "";

    stat.textContent = prefix + "0" + suffix;

    let obj = { val: 0 };
    gsap.to(obj, {
      val: target,
      duration: 2.5,
      delay: 0.4,
      ease: "power2.out",
      onUpdate: function() {
        let num = Math.floor(obj.val);
        stat.textContent = prefix + num.toLocaleString() + suffix;
      },
      onComplete: function() {
        stat.textContent = prefix + target.toLocaleString() + suffix;
      }
    });
  }

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll(".stat-number").forEach(stat => {
    counterObserver.observe(stat);
  });

  // =========================================
  // STAT CARD HOVER LIFT (ANTIGRAVITY FEEL)
  // =========================================
  document.querySelectorAll(".stat-item").forEach(card => {
    card.addEventListener("mouseenter", () => {
      gsap.to(card, { y: -14, scale: 1.04, boxShadow: "0 20px 50px rgba(13,148,136,0.15)", duration: 0.4, ease: "power2.out" });
    });
    card.addEventListener("mouseleave", () => {
      gsap.to(card, { y: 0, scale: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", duration: 0.4, ease: "power2.out" });
    });
  });

  // =========================================
  // TILT EFFECT ON QUIZ CARDS (3D)
  // =========================================
  document.querySelectorAll(".quiz-card").forEach(card => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 12;
      const rotateY = (centerX - x) / 12;

      gsap.to(card, {
        rotateX: rotateX,
        rotateY: rotateY,
        transformPerspective: 800,
        duration: 0.4,
        ease: "power2.out"
      });
    });

    card.addEventListener("mouseleave", () => {
      gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.6, ease: "elastic.out(1, 0.5)" });
    });
  });

  // =========================================
  // TESTIMONIAL AUTO-SCROLL
  // =========================================
  const slider = document.querySelector(".testimonial-slider");
  if (slider) {
    let scrollDir = 1;
    function autoScroll() {
      if (slider.scrollLeft >= slider.scrollWidth - slider.clientWidth - 5) scrollDir = -1;
      if (slider.scrollLeft <= 5) scrollDir = 1;
      slider.scrollBy({ left: scrollDir * 1, behavior: "auto" });
    }
    setInterval(autoScroll, 30);
  }

  // =========================================
  // FAQ CARD ENTRANCE STAGGER
  // =========================================
  document.querySelectorAll(".faq-card").forEach((card, i) => {
    if (typeof ScrollTrigger !== 'undefined') {
      gsap.fromTo(card,
        { x: i % 2 === 0 ? -30 : 30, opacity: 0 },
        {
          x: 0, opacity: 1,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: {
            trigger: card,
            start: "top 88%",
          }
        }
      );
    } else {
      gsap.fromTo(card, { x: i % 2 === 0 ? -30 : 30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.7, ease: "power2.out" });
    }
  });

  // =========================================
  // MAGNETIC BUTTON EFFECT
  // =========================================
  document.querySelectorAll(".btn-primary").forEach(btn => {
    btn.addEventListener("mousemove", (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(btn, { x: x * 0.2, y: y * 0.2, duration: 0.3, ease: "power2.out" });
    });
    btn.addEventListener("mouseleave", () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.4)" });
    });
  });

  // =========================================
  // NAVBAR SEARCH INTERACTION
  // =========================================
  const navSearchInput = document.getElementById("navSearchInput");
  if (navSearchInput) {
    navSearchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const query = navSearchInput.value.trim().toLowerCase();
        if (query) {
          // If on index, scroll to resources. If not, redirect.
          if (window.location.pathname.includes("index.html") || window.location.pathname === "/" || window.location.pathname.endsWith("/")) {
            const resourcesSection = document.getElementById("resources");
            if (resourcesSection) {
              resourcesSection.scrollIntoView({ behavior: "smooth" });
              navSearchInput.value = "";
              return;
            }
          }
          window.location.href = `quizzes.html?search=${encodeURIComponent(query)}`;
        }
      }
    });

    // Simple visual feedback on focus
    navSearchInput.addEventListener("focus", () => {
      gsap.to(".nav-search", { scale: 1.02, duration: 0.3 });
    });
    navSearchInput.addEventListener("blur", () => {
      gsap.to(".nav-search", { scale: 1, duration: 0.3 });
    });
  }

  // =========================================
  // FLOATING HELP BUTTON LOGIC
  // =========================================
  const floatingHelpBtn = document.getElementById("floatingHelpBtn");
  if (floatingHelpBtn) {
    // Pulse animation
    gsap.to(floatingHelpBtn, {
      y: -10,
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut"
    });

    floatingHelpBtn.addEventListener("click", () => {
      const helpSection = document.getElementById("help");
      if (helpSection) {
        helpSection.scrollIntoView({ behavior: "smooth" });
      }
    });

    // Hide/Show based on scroll position - hide at the very top
    window.addEventListener("scroll", () => {
      if (window.scrollY < 300) {
        gsap.to(floatingHelpBtn, { opacity: 0, scale: 0, duration: 0.3 });
      } else {
        gsap.to(floatingHelpBtn, { opacity: 1, scale: 1, duration: 0.3 });
      }
    });
  }

});
