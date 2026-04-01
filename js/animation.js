document.addEventListener("DOMContentLoaded", () => {
    const preloader = document.getElementById("preloader");
    const siteContent = document.getElementById("site-content");

    // Hide preloader after 2 seconds
    setTimeout(() => {
        if (preloader) {
            preloader.style.opacity = "0";
            preloader.addEventListener("transitionend", () => {
                preloader.style.display = "none";
            });
        }
        if (siteContent) {
            siteContent.style.opacity = "1";
            siteContent.style.transform = "translateY(0)";
        }
        
        // Trigger Bento Grid Staggered Animation
        const bentoCards = document.querySelectorAll(".bento-card");
        bentoCards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add("loaded");
            }, 150 * index + 100); // 150ms stagger per card
        });
    }, 2000);

    // ── Mouse Tracking Spotlight Effect ──
    const cards = document.querySelectorAll(".bento-card");
    const container = document.getElementById("site-content");
    
    // We bind the event to the document so the glow tracks smoothly even between cards
    document.addEventListener("mousemove", (e) => {
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            // Calculate mouse position relative to the card's top-left corner
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Set CSS variables for the radial glow pseudo-element
            card.style.setProperty("--mouse-x", `${x}px`);
            card.style.setProperty("--mouse-y", `${y}px`);
        });
    });

    // ── Intersection Observer for Scroll Reveals ──
    const observerOptions = {
        root: null,
        rootMargin: "0px",
        threshold: 0.15 // Fire when 15% of the element is visible
    };

    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                observer.unobserve(entry.target); // Stop observing once it's visible
            }
        });
    }, observerOptions);

    // Watch all elements marked for scroll reveal
    const revealElements = document.querySelectorAll(".reveal-on-scroll");
    revealElements.forEach(el => scrollObserver.observe(el));
});
