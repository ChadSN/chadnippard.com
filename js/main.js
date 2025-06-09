const track = document.querySelector('.carousel-track');
const slides = Array.from(track.children);
let currentIndex = 0;
let interval;


// Clone the first slide and append it to the end
const firstClone = slides[0].cloneNode(true);
track.appendChild(firstClone);

const totalSlides = slides.length; // original slides count

track.style.transition = 'transform 15s linear';

function goToSlide(index) {
    track.style.transition = 'transform 15s linear';
    track.style.transform = `translateX(-${index * 100}%)`;
    currentIndex = index;
}

function nextSlide() {
    goToSlide(currentIndex + 1);
}

function startAutoSlide() {
    interval = setInterval(nextSlide, 15000); // Change slide every x seconds
}

function stopAutoSlide() {
    clearInterval(interval);
}

// Listen for transition end to reset position if at the clone
track.addEventListener('transitionend', () => {
    if (currentIndex === totalSlides) {
        // Instantly jump to the real first slide (no transition)
        track.style.transition = 'none';
        track.style.transform = 'translateX(0)';
        currentIndex = 0;
        // Force reflow to apply the style immediately
        void track.offsetWidth;
        // Restore transition for next moves
        setTimeout(() => {
            track.style.transition = 'transform 3s linear';
        }, 20);
    }
});

// Prevent image dragging
Array.from(track.children).forEach(slide => {
    slide.querySelector('img').addEventListener('dragstart', e => e.preventDefault());
});

// Start
goToSlide(0);
nextSlide();
startAutoSlide();