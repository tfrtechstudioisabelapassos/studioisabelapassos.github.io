const header = document.getElementById("header");
const menuToggle = document.getElementById("menuToggle");
const navWrapper = document.getElementById("navMenu");
const navLinks = document.querySelectorAll(".header .nav-link");
const sections = [...document.querySelectorAll("main section[id]")];
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function syncScrollLock() {
    const menuOpen = navWrapper?.classList.contains("active") && window.innerWidth <= 840;
    const modalOpen = modal?.classList.contains("active");
    document.body.classList.toggle("no-scroll", Boolean(menuOpen || modalOpen));
}

function toggleMenu(forceState) {
    if (!menuToggle || !navWrapper) return;

    const shouldOpen = typeof forceState === "boolean" ? forceState : !navWrapper.classList.contains("active");
    navWrapper.classList.toggle("active", shouldOpen);
    menuToggle.classList.toggle("active", shouldOpen);
    menuToggle.setAttribute("aria-expanded", String(shouldOpen));
    syncScrollLock();
}

if (menuToggle) {
    menuToggle.addEventListener("click", () => toggleMenu());
}

navLinks.forEach((link) => {
    link.addEventListener("click", () => toggleMenu(false));
});

document.addEventListener("click", (event) => {
    if (!navWrapper || !menuToggle) return;
    if (window.innerWidth > 840) return;

    const clickedInsideMenu = navWrapper.contains(event.target);
    const clickedToggle = menuToggle.contains(event.target);
    if (!clickedInsideMenu && !clickedToggle) {
        toggleMenu(false);
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        toggleMenu(false);
        closeInstructorModal();
    }

    if (event.key === "Tab") {
        document.body.classList.add("keyboard-nav");
    }
});

document.addEventListener("mousedown", () => {
    document.body.classList.remove("keyboard-nav");
});

function updateHeaderState() {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 24);
}

function updateActiveLink() {
    const scrollPosition = window.scrollY + (header?.offsetHeight || 0) + 140;
    let currentSectionId = sections[0]?.id || "";

    sections.forEach((section) => {
        if (scrollPosition >= section.offsetTop) {
            currentSectionId = section.id;
        }
    });

    navLinks.forEach((link) => {
        const isActive = link.getAttribute("href") === `#${currentSectionId}`;
        link.classList.toggle("active", isActive);
    });
}

const revealElements = document.querySelectorAll(".reveal");

if (!prefersReducedMotion && "IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("active");
                    observer.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.18,
            rootMargin: "0px 0px -8% 0px"
        }
    );

    revealElements.forEach((element) => revealObserver.observe(element));
} else {
    revealElements.forEach((element) => element.classList.add("active"));
}

const parallaxElements = [...document.querySelectorAll("[data-parallax]")];
let parallaxTicking = false;

function updateParallax() {
    if (prefersReducedMotion || window.innerWidth < 640) {
        parallaxElements.forEach((element) => element.style.setProperty("--parallax-offset", "0px"));
        return;
    }

    const viewportHeight = window.innerHeight;

    parallaxElements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.bottom < -80 || rect.top > viewportHeight + 80) return;

        const speed = Number(element.dataset.speed || 0.08);
        const centerOffset = rect.top + rect.height / 2 - viewportHeight / 2;
        const translateY = centerOffset * speed * -0.22;
        element.style.setProperty("--parallax-offset", `${translateY.toFixed(2)}px`);
    });
}

function requestParallax() {
    if (parallaxTicking) return;
    parallaxTicking = true;

    window.requestAnimationFrame(() => {
        updateHeaderState();
        updateActiveLink();
        updateParallax();
        parallaxTicking = false;
    });
}

window.addEventListener("scroll", requestParallax, { passive: true });
window.addEventListener("resize", () => {
    toggleMenu(false);
    updateHeaderState();
    updateActiveLink();
    updateParallax();
});

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
        const targetId = anchor.getAttribute("href");
        if (!targetId || targetId === "#") return;

        const target = document.querySelector(targetId);
        if (!target) return;

        event.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - (header?.offsetHeight || 0) - 20;

        window.scrollTo({
            top,
            behavior: prefersReducedMotion ? "auto" : "smooth"
        });
    });
});

const testimonialsWrapper = document.getElementById("testimonialsWrapper");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const carouselDots = document.getElementById("carouselDots");
const testimonialCards = testimonialsWrapper ? [...testimonialsWrapper.querySelectorAll(".testimonial-card")] : [];
let currentSlide = 0;
let autoPlayInterval = null;

function updateCarousel() {
    if (!testimonialsWrapper || testimonialCards.length === 0) return;

    testimonialsWrapper.style.transform = `translateX(-${currentSlide * 100}%)`;

    [...carouselDots.querySelectorAll(".carousel-dot")].forEach((dot, index) => {
        dot.classList.toggle("active", index === currentSlide);
    });
}

function goToSlide(index) {
    if (testimonialCards.length === 0) return;
    currentSlide = (index + testimonialCards.length) % testimonialCards.length;
    updateCarousel();
}

function createDots() {
    if (!carouselDots) return;

    testimonialCards.forEach((_, index) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "carousel-dot";
        dot.setAttribute("aria-label", `Ir para o depoimento ${index + 1}`);
        dot.addEventListener("click", () => goToSlide(index));
        carouselDots.appendChild(dot);
    });

    updateCarousel();
}

function startAutoplay() {
    if (prefersReducedMotion || testimonialCards.length <= 1) return;
    clearInterval(autoPlayInterval);
    autoPlayInterval = window.setInterval(() => goToSlide(currentSlide + 1), 5500);
}

function stopAutoplay() {
    clearInterval(autoPlayInterval);
}

if (testimonialCards.length > 0) {
    createDots();
    startAutoplay();

    prevBtn?.addEventListener("click", () => goToSlide(currentSlide - 1));
    nextBtn?.addEventListener("click", () => goToSlide(currentSlide + 1));
    testimonialsWrapper.addEventListener("mouseenter", stopAutoplay);
    testimonialsWrapper.addEventListener("mouseleave", startAutoplay);

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            stopAutoplay();
        } else {
            startAutoplay();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft") goToSlide(currentSlide - 1);
        if (event.key === "ArrowRight") goToSlide(currentSlide + 1);
    });
}

if (window.Swiper && document.querySelector(".mySwiper")) {
    new Swiper(".mySwiper", {
        loop: true,
        grabCursor: true,
        speed: 900,
        spaceBetween: 0,
        slidesPerView: 1,
        autoplay: prefersReducedMotion
            ? false
            : {
                  delay: 3200,
                  disableOnInteraction: false
              },
        pagination: {
            el: ".swiper-pagination",
            clickable: true
        },
        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev"
        }
    });
}

const instructorsData = {
    1: {
        name: "Dra. Isabela Passos",
        title: "Mestre em Ciências do Movimento Humano",
        specialty: "Especialista em reabilitação",
        image: "./img/perfil/isabela.jpeg",
        about: "Isabela Passos é fisioterapeuta graduada e mestre em Ciências do Movimento Humano pela Universidade do Estado de Santa Catarina. Sua atuação integra biomecânica, reabilitação e pilates clínico em atendimentos personalizados, com foco em transformação real na vida dos pacientes.",
        education: [
            "Graduação em Fisioterapia pela Universidade do Estado de Santa Catarina",
            "Mestrado em Ciências do Movimento Humano pela Universidade do Estado de Santa Catarina",
            "Pós-graduação em Fisioterapia Neurofuncional pela Faculdade Inspirar",
            "Pós-graduação em Acupuntura pela Faculdade Praktus"
        ],
        expertise: [
            "Especialização no método Pilates Posturelle",
            "Especialização no método Pilates Clínico Unicfisio",
            "Especialização em Terapia dos Meridianos pela Faculdade Inspirar"
        ]
    },
    2: {
        name: "Dra. Ariany Prazeres Ferreira Nunes",
        title: "Especialista em fisioterapia ortopédica",
        specialty: "Fisioterapia dermatofuncional com injetáveis",
        image: "./img/perfil/ariany.jpeg",
        about: "Ariany atua com fisioterapia ortopédica e dermatofuncional, trazendo uma abordagem cuidadosa, técnica e atualizada. Seu trabalho combina terapias manuais e recursos complementares para promover funcionalidade, conforto e confiança no processo de recuperação.",
        education: [
            "Graduação em Fisioterapia pela Estácio",
            "Pós-graduação em Fisioterapia Ortopédica com ênfase em Terapias Manuais pela Anhanguera",
            "Pós-graduação em Fisioterapia Dermatofuncional com Injetáveis pela Faculdade Nepuga"
        ],
        expertise: [
            "Pilates",
            "Liberação miofascial",
            "Ventosaterapia",
            "Dry needling",
            "Kinesio taping"
        ]
    },
    3: {
        name: "Felipe Ferreira Rôvere",
        title: "Graduado em administração",
        specialty: "Gestão em saúde e estratégia",
        image: "./img/perfil/felipe.jpeg",
        about: "Felipe é sócio e proprietário do Studio Isabela Passos. Sua atuação é essencial para o planejamento, a organização e a experiência do studio, garantindo uma operação alinhada ao cuidado, à excelência e ao crescimento sustentável.",
        education: ["Graduação em Administração pela FEAN."],
        expertise: ["Especialização em gestão em saúde."]
    }
};

const modal = document.getElementById("instructorModal");
const modalClose = document.getElementById("modalClose");
const modalOverlay = document.querySelector(".modal-overlay");
const instructorCards = document.querySelectorAll(".instructor-card");

function openInstructorModal(instructorId) {
    const data = instructorsData[instructorId];
    if (!data || !modal) return;

    document.getElementById("modalImage").src = data.image;
    document.getElementById("modalImage").alt = data.name;
    document.getElementById("modalName").textContent = data.name;
    document.getElementById("modalTitle").textContent = data.title;
    document.getElementById("modalSpecialty").textContent = data.specialty;
    document.getElementById("modalAbout").textContent = data.about;
    document.getElementById("modalEducation").innerHTML = data.education.map((item) => `<li>${item}</li>`).join("");
    document.getElementById("modalExpertise").innerHTML = data.expertise.map((item) => `<li>${item}</li>`).join("");

    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    syncScrollLock();
}

function closeInstructorModal() {
    if (!modal) return;
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
    syncScrollLock();
}

instructorCards.forEach((card) => {
    card.addEventListener("click", () => openInstructorModal(card.dataset.instructorId));
    card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openInstructorModal(card.dataset.instructorId);
        }
    });
});

modalClose?.addEventListener("click", closeInstructorModal);
modalOverlay?.addEventListener("click", closeInstructorModal);
document.querySelector(".modal-content")?.addEventListener("click", (event) => event.stopPropagation());

const leadForm = document.getElementById("leadForm");
const ctaSuccess = document.getElementById("ctaSuccess");

if (leadForm) {
    leadForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const nome = document.getElementById("nome").value.trim();
        const whatsapp = document.getElementById("whatsapp").value.trim();
        const mensagem = document.getElementById("mensagem").value.trim();

        const texto = [
            "Olá! Tenho interesse em conhecer mais sobre o Studio Isabela Passos.",
            "",
            nome ? `Nome: ${nome}` : "",
            whatsapp ? `WhatsApp: ${whatsapp}` : "",
            mensagem ? `Mensagem: ${mensagem}` : ""
        ]
            .filter(Boolean)
            .join("\n");

        const numeroWhatsApp = "5548988409816";
        const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(texto)}`;
        window.open(url, "_blank", "noopener,noreferrer");

        if (ctaSuccess) {
            ctaSuccess.textContent = "WhatsApp aberto com sua mensagem preenchida.";
        }
    });
}

updateHeaderState();
updateActiveLink();
updateParallax();
