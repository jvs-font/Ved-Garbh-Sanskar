document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu logic moved to loadHeader()

    // Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Intersection Observer for Fade-Up Animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Stop observing once visible
            }
        });
    }, observerOptions);

    const fadeElements = document.querySelectorAll('.fade-up');
    fadeElements.forEach(el => {
        observer.observe(el);
    });

    // Counter Animation Observer
    const counters = document.querySelectorAll('.counter');
    const speed = 60; // Lower is slower, higher is faster

    const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const updateCount = () => {
                    const target = +counter.getAttribute('data-target');
                    const count = +counter.innerText;

                    const inc = target / speed;

                    if (count < target) {
                        counter.innerText = Math.ceil(count + inc);
                        setTimeout(updateCount, 30); // 30ms delay per tick
                    } else {
                        counter.innerText = target;
                    }
                };

                // Add a small delay so it doesn't run before fade-up is visible
                setTimeout(updateCount, 300);
                observer.unobserve(counter);
            }
        });
    }, { rootMargin: '0px', threshold: 0.5 });

    counters.forEach(counter => {
        counterObserver.observe(counter);
    });

    // Smooth Scrolling for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Close mobile menu if open
                if (navLinks.classList.contains('active')) {
                    mobileMenuBtn.click();
                }

                const navHeight = navbar.offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ==========================================
    // Dynamic Google Maps Reviews API
    // ==========================================
    // This function automatically fetches the latest reviews from Google Maps.
    // NOTE: Google Places API limits responses to the 5 most helpful reviews.

    function initGoogleReviews() {
        if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
            console.log("Google Places API not loaded. Using static marquee reviews as fallback.");
            return;
        }

        // Place ID for Ved Garbhsanskar (To be added if using Google API)
        const placeId = 'ChIJ53aiqFCbXjkRsVBj657xszg'; // Example Place ID placeholder
        const dummyDiv = document.createElement('div');
        const service = new google.maps.places.PlacesService(dummyDiv);

        service.getDetails({
            placeId: placeId,
            fields: ['reviews']
        }, (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place.reviews) {
                const marqueeContents = document.querySelectorAll('.marquee-content');
                let reviewsHTML = '';

                place.reviews.forEach(review => {
                    if (review.rating >= 4 && review.text) { // Show 4+ star reviews
                        reviewsHTML += `
                            <div class="testimonial-card">
                                <p class="quote">"${review.text.length > 200 ? review.text.substring(0, 200) + '...' : review.text}"</p>
                                <h4>- ${review.author_name}</h4>
                            </div>
                        `;
                    }
                });

                if (reviewsHTML.length > 0) {
                    // Duplicate fetched reviews 3 times for the infinite marquee scroll
                    const finalHTML = reviewsHTML + reviewsHTML + reviewsHTML;
                    marqueeContents.forEach(container => {
                        container.innerHTML = finalHTML;
                        // Adjust animation timing dynamically based on number of reviews
                        container.style.animationDuration = (place.reviews.length * 15) + 's';
                    });
                }
            }
        });
    }

    // Wait a brief moment for external Google scripts to load
    window.addEventListener('load', () => {
        setTimeout(initGoogleReviews, 1500);
    });
});

async function loadYoutubeVideos() {
    const API_KEY = "AIzaSyA0QGgtidayhDIyrRUyP-UvN8xqo-rP44c";
    const CHANNEL_ID = "UC6MR7Esb6w_uruKN0vP_vIw";

    // Select all video grids in case there are multiple on the page
    const containers = document.querySelectorAll('.video-grid');
    if (containers.length === 0) return;

    try {
        // Fetch using YouTube Data API. videoDuration=medium filters out shorts (< 1 min)
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=15&type=video&videoDuration=medium`
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.items || data.items.length === 0) {
            let htmlContent = `<p style="text-align:center; color:#888;">No recent standard videos found.</p>`;
            containers.forEach(container => container.innerHTML = htmlContent);
            return;
        }

        // Apply generated HTML to all target containers
        containers.forEach(container => {
            let containerHtmlContent = '';

            // Determine limit based on the grid class
            const limit = container.classList.contains('video-grid-large') ? 15 : 5;

            data.items.slice(0, limit).forEach(video => {
                const videoId = video.id.videoId;
                const safeTitle = video.snippet.title.replace(/"/g, '&quot;').replace(/&#39;/g, "'");

                // Get the highest resolution thumbnail available
                const thumbnails = video.snippet.thumbnails;
                const thumbnail = thumbnails.high ? thumbnails.high.url : thumbnails.medium.url;

                containerHtmlContent += `
                    <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" rel="noopener noreferrer" class="video-card">
                        <img 
                            src="${thumbnail}" 
                            alt="${safeTitle}" 
                            class="video-thumb" 
                            loading="lazy"
                        >
                        <div class="youtube-overlay">
                            <svg viewBox="0 0 68 48" class="youtube-icon">
                                <path d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z" fill="#FF0000"></path>
                                <path d="M 45,24 27,14 27,34" fill="#fff"></path>
                            </svg>
                        </div>
                    </a>
                `;
            });
            container.innerHTML = containerHtmlContent;
        });

    } catch (error) {
        console.error("YouTube Fetch Error:", error);
        containers.forEach(container => {
            container.innerHTML = `<p style="text-align:center; color:#888;">Unable to load videos at this time.</p>`;
        });
    }
}

// Dynamic Footer Loader
function loadFooter() {
    const footerHTML = `
        <div class="container">
            <div class="footer-grid">
                <div class="footer-brand">
                    <img src="logo_svg.svg" alt="Ved Garbh Sanskar Logo" class="footer-logo">
                    <p>Elevating the motherhood experience with the perfect blend of Ayurveda and modern care.</p>
                </div>
                <div class="footer-links">
                    <h4>Explore</h4>
                    <a href="about.html">About Us</a>
                    <a href="services.html">Our Services</a>
                    <a href="gallery.html">Gallery</a>
                    <a href="testimonials.html">Testimonials</a>
                    <a href="contact.html">Contact</a>
                    <a href="privacy-policy.html">Privacy Policy</a>
                </div>
                <div class="footer-contact">
                    <h4>Contact</h4>
                    <p>408, Zion Z1, Nr. Avalon Hotel, Ramdas Road, Off Sindhu Bhavan Marg, Bodakdev, Ahmedabad. 380054</p>
                    <a href="mailto:[Vedgarbhsanskar@gmail.com]">Vedgarbhsanskar@gmail.com</a><br><br>
                    <a href="tel:+91 9925222763">+91 9925222763</a>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; ${new Date().getFullYear()} Ved Garbh Sanskar. All rights reserved. <br> Designed & Developed by <a href="https://codewingmedia.com/" style="color: #fff;">Codewing Media</a> with <a style="color: #fff;">❤️</a></p>
            </div>
        </div>
    `;

    const footerElement = document.querySelector('footer.footer');
    if (footerElement) {
        footerElement.innerHTML = footerHTML;
    }
}

// Dynamic Header Loader
function loadHeader() {
    // Get current filename (e.g., 'services.html')
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    
    // Helper to check if a link is active
    const isActive = (page) => {
        // Special case for services: all service detail pages should highlight "Services"
        const servicePages = [
            'services.html', 'ayurvedic-consultation.html', 'gynecological-disorders.html', 
            'infertility-treatment.html', 'library-facility.html', 'monthly-diet-plan.html', 
            'postnatal-care.html', 'pre-conception-treatment.html', 'pregnancy-yoga.html', 
            'special-music.html', 'suvarnprashan.html', 'yoga-for-kids.html', 'yoga-for-women.html'
        ];
        if (page === 'services.html' && servicePages.includes(currentPath)) return true;
        return currentPath === page;
    };

    const headerHTML = `
        <div class="nav-container">
            <a href="index.html" class="brand-logo">
                <img src="logo_svg.svg" alt="Ved Garbh Sanskar Logo">
            </a>
            <nav class="nav-links">
                <a href="about.html" style="${isActive('about.html') ? 'color:var(--clr-primary)' : ''}">About</a>
                <a href="services.html" style="${isActive('services.html') ? 'color:var(--clr-primary)' : ''}">Services</a>
                <a href="gallery.html" style="${isActive('gallery.html') ? 'color:var(--clr-primary)' : ''}">Gallery</a>
                <a href="testimonials.html" style="${isActive('testimonials.html') ? 'color:var(--clr-primary)' : ''}">Testimonials</a>
                <a href="contact.html" class="btn btn-primary">Contact Us</a>
            </nav>
            <button class="mobile-menu-btn" aria-label="Toggle menu">
                <span></span><span></span><span></span>
            </button>
        </div>
    `;

    const headerElement = document.querySelector('header.navbar');
    if (headerElement) {
        if (currentPath === 'index.html' || currentPath === '') {
            headerElement.classList.add('navbar-home');
        }
        headerElement.innerHTML = headerHTML;

        // Mobile Menu Toggle (Re-attach after injection)
        const mobileMenuBtn = headerElement.querySelector('.mobile-menu-btn');
        const navLinks = headerElement.querySelector('.nav-links');

        if (mobileMenuBtn && navLinks) {
            mobileMenuBtn.addEventListener('click', () => {
                navLinks.classList.toggle('active');

                // Animate hamburger to cross
                const spans = mobileMenuBtn.querySelectorAll('span');
                if (navLinks.classList.contains('active')) {
                    spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                    spans[1].style.opacity = '0';
                    spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
                } else {
                    spans[0].style.transform = 'none';
                    spans[1].style.opacity = '1';
                    spans[2].style.transform = 'none';
                }
            });
        }
    }
}

// Cookie Consent Logic
function initCookieConsent() {
    const consentKey = 'vedGarbhCookieConsent';
    if (!localStorage.getItem(consentKey)) {
        const bannerHTML = `
            <div id="cookie-consent-banner" class="cookie-consent-banner">
                <div class="cookie-content">
                    <p>We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies and our <a href="privacy-policy.html">Privacy Policy</a>.</p>
                </div>
                <div class="cookie-actions">
                    <button id="accept-cookies" class="btn btn-primary" style="padding: 0.8rem 2rem; border-radius: 4px;">Accept</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', bannerHTML);

        // Add small delay to allow DOM to register element before animating
        setTimeout(() => {
            const banner = document.getElementById('cookie-consent-banner');
            if(banner) banner.classList.add('visible');
        }, 100);

        document.getElementById('accept-cookies').addEventListener('click', () => {
            localStorage.setItem(consentKey, 'true');
            const banner = document.getElementById('cookie-consent-banner');
            banner.classList.remove('visible');
            setTimeout(() => banner.remove(), 500); // Wait for transition
        });
    }
}

// Ensure the DOM is fully loaded before executing
document.addEventListener("DOMContentLoaded", () => {
    loadHeader();
    loadYoutubeVideos();
    loadFooter();
    initCookieConsent();
});