/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,vue,svelte}", 
  ],
  theme: {
    extend: {
      // THÊM FONT MỚI
      fontFamily: {
        quicksand: ['Quicksand', 'sans-serif'],
      },
      // THÊM MÀU SẮC MỚI BẠN YÊU CẦU
      colors: {
        'goal': '#ffac81',
        'goal-form': '#ffe5d9', // Một màu nhạt hơn cho form
        'todo': '#cdeac0',
        'study': '#bde0fe',
        'history': '#d6e2e9',
        'score': '#f08080',
      }
    },
  },
  plugins: [],
}