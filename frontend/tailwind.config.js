export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#05070E',
        panel: '#0A0F1A',
        panel2: '#0E1522',
        line: '#1A2233',
        line2: '#27334A',
        ink: '#E9EEF9',
        muted: '#96A2BA',
        faint: '#69758F',
        brand: { light: '#A78BFA', DEFAULT: '#7C6CF6', dark: '#5546D6' },
        aqua: { light: '#67E8F9', DEFAULT: '#22D3EE', dark: '#0E93AF' },
        mint: { light: '#6EE7B7', DEFAULT: '#34D399', dark: '#0F9D6E' },
        sun: { light: '#FCD34D', DEFAULT: '#F59E0B', dark: '#B4700A' },
        flare: { light: '#FDA4AF', DEFAULT: '#FB5C77', dark: '#BE123C' },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['Sora', 'Inter', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.045em',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(0,0,0,0.4), 0 12px 32px -16px rgba(0,0,0,0.7)',
        lift: '0 1px 2px rgba(0,0,0,0.5), 0 24px 60px -24px rgba(0,0,0,0.85)',
        glow: '0 0 0 1px rgba(124,108,246,0.28), 0 12px 40px -12px rgba(124,108,246,0.45)',
        glowAqua: '0 0 0 1px rgba(34,211,238,0.28), 0 12px 40px -12px rgba(34,211,238,0.40)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.06)',
      },
      backgroundImage: {
        'grid-fine':
          'linear-gradient(to right, rgba(148,163,184,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.07) 1px, transparent 1px)',
        'brand-sheen':
          'linear-gradient(100deg, #E9EEF9 0%, #A78BFA 28%, #67E8F9 52%, #E9EEF9 78%, #A78BFA 100%)',
        'brand-line': 'linear-gradient(90deg, transparent, #7C6CF6, #22D3EE, transparent)',
        'brand-fade': 'linear-gradient(135deg, rgba(124,108,246,0.16), rgba(34,211,238,0.08) 55%, transparent)',
      },
      backgroundSize: {
        grid: '44px 44px',
        sheen: '300% 100%',
      },
      keyframes: {
        'aurora-a': {
          '0%, 100%': { transform: 'translate3d(-6%, -4%, 0) scale(1)' },
          '50%': { transform: 'translate3d(8%, 6%, 0) scale(1.18)' },
        },
        'aurora-b': {
          '0%, 100%': { transform: 'translate3d(6%, 4%, 0) scale(1.12)' },
          '50%': { transform: 'translate3d(-8%, -6%, 0) scale(0.94)' },
        },
        'aurora-c': {
          '0%, 100%': { transform: 'translate3d(0, 4%, 0) scale(0.96)' },
          '50%': { transform: 'translate3d(4%, -8%, 0) scale(1.22)' },
        },
        sheen: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.85)', opacity: '0.7' },
          '70%': { transform: 'scale(1.9)', opacity: '0' },
          '100%': { transform: 'scale(1.9)', opacity: '0' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' },
        },
      },
      animation: {
        'aurora-a': 'aurora-a 26s ease-in-out infinite',
        'aurora-b': 'aurora-b 32s ease-in-out infinite',
        'aurora-c': 'aurora-c 24s ease-in-out infinite',
        sheen: 'sheen 8s linear infinite alternate',
        shimmer: 'shimmer 1.8s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2.4s cubic-bezier(0.24, 0.8, 0.36, 1) infinite',
        'pulse-soft': 'pulse-soft 2.6s ease-in-out infinite',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
