/** @type {import('tailwindcss').Config} */
export default {
  // Dòng "content" này là quan trọng nhất.
  // Nó ra lệnh cho Tailwind "quét" tất cả các file jsx/tsx trong thư mục src
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", 
  ],
  theme: {
    extend: { 
      fontFamily: {
        'quicksand': ['Quicksand', 'sans-serif'],
      },
      colors: {
        'goal': '#ffac81',
        'goal-form': '#ffe5d9',
        'todo': '#cdeac0',
        'study': '#bde0fe',
        'history': '#d6e2e9',
        'score': '#f08080',
      },
    },
  },
  plugins: [],
}
