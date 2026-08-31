document.addEventListener("DOMContentLoaded", () => {
  
  // 1. Animate Gamification Counters
  const xpCounter = document.getElementById("xpCounter");
  const streakCounter = document.getElementById("streakCounter");

  if (xpCounter && streakCounter) {
    // Animate XP from 0 to 450
    gsap.to(xpCounter, {
      innerHTML: 450,
      duration: 2,
      snap: { innerHTML: 1 },
      ease: "power2.out"
    });

    // Animate Streak from 0 to 12
    gsap.to(streakCounter, {
      innerHTML: 12,
      duration: 1.5,
      snap: { innerHTML: 1 },
      ease: "power2.out"
    });
  }

  // 2. Animate Progress Bars on Scroll into View
  const progressFills = document.querySelectorAll('.q-progress-fill');
  
  const progressObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const fill = entry.target;
        const targetWidth = fill.getAttribute('data-width');
        fill.style.width = targetWidth + "%";
        observer.unobserve(fill);
      }
    });
  }, { threshold: 0.1 });

  progressFills.forEach(fill => {
    fill.style.width = "0%"; // Start at 0
    progressObserver.observe(fill);
  });

  // 3. Card Entry Animations
  gsap.fromTo(".q-card", 
    { y: 60, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "back.out(1.2)", delay: 0.2 }
  );

  // Removed legacy interactive play buttons logic - now handled by QuickLaunch inline onclicks

  // Simple Confetti Function using standard DOM elements
  window.triggerConfetti = function(x, y) {
    const colors = ['#0D9488', '#F97066', '#F59E0B', '#6366F1'];
    
    for (let i = 0; i < 30; i++) {
      const confetti = document.createElement('div');
      confetti.style.position = 'fixed';
      confetti.style.left = x + 'px';
      confetti.style.top = y + 'px';
      confetti.style.width = '8px';
      confetti.style.height = '8px';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      confetti.style.zIndex = '9999';
      confetti.style.pointerEvents = 'none';
      
      document.body.appendChild(confetti);
      
      const tx = (Math.random() - 0.5) * 200;
      const ty = (Math.random() - 1) * 200;
      
      gsap.to(confetti, {
        x: tx,
        y: ty,
        rotation: Math.random() * 360,
        opacity: 0,
        duration: 1 + Math.random(),
        ease: "power2.out",
        onComplete: () => confetti.remove()
      });
    }
  }
});
