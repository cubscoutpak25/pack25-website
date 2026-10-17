// Mobile Navigation Toggle
const mobileToggle = document.querySelector('.mobile-toggle');
const navLinks = document.querySelector('.nav-links');

if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
        navLinks.classList.toggle('show');
    });
}

// Accordion functionality for Dens page
const accordionHeaders = document.querySelectorAll('.accordion-header');

accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
        const item = header.parentElement;
        const content = item.querySelector('.accordion-content');
        
        // Toggle current item
        item.classList.toggle('active');
        
        if (item.classList.contains('active')) {
            content.style.maxHeight = content.scrollHeight + "px";
        } else {
            content.style.maxHeight = null;
        }
        
        // Optional: Close other items
        accordionHeaders.forEach(otherHeader => {
            if (otherHeader !== header) {
                const otherItem = otherHeader.parentElement;
                otherItem.classList.remove('active');
                otherItem.querySelector('.accordion-content').style.maxHeight = null;
            }
        });
    });
});
