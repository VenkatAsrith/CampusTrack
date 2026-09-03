/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Modern Education Light Mode Theme (Requested)
        edu: {
          dark: '#1E1E1E',         // Near Black / Dark Charcoal (Primary / Headings)
          muted: '#6C757D',        // Muted Gray (Secondary / Descriptions)
          royal: '#3B50DF',        // Royal Blue (Accent / Active Elements)
          royalHover: '#2E3FB8',   // Darker Royal Blue on hover
          royalLight: '#EEF2FF',   // Soft Blue tint for cards & badges
          royalBorder: '#D9E1FC',  // Subtle Royal Blue border
          sidebar: '#151B3B',      // Dark Slate Navy Sidebar
          sidebarCard: '#1F2752',  // Sidebar inner card
          sidebarText: '#E0E4FC',  // Light Slate Blue
          canvas: '#F4F6FA',       // Light Mode Canvas Background
          card: '#FFFFFF',         // Crisp White Card
          border: '#E5E9F2',       // Clean subtle card border
        },
        // Kept for backward compatibility if referenced
        brand: {
          50: '#EEF2FF',
          100: '#E0E4FC',
          200: '#C7D2FE',
          300: '#9BA8F9',
          400: '#5B6EF5',
          500: '#3B50DF', // Royal Blue
          600: '#2E3FB8',
          700: '#233096',
          800: '#1B2474',
          900: '#151B52',
          950: '#0E1235',
        },
        wine: {
          primary: '#3B50DF',
          dark: '#2E3FB8',
          light: '#5B6EF5',
        },
        darkBg: '#F4F6FA',
        darkCard: '#FFFFFF',
        darkBorder: '#E5E9F2',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
