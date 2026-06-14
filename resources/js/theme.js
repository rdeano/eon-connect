import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            main: '#1A56A0',
        },
        background: {
            default: '#f7f8fa',
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Arial", sans-serif',
    },
    shape: {
        borderRadius: 8,
    },
});

export default theme;
