/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // "Cinematic brutalism": obsidian surfaces, golden-hour data colours,
      // and warm rust rules (orange-900) for structure. Variables keep every
      // opacity modifier working.
      colors: {
        void: 'rgb(var(--c-void) / <alpha-value>)',
        panel: 'rgb(var(--c-panel) / <alpha-value>)',
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        mute: 'rgb(var(--c-mute) / <alpha-value>)',
        amber: 'rgb(var(--c-amber) / <alpha-value>)',
        gold: 'rgb(var(--c-gold) / <alpha-value>)',
        sunset: 'rgb(var(--c-sunset) / <alpha-value>)',
        sage: 'rgb(var(--c-sage) / <alpha-value>)',
      },
      // One family, used at two extremes: Black for impact, Regular for reading.
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      letterSpacing: { slam: '-0.06em' },
    },
  },
  plugins: [],
}
