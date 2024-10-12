function revealEmail() {
    const email = document.getElementById('email');
    email.style.display = email.style.display === 'none' ? 'block' : 'none';
}



// Initialize all slideshows on the page
document.addEventListener("DOMContentLoaded", function() {
    const slideshows = document.querySelectorAll(".slideshow-container");
    
    slideshows.forEach((slideshow) => {
        let slideIndex = 0;
        const slides = slideshow.querySelectorAll(".slides");

        function showSlides(n) {
            if (n >= slides.length) { slideIndex = 0; }
            if (n < 0) { slideIndex = slides.length - 1; }
            slides.forEach((slide, index) => {
                slide.style.display = (index === slideIndex) ? "block" : "none";
            });
        }

        showSlides(slideIndex);

        const prevButton = slideshow.querySelector(".prev");
        const nextButton = slideshow.querySelector(".next");

        prevButton.addEventListener("click", function() {
            showSlides(--slideIndex);
        });

        nextButton.addEventListener("click", function() {
            showSlides(++slideIndex);
        });
    });
});