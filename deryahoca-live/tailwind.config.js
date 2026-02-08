/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            // Brand Colors - Dark Science / Lightboard Theme
            colors: {
                // Core Brand Colors
                'brand-dark': '#0F172A',      // Rich Slate - Main canvas
                'brand-panel': '#1E293B',     // Lighter Slate - Cards, sidebars
                'brand-primary': '#8B5CF6',   // Violet - Primary actions
                'brand-accent': '#10B981',    // Neon Emerald - Success, highlights
                'brand-highlight': '#F59E0B', // Amber - Warnings, Focus Mode

                // Text Colors
                'text-main': '#F1F5F9',       // Off-white for readability
                'text-muted': '#94A3B8',      // Secondary text

                // Legacy support (can be removed after full migration)
                primary: {
                    50: '#f5f3ff',
                    100: '#ede9fe',
                    200: '#ddd6fe',
                    300: '#c4b5fd',
                    400: '#a78bfa',
                    500: '#8B5CF6', // brand-primary
                    600: '#7c3aed',
                    700: '#6d28d9',
                    800: '#5b21b6',
                    900: '#4c1d95',
                },
                secondary: {
                    50: '#ecfdf5',
                    100: '#d1fae5',
                    200: '#a7f3d0',
                    300: '#6ee7b7',
                    400: '#34d399',
                    500: '#10B981', // brand-accent
                    600: '#059669',
                    700: '#047857',
                    800: '#065f46',
                    900: '#064e3b',
                },
                accent: {
                    50: '#fffbeb',
                    100: '#fef3c7',
                    200: '#fde68a',
                    300: '#fcd34d',
                    400: '#fbbf24',
                    500: '#F59E0B', // brand-highlight
                    600: '#d97706',
                    700: '#b45309',
                    800: '#92400e',
                    900: '#78350f',
                },
                dark: {
                    100: '#334155',
                    200: '#1E293B', // brand-panel
                    300: '#1E293B',
                    400: '#0F172A', // brand-dark
                },
            },
            // Typography - Modern Tech-Forward Look
            fontFamily: {
                sans: ['Inter', 'Quicksand', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
                display: ['Orbitron', 'Montserrat', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
            },
            // Custom Shadows - Neon Glow Effects
            boxShadow: {
                'glow': '0 0 20px rgba(139, 92, 246, 0.35)',
                'glow-sm': '0 0 10px rgba(139, 92, 246, 0.25)',
                'glow-lg': '0 0 30px rgba(139, 92, 246, 0.45)',
                'glow-accent': '0 0 20px rgba(16, 185, 129, 0.35)',
                'glow-accent-sm': '0 0 10px rgba(16, 185, 129, 0.2)',
                'glow-accent-lg': '0 0 30px rgba(16, 185, 129, 0.5)',
                'glow-highlight': '0 0 20px rgba(245, 158, 11, 0.35)',
                'neon-border': '0 0 15px rgba(139, 92, 246, 0.5), inset 0 0 15px rgba(139, 92, 246, 0.1)',
                'neon-accent': '0 0 15px rgba(16, 185, 129, 0.5), inset 0 0 15px rgba(16, 185, 129, 0.1)',
            },
            // Animations
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glow-pulse': 'glowPulse 2s ease-in-out infinite alternate',
                'gradient-shift': 'gradientShift 8s ease infinite',
                'border-glow': 'borderGlow 3s ease-in-out infinite alternate',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                glowPulse: {
                    '0%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.2)' },
                    '100%': { boxShadow: '0 0 30px rgba(139, 92, 246, 0.5)' },
                },
                gradientShift: {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                },
                borderGlow: {
                    '0%': { borderColor: 'rgba(16, 185, 129, 0.3)' },
                    '100%': { borderColor: 'rgba(16, 185, 129, 0.8)' },
                },
            },
            // Background Image - Science Lab Pattern
            backgroundImage: {
                'science-grid': `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%238B5CF6' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                'molecule-pattern': `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310B981' fill-opacity='0.02'%3E%3Ccircle cx='40' cy='40' r='4'/%3E%3Ccircle cx='10' cy='10' r='2'/%3E%3Ccircle cx='70' cy='10' r='2'/%3E%3Ccircle cx='10' cy='70' r='2'/%3E%3Ccircle cx='70' cy='70' r='2'/%3E%3Cpath d='M40 36l-26-26M40 36l26-26M40 44l-26 26M40 44l26 26' stroke='%2310B981' stroke-opacity='0.02'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                'hex-pattern': `url("data:image/svg+xml,%3Csvg width='28' height='49' viewBox='0 0 28 49' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%238B5CF6' fill-opacity='0.02'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.2l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            },
            // Border Radius
            borderRadius: {
                '4xl': '2rem',
            },
            // Backdrop Blur
            backdropBlur: {
                xs: '2px',
            },
        },
    },
    plugins: [],
};
