import { Box, Typography, Paper, Button } from '@mui/material';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
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
            backgroundImage: 'linear-gradient(135deg, #1A56A0 0%, #0d3b73 100%)',
        }}>
            <Paper elevation={8} sx={{ width: 360, borderRadius: 3, overflow: 'hidden', textAlign: 'center' }}>
                <Box sx={{ bgcolor: 'primary.main', px: 4, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <ApartmentIcon sx={{ color: 'white', fontSize: 24 }} />
                    <Typography variant="subtitle1" fontWeight={700} color="white">Eon Connect</Typography>
                </Box>
                <Box sx={{ px: 4, py: 4 }}>
                    <PhoneIphoneIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1.5 }} />
                    <Typography variant="subtitle1" fontWeight={600} mb={0.5}>Use the Mobile App</Typography>
                    <Typography variant="body2" color="text.secondary" mb={3}>
                        Unit owner messaging is available on the Eon Connect mobile app.
                    </Typography>
                    <Button variant="outlined" onClick={handleLogout} fullWidth>Sign Out</Button>
                </Box>
            </Paper>
        </Box>
    );
}
