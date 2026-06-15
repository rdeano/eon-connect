import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            main: '#1A56A0',
            light: '#4d82c4',
            dark: '#0d3b73',
            50: '#e8f0fb',
            100: '#c6d9f5',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#0891b2',
            light: '#22d3ee',
            dark: '#0e7490',
            contrastText: '#ffffff',
        },
        success: {
            main: '#16a34a',
            light: '#86efac',
        },
        background: {
            default: '#f0f4f9',
            paper: '#ffffff',
        },
        text: {
            primary: '#0f172a',
            secondary: '#475569',
            disabled: '#94a3b8',
        },
        divider: '#e2e8f0',
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Arial", sans-serif',
        h5: { fontWeight: 700, letterSpacing: '-0.02em' },
        h6: { fontWeight: 700, letterSpacing: '-0.01em' },
        subtitle1: { fontWeight: 600 },
        subtitle2: { fontWeight: 600 },
        body1: { lineHeight: 1.65 },
        body2: { lineHeight: 1.6 },
        button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: {
        borderRadius: 10,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: ({ ownerState }) => ({
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 8,
                    letterSpacing: '0.01em',
                    ...(ownerState.variant === 'contained' && ownerState.color === 'primary' && {
                        background: 'linear-gradient(135deg, #1e6fc0 0%, #0d3b73 100%)',
                        boxShadow: '0 4px 14px rgba(26,86,160,0.28)',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #2578d1 0%, #0f4489 100%)',
                            boxShadow: '0 6px 20px rgba(26,86,160,0.38)',
                        },
                    }),
                    ...(ownerState.variant === 'outlined' && ownerState.color === 'primary' && {
                        borderWidth: '1.5px',
                        '&:hover': { borderWidth: '1.5px' },
                    }),
                }),
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 8,
                        transition: 'box-shadow 0.15s ease',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#4d82c4',
                        },
                        '&.Mui-focused': {
                            boxShadow: '0 0 0 3px rgba(26,86,160,0.1)',
                        },
                    },
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundImage: 'linear-gradient(135deg, #1e6fc0 0%, #0d3b73 100%)',
                    boxShadow: '0 2px 12px rgba(13,59,115,0.3)',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
            },
        },
        MuiAvatar: {
            styleOverrides: {
                root: { fontWeight: 700 },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: { fontWeight: 600, fontSize: '0.7rem' },
            },
        },
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    fontSize: '0.72rem',
                    fontWeight: 500,
                    borderRadius: 6,
                    padding: '4px 10px',
                    backgroundColor: 'rgba(15,23,42,0.85)',
                },
            },
        },
        MuiListItemButton: {
            styleOverrides: {
                root: {
                    transition: 'background-color 0.12s ease, border-color 0.12s ease',
                },
            },
        },
    },
});

export default theme;
