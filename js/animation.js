
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
    }, 2000);

    // Hero section animations
    const heroTitle = document.querySelector(".hero-title");
    const heroSubtitle = document.querySelector(".hero-subtitle");
    const heroBadges = document.querySelectorAll(".hero-badges .badge");
    const heroActions = document.querySelector(".hero-actions");
    const heroLinks = document.querySelector(".hero-links");
    const heroCard = document.querySelector(".hero-card");

    if (heroTitle) {
        heroTitle.style.opacity = "0";
        heroTitle.style.transform = "translateY(20px)";
        setTimeout(() => {
            heroTitle.style.transition = "opacity 0.5s ease, transform 0.5s ease";
            heroTitle.style.opacity = "1";
            heroTitle.style.transform = "translateY(0)";
        }, 2100);
    }

    if (heroSubtitle) {
        heroSubtitle.style.opacity = "0";
        heroSubtitle.style.transform = "translateY(20px)";
        setTimeout(() => {
            heroSubtitle.style.transition = "opacity 0.5s ease 0.2s, transform 0.5s ease 0.2s";
            heroSubtitle.style.opacity = "1";
            heroSubtitle.style.transform = "translateY(0)";
        }, 2100);
    }

    if (heroBadges.length > 0) {
        heroBadges.forEach((badge, index) => {
            badge.style.opacity = "0";
            badge.style.transform = "translateY(20px)";
            setTimeout(() => {
                badge.style.transition = `opacity 0.5s ease ${0.4 + index * 0.1}s, transform 0.5s ease ${0.4 + index * 0.1}s`;
                badge.style.opacity = "1";
                badge.style.transform = "translateY(0)";
            }, 2100);
        });
    }

    if (heroActions) {
        heroActions.style.opacity = "0";
        heroActions.style.transform = "translateY(20px)";
        setTimeout(() => {
            heroActions.style.transition = "opacity 0.5s ease 0.6s, transform 0.5s ease 0.6s";
            heroActions.style.opacity = "1";
            heroActions.style.transform = "translateY(0)";
        }, 2100);
    }

    if (heroLinks) {
        heroLinks.style.opacity = "0";
        heroLinks.style.transform = "translateY(20px)";
        setTimeout(() => {
            heroLinks.style.transition = "opacity 0.5s ease 0.8s, transform 0.5s ease 0.8s";
            heroLinks.style.opacity = "1";
            heroLinks.style.transform = "translateY(0)";
        }, 2100);
    }

    if (heroCard) {
        heroCard.style.opacity = "0";
        heroCard.style.transform = "translateY(20px)";
        setTimeout(() => {
            heroCard.style.transition = "opacity 0.5s ease 0.2s, transform 0.5s ease 0.2s";
            heroCard.style.opacity = "1";
            heroCard.style.transform = "translateY(0)";
        }, 2100);

        heroCard.addEventListener("mousemove", (e) => {
            const rect = heroCard.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const rotateX = (y / rect.height - 0.5) * -20;
            const rotateY = (x / rect.width - 0.5) * 20;
            heroCard.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
        });

        heroCard.addEventListener("mouseleave", () => {
            heroCard.style.transform = "perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)";
        });
    }
});
