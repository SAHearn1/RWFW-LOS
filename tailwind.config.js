/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        rootwork: {
          bg:     '#F8F7F2', // warm paper — root-bg
          ink:    '#1C1C1C', // charcoal   — root-ink
          olive:  '#4A4A35', // deep olive — root-olive
          sage:   '#6BAF8A', // sage green
          teal:   '#3D7A6A', // forest teal (icon primary)
          gold:   '#C5A059', // muted gold — root-gold
          accent: '#D97706', // warm amber — root-accent
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
