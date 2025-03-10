document.addEventListener('DOMContentLoaded', function() {
    // Slideshow functionality for index.html
    let currentSlide = 0;
    const slides = document.querySelectorAll('.slide');
  
    function showSlide(index) {
      slides.forEach((slide, i) => {
        slide.classList.remove('active');
        if (i === index) {
          slide.classList.add('active');
        }
      });
    }
  
    window.changeSlide = function(n) {
      currentSlide += n;
      if (currentSlide < 0) {
        currentSlide = slides.length - 1;
      } else if (currentSlide >= slides.length) {
        currentSlide = 0;
      }
      showSlide(currentSlide);
    };
  
    // Dummy link modal functionality in the slideshow
    document.querySelectorAll('.dummy-link').forEach(link => {
      link.addEventListener('click', function(e) {
        // Only trigger modal for links that don't have target="_blank"
        if (!link.hasAttribute('target')) {
          e.preventDefault();
          document.getElementById('placeholderModal').style.display = 'block';
        }
      });
    });
  
    window.closeModal = function() {
      document.getElementById('placeholderModal').style.display = 'none';
    };
  });