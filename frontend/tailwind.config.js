/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Extended gradient colors
        gradient: {
          'purple-pink': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          'blue-teal': 'linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)',
          'orange-red': 'linear-gradient(135deg, #FF8A65 0%, #FF5722 100%)',
          'green-blue': 'linear-gradient(135deg, #4CAF50 0%, #2196F3 100%)',
          'sunset': 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)',
          'aurora': 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
          'cosmic': 'linear-gradient(135deg, #667db6 0%, #0082c8 25%, #0082c8 75%, #667db6 100%)',
        },
        // Glass morphism colors
        glass: {
          'white': 'rgba(255, 255, 255, 0.1)',
          'white-light': 'rgba(255, 255, 255, 0.05)',
          'white-medium': 'rgba(255, 255, 255, 0.15)',
          'white-strong': 'rgba(255, 255, 255, 0.25)',
          'black': 'rgba(0, 0, 0, 0.1)',
          'black-light': 'rgba(0, 0, 0, 0.05)',
          'black-medium': 'rgba(0, 0, 0, 0.15)',
          'black-strong': 'rgba(0, 0, 0, 0.25)',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      animation: {
        "fade-in": "fade-in 0.6s ease-in-out",
        "fade-in-slow": "fade-in 1.2s ease-in-out",
        "fade-out": "fade-out 0.5s ease-out",
        "slide-up": "slide-up 0.6s ease-out",
        "slide-down": "slide-down 0.6s ease-out",
        "slide-left": "slide-left 0.6s ease-out",
        "slide-right": "slide-right 0.6s ease-out",
        "scale-in": "scale-in 0.5s ease-out",
        "scale-out": "scale-out 0.5s ease-in",
        "bounce-subtle": "bounce-subtle 2s ease-in-out infinite",
        "pulse-gentle": "pulse-gentle 3s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "spin-slow": "spin 3s linear infinite",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        "slide-up": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-down": {
          "0%": { transform: "translateY(-20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-left": {
          "0%": { transform: "translateX(20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "slide-right": {
          "0%": { transform: "translateX(-20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "scale-out": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(0.9)", opacity: "0" },
        },
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        "pulse-gentle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-2px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(2px)" },
        },
        "destructive-shake": {
          "0%, 100%": { transform: "translateX(0) scale(1)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-4px) scale(1.01)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(4px) scale(1.01)" },
        },
      },
      // Animation delays
      animationDelay: {
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
        '700': '700ms',
        '1000': '1000ms',
      },
      // Custom backdrop blur
      backdropBlur: {
        'xs': '2px',
        'glass': '12px',
        'strong': '24px',
        'extreme': '40px',
      },
      // Custom transition timing functions
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'bounce-out': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'dramatic': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'swift': 'cubic-bezier(0.55, 0, 0.1, 1)',
        'gentle': 'cubic-bezier(0.25, 0, 0.25, 1)',
      },
      // Glass morphism utilities
      backdropFilter: {
        'glass': 'blur(12px) saturate(200%)',
        'glass-light': 'blur(8px) saturate(150%)',
        'glass-strong': 'blur(16px) saturate(250%)',
      },
      // Custom box shadow utilities for glow effects
      boxShadow: {
        'glow': '0 0 20px var(--glow-color, rgba(59, 130, 246, 0.15))',
        'glow-sm': '0 0 10px var(--glow-color, rgba(59, 130, 246, 0.15))',
        'glow-lg': '0 0 30px var(--glow-color, rgba(59, 130, 246, 0.15))',
        'glow-xl': '0 0 40px var(--glow-color, rgba(59, 130, 246, 0.15))',
        'inner-glow': 'inset 0 0 20px var(--glow-color, rgba(59, 130, 246, 0.15))',
      },
      // Custom perspective utilities for 3D effects
      perspective: {
        '500': '500px',
        '1000': '1000px',
        '1500': '1500px',
        '2000': '2000px',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
