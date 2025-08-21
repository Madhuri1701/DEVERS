// Mobile Navbar Toggle
const navbarToggle = document.getElementById('navbar-toggle');
const navbarLinks = document.getElementById('navbar-links');
navbarToggle.addEventListener('click', function() {
  navbarLinks.classList.toggle('open');
  navbarToggle.setAttribute('aria-expanded', navbarLinks.classList.contains('open'));
});
Array.from(navbarLinks.getElementsByTagName('a')).forEach(link => {
  link.addEventListener('click', () => {
    if(window.innerWidth < 700) {
      navbarLinks.classList.remove('open');
      navbarToggle.setAttribute('aria-expanded', 'false');
    }
  });
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if(target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

document.getElementById('search-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const value = this.querySelector('input').value.trim();
  if(value) {
    alert('Searching for: ' + value);
  }
});

function revealSections() {
  const reveals = document.querySelectorAll('.reveal');
  for (let i = 0; i < reveals.length; i++) {
    const windowHeight = window.innerHeight;
    const elementTop = reveals[i].getBoundingClientRect().top;
    if (elementTop < windowHeight - 80) {
      reveals[i].classList.add('visible');
    } else {
      reveals[i].classList.remove('visible');
    }
  }
}
window.addEventListener('scroll', revealSections);
window.addEventListener('resize', revealSections);
document.addEventListener('DOMContentLoaded', function() {
  revealSections();
  setTimeout(revealSections, 250);
});

window.addEventListener('resize', function() {
  document.body.style.width = '100vw';
  document.documentElement.style.width = '100vw';
});


// Modal elements
const modal = document.getElementById('authModal');
const closeModalBtn = document.getElementById('closeModal');

// Open modal when clicking Search or Try Now
document.querySelectorAll('#search-form button, .featured-tools .btn-primary').forEach(btn => {
  btn.addEventListener('click', function(e) {
    e.preventDefault(); // Prevent actual navigation
    modal.style.display = 'block';
  });
});

// Close modal on close button
closeModalBtn.addEventListener('click', () => {
  modal.style.display = 'none';
});

// Close modal on outside click
window.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.style.display = 'none';
  }
});
