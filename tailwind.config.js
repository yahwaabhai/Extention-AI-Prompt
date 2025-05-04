// tailwind.config.js
module.exports = {
    content: [
      './index.html', // Scan HTML
      './js/ui/**/*.js', // Scan UI JS files for classes (like in card.js)
      // Add other paths if needed
    ],
    darkMode: 'class', // Ensure this matches your setup
    theme: {
      extend: {
           // Copy any extensions from your index.html <script> block here
           maxHeight: { '85vh': '85vh', 'screen': '100vh' },
           zIndex: { '60': '60', '40': '40', '50': '50' }
      },
    },
    plugins: [
      require('@tailwindcss/forms'), // If you still need the forms plugin
    ],
  }