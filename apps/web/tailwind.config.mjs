/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Vibrant color palette from the new logo
        'brand': {
          orange: '#BD4C39',  // Coral orange from logo
          gold: '#E6B338',    // Golden yellow
          teal: '#40BECA',    // Bright teal/cyan
          magenta: '#D04EAB', // Vibrant magenta
          green: '#578770',   // Muted green
          brown: '#582018',   // Dark warm brown
          cream: '#DABAAC',   // Light cream
          dark: '#514E41',    // Warm dark gray
        },
        // Legacy MTGGoldfish colors (kept for compatibility)
        'mtg-red': {
          DEFAULT: '#BD4C39', // Updated to logo orange
          50: '#FEE6E2',
          100: '#FCCEC6',
          200: '#F89D8D',
          300: '#F46C54',
          400: '#BD4C39',
          500: '#A33D2C',
          600: '#892F1F',
          700: '#6F2114',
          800: '#582018',
          900: '#3D160F',
        },
        'mtg-gold': {
          DEFAULT: '#E6B338', // Updated to logo gold
          50: '#FEF8E8',
          100: '#FDF0D1',
          200: '#FAE1A3',
          300: '#F8D275',
          400: '#E6B338',
          500: '#D49B1A',
          600: '#B38215',
          700: '#8F6811',
          800: '#6B4E0D',
          900: '#473408',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
