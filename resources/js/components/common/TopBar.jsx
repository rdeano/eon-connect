import { AppBar, Toolbar, Typography, Box, Avatar, IconButton, Tooltip } from '@mui/material';
import ApartmentIcon from '@mui/icons-material/Apartment';
import LogoutIcon from '@mui/icons-material/Logout';
import useAuthStore from '../../stores/useAuthStore';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

export default function TopBar() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try { await api.post('/auth/logout'); } catch {}
        logout();
        navigate('/login');
    };

    const initials = user?.name
        ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    return (
        <AppBar position="static" elevation={0} sx={{ bgcolor: 'primary.main' }}>
            <Toolbar sx={{ gap: 1.5, minHeight: 56 }}>
                <ApartmentIcon sx={{ color: 'white', fontSize: 22 }} />
                <Typography variant="subtitle1" fontWeight={700} color="white" sx={{ flexGrow: 1 }}>
                    Eon Connect
                </Typography>

                <Avatar sx={{ width: 30, height: 30, bgcolor: 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: 700 }}>
                    {initials}
                </Avatar>
                <Typography variant="body2" color="white" fontWeight={500}>
                    {user?.name}
                </Typography>

                <Tooltip title="Sign out">
                    <IconButton onClick={handleLogout} sx={{ color: 'white', ml: 0.5 }}>
                        <LogoutIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Toolbar>
        </AppBar>
    );
}
