/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand scale built around Chilli Red #AA0003
        brand: {
          50:  '#FCECEC',
          100: '#F7CFCF',
          200: '#EAA0A1',
          300: '#DB6E70',
          400: '#C53D3F',
          500: '#AA0003',  // Chilli red — primary
          600: '#920003',
          700: '#760002',
          800: '#5A0001',
          900: '#3E0001',
        },
        cream:    '#FCF7F0',  // primary page background
        card:     '#FFFCF6',  // entry-card cream surface
        sand:     '#EFE7DB',  // warm light for chips / hairlines
        charcoal: '#2C1B14',  // Inkwell — main text & headings
        ink:      '#1E120D',  // deeper inkwell for dark panels
        clay:     '#6B4A48',  // Mocha — secondary text
        honey:    '#E8B23C',  // supporting accent
        olive:    '#6F9A5E',  // supporting accent
        slate:    '#5A94C4',  // supporting accent
        surface:  '#FFFFFF',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '0.95rem' }],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #AA0003 0%, #760002 100%)',
      },
      boxShadow: {
        'xs':      '0 1px 2px rgba(44,27,20,0.05)',
        'card':    '0 1px 2px rgba(44,27,20,0.04), 0 6px 20px rgba(44,27,20,0.06)',
        'card-hover': '0 2px 6px rgba(44,27,20,0.06), 0 16px 40px rgba(44,27,20,0.10)',
        'elevated':'0 10px 36px rgba(44,27,20,0.12)',
        'glow':    '0 0 0 3px rgba(170,0,3,0.14)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',   // 24px — homepage entry cards
        '4xl': '2rem',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
      },
      keyframes: {
        fadeUp: { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
