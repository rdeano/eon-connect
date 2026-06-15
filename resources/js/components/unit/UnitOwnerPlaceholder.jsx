import { Box, Typography, Paper, Button } from '@mui/material';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import ApartmentIcon from '@mui/icons-material/Apartment';
import useAuthStore from '../../stores/useAuthStore';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function UnitOwnerPlaceholder() {
    const { logout } = useAuthStore();
    const navigate   = useNavigate();

    const handleLogout = async () => {
        try { await api.post('/auth/logout'); } catch {}
        logout();
        navigate('/login');
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(160deg, #0d3b73 0%, #1A56A0 45%, #1e6fc0 100%)',
            position: 'relative',
            '&::before': {
                content: '""',
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(ellipse 80% 55% at 50% 0%, rgba(255,255,255,0.08) 0%, transparent 70%)',
                pointerEvents: 'none',
            },
        }}>
            <Paper elevation={0} sx={{
                width: 380,
                borderRadius: 4,
                overflow: 'hidden',
                textAlign: 'center',
                boxShadow: '0 25px 80px rgba(0,0,0,0.25), 0 8px 24px rgba(0,0,0,0.15)',
            }}>
                {/* Brand header */}
                <Box sx={{
                    background: 'linear-gradient(135deg, #1e6fc0 0%, #0d3b73 100%)',
                    px: 4, py: 2.5,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5,
                }}>
                    <Box sx={{
                        width: 34, height: 34, borderRadius: '10px',
                        bgcolor: 'rgba(255,255,255,0.15)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <ApartmentIcon sx={{ color: 'white', fontSize: 19 }} />
                    </Box>
                    <Typography variant="subtitle1" fontWeight={700} color="white">
                        Eon Connect
                    </Typography>
                </Box>

                {/* Content */}
                <Box sx={{ px: 4, py: 4.5 }}>
                    <Box sx={{
                        width: 72, height: 72, borderRadius: '20px',
                        background: 'linear-gradient(135deg, #e8f0fb 0%, #c6d9f5 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        mx: 'auto', mb: 2.5,
                    }}>
                        <PhoneAndroidIcon sx={{ fontSize: 36, color: 'primary.main' }} />
                    </Box>

                    <Typography variant="h6" fontWeight={700} mb={0.75} color="text.primary">
                        Mobile App Required
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={3.5} sx={{ lineHeight: 1.75 }}>
                        Unit owner messaging is available exclusively on the{' '}
                        <strong>Eon Connect</strong> mobile app. Download it to
                        stay connected with the reception team.
                    </Typography>

                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={handleLogout}
                        fullWidth
                        sx={{ py: 1.2, borderRadius: 2, fontWeight: 600 }}
                    >
                        Sign Out
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}
