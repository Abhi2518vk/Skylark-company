// Skylark Elevators And Fabrication Company - Main JavaScript

document.addEventListener('DOMContentLoaded', () => {
  // Mobile Navigation Toggle
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      const icon = mobileToggle.querySelector('i');
      if (icon) {
        if (navMenu.classList.contains('active')) {
          icon.classList.remove('fa-bars');
          icon.classList.add('fa-xmark');
        } else {
          icon.classList.remove('fa-xmark');
          icon.classList.add('fa-bars');
        }
      }
    });

    // Close menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        const icon = mobileToggle.querySelector('i');
        if (icon) {
          icon.classList.remove('fa-xmark');
          icon.classList.add('fa-bars');
        }
      });
    });
  }

  // Hero Section Auto Slideshow (Every 2 seconds)
  const slides = document.querySelectorAll('.hero-slider .slide');
  const dots = document.querySelectorAll('.slider-dots .dot');
  let currentSlide = 0;
  let slideInterval;

  function showSlide(index) {
    if (slides.length === 0) return;

    // Wrap around index
    if (index >= slides.length) {
      currentSlide = 0;
    } else if (index < 0) {
      currentSlide = slides.length - 1;
    } else {
      currentSlide = index;
    }

    slides.forEach((slide, i) => {
      if (i === currentSlide) {
        slide.classList.add('active');
      } else {
        slide.classList.remove('active');
      }
    });

    dots.forEach((dot, i) => {
      if (i === currentSlide) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  function startSlideshow() {
    stopSlideshow();
    slideInterval = setInterval(() => {
      showSlide(currentSlide + 1);
    }, 2000); // Sliding per 2 seconds
  }

  function stopSlideshow() {
    if (slideInterval) {
      clearInterval(slideInterval);
    }
  }

  // Initialize Slideshow
  if (slides.length > 0) {
    showSlide(0);
    startSlideshow();

    // Dot navigation
    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        showSlide(idx);
        startSlideshow(); // Reset timer
      });
    });

    // Pause on hover
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
      heroSection.addEventListener('mouseenter', stopSlideshow);
      heroSection.addEventListener('mouseleave', startSlideshow);
    }
  }

  // Active Link Highlight on Scroll
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;

    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 100;
      const sectionId = current.getAttribute('id');
      const navItem = document.querySelector(`.nav-menu a[href*=${sectionId}]`);

      if (navItem) {
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
          navItem.classList.add('active');
        } else {
          navItem.classList.remove('active');
        }
      }
    });
  });

  // Parallax Effect on Scroll for Banner Elements
  const parallaxBoxes = document.querySelectorAll('.parallax-box');
  let ticking = false;

  function updateParallax() {
    const windowHeight = window.innerHeight;
    parallaxBoxes.forEach(box => {
      const rect = box.getBoundingClientRect();
      if (rect.top < windowHeight && rect.bottom > 0) {
        const speed = 0.08;
        const yOffset = (rect.top - windowHeight / 2) * speed;
        const img = box.querySelector('img');
        if (img) {
          img.style.transform = `scale(1.06) translateY(${yOffset}px)`;
        }
      }
    });
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateParallax);
      ticking = true;
    }
  });

  // Scroll Reveal Animations
  const reveals = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    reveals.forEach(revealEl => revealObserver.observe(revealEl));
  } else {
    // Fallback for older browsers
    const handleScrollReveal = () => {
      const windowHeight = window.innerHeight;
      reveals.forEach(el => {
        const revealTop = el.getBoundingClientRect().top;
        if (revealTop < windowHeight - 50) {
          el.classList.add('active');
        }
      });
    };
    window.addEventListener('scroll', handleScrollReveal);
    handleScrollReveal();
  }

  // Interactive Lightbox Gallery
  const lightboxModal = document.getElementById('lightboxModal');
  const lightboxImg = document.getElementById('lightboxImage');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');

  const galleryImages = Array.from(document.querySelectorAll('img[data-lightbox="gallery"]'));
  let activeIndex = 0;

  function openLightbox(index) {
    if (!lightboxModal || galleryImages.length === 0) return;
    activeIndex = index;
    const targetImg = galleryImages[activeIndex];
    lightboxImg.src = targetImg.src;
    lightboxImg.alt = targetImg.alt || '';
    lightboxCaption.textContent = targetImg.getAttribute('data-caption') || targetImg.alt || '';
    lightboxModal.classList.add('active');
    lightboxModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightboxModal) return;
    lightboxModal.classList.remove('active');
    lightboxModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function prevLightboxImage() {
    activeIndex = (activeIndex - 1 + galleryImages.length) % galleryImages.length;
    openLightbox(activeIndex);
  }

  function nextLightboxImage() {
    activeIndex = (activeIndex + 1) % galleryImages.length;
    openLightbox(activeIndex);
  }

  galleryImages.forEach((img, index) => {
    img.addEventListener('click', (e) => {
      e.stopPropagation();
      openLightbox(index);
    });
  });

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener('click', (e) => { e.stopPropagation(); prevLightboxImage(); });
  if (lightboxNext) lightboxNext.addEventListener('click', (e) => { e.stopPropagation(); nextLightboxImage(); });

  if (lightboxModal) {
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal || e.target.classList.contains('lightbox-content')) {
        closeLightbox();
      }
    });
  }

  // Keyboard navigation for Lightbox
  document.addEventListener('keydown', (e) => {
    if (!lightboxModal || !lightboxModal.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') prevLightboxImage();
    if (e.key === 'ArrowRight') nextLightboxImage();
  });

  // Touch Swipe Support for Lightbox
  let touchStartX = 0;
  let touchEndX = 0;

  if (lightboxModal) {
    lightboxModal.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    lightboxModal.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });
  }

  function handleSwipe() {
    const swipeThreshold = 50;
    if (touchEndX < touchStartX - swipeThreshold) {
      nextLightboxImage();
    } else if (touchEndX > touchStartX + swipeThreshold) {
      prevLightboxImage();
    }
  }

  // WhatsApp Contact Form Integration
  const whatsappForm = document.getElementById('whatsappForm');
  if (whatsappForm) {
    whatsappForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('formName').value.trim();
      const phone = document.getElementById('formPhone').value.trim();
      const service = document.getElementById('formService').value;
      const message = document.getElementById('formMessage').value.trim();

      // Skylark Elevators And Fabrication Company WhatsApp Message
      const textMessage = `Hello Skylark Elevators And Fabrication Company,\n\nI would like to make an enquiry:\n- Name: ${name}\n- Phone: ${phone}\n- Service/Product Interested: ${service}\n- Message: ${message}`;

      const encodedMessage = encodeURIComponent(textMessage);

      // WhatsApp contact number (National Number: 7054929356)
      const whatsappNumber = '917054929356';
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodedMessage}`;

      // Open WhatsApp in a new window/tab
      window.open(whatsappUrl, '_blank');
    });
  }
});
