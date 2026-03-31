const config = {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            fontFamily: {
                heading: ['Cinzel', 'Georgia', 'serif'],
                body: ['Spectral', 'Georgia', 'serif'],
            },
            colors: {
                night: {
                    950: '#090b12',
                    900: '#0f1320',
                    850: '#131829',
                    800: '#1a2033',
                    700: '#232a42',
                },
                accent: {
                    50: '#fdf7e3',
                    200: '#eac97a',
                    300: '#d4aa53',
                    400: '#b87f31',
                },
                ember: '#b65f4e',
                mist: '#9ea5c1',
            },
            boxShadow: {
                panel: '0 24px 80px rgba(5, 8, 18, 0.45)',
                glow: '0 0 0 1px rgba(212, 170, 83, 0.22), 0 18px 50px rgba(15, 19, 32, 0.4)',
            },
            backgroundImage: {
                'portal-grid': 'radial-gradient(circle at 20% 20%, rgba(212,170,83,0.14), transparent 30%), radial-gradient(circle at 80% 0%, rgba(68,110,156,0.18), transparent 24%), linear-gradient(180deg, rgba(255,255,255,0.02), transparent 30%)',
            },
        },
    },
    plugins: [],
};
export default config;
//# sourceMappingURL=tailwind.config.js.map