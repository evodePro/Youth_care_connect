document.addEventListener("DOMContentLoaded", () => {
  // 1. Intersection Observer for scroll animations
  const revealElements = document.querySelectorAll(".reveal");

  const revealOptions = {
    threshold: 0.15,
    rootMargin: "0px 0px -50px 0px"
  };

  const revealOnScroll = new IntersectionObserver(function(entries, observer) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active");
        observer.unobserve(entry.target);
      }
    });
  }, revealOptions);

  revealElements.forEach(el => {
    revealOnScroll.observe(el);
  });

  // 2. Consent Checkboxes Logic
  const privacyCheck = document.getElementById("privacyCheck");
  const limitsCheck = document.getElementById("limitsCheck");
  const enterBtn = document.getElementById("enterBtn");

  function validateConsent() {
    if (privacyCheck.checked && limitsCheck.checked) {
      enterBtn.classList.add("active");
    } else {
      enterBtn.classList.remove("active");
    }
  }

  if (privacyCheck && limitsCheck && enterBtn) {
    privacyCheck.addEventListener("change", validateConsent);
    limitsCheck.addEventListener("change", validateConsent);
    
    // Initial check in case of browser autofill/back navigation
    validateConsent();

    enterBtn.addEventListener("click", () => {
      if (enterBtn.classList.contains("active")) {
        // Redirect to main platform (e.g., directory or home)
        window.location.href = "index.html";
      }
    });
  }

  // 3. User Rights Dashboard Interactions (Visual Feedback)
  const rightCards = document.querySelectorAll('.right-card');
  rightCards.forEach(card => {
    card.addEventListener('click', function() {
      // Create a ripple or simple visual feedback
      const originalText = this.querySelector('span').innerText;
      this.querySelector('span').innerText = "Action Initialized...";
      this.style.borderColor = "var(--color-primary)";
      this.style.background = "var(--color-primary-light)";
      
      setTimeout(() => {
        this.querySelector('span').innerText = originalText;
        this.style.borderColor = "";
        this.style.background = "";
      }, 1500);
    });
  });
});
