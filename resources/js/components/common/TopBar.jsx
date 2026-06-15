import { AppBar, Toolbar, Typography, Box, Avatar, IconButton, Tooltip, Chip } from '@mui/material';
import ApartmentIcon from '@mui/icons-material/Apartment';
import LogoutIcon from '@mui/icons-material/Logout';
import useAuthStore from '../../stores/useAuthStore';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const ROLE_LABELS = {
    reception: 'Reception',
    unit_owner: 'Unit Owner',
};

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
        <AppBar position="static" elevation={0}>
            <Toolbar sx={{ gap: 1.5, minHeight: 56 }}>
                {/* Brand */}
                <Box sx={{
                    width: 34, height: 34, borderRadius: '10px',
                    bgcolor: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <ApartmentIcon sx={{ color: 'white', fontSize: 19 }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={700} color="white" sx={{ flexGrow: 1 }}>
                    Eon Connect
                </Typography>

                {/* Role chip */}
                {user?.role && (
                    <Chip
                        label={ROLE_LABELS[user.role] || user.role}
                        size="small"
                        sx={{
                            bgcolor: 'rgba(255,255,255,0.14)',
                            color: 'rgba(255,255,255,0.88)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            height: 22,
                            '& .MuiChip-label': { px: 1, fontSize: '0.68rem' },
                        }}
                    />
                )}

                {/* User info */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{
                        width: 32, height: 32,
                        bgcolor: 'rgba(255,255,255,0.22)',
                        border: '1.5px solid rgba(255,255,255,0.3)',
                        fontSize: 12,
                    }}>
                        {initials}
                    </Avatar>
                    <Typography variant="body2" color="white" fontWeight={600} sx={{ lineHeight: 1 }}>
                        {user?.name}
                    </Typography>
                </Box>

                <Tooltip title="Sign out">
                    <IconButton
                        onClick={handleLogout}
                        sx={{
                            color: 'rgba(255,255,255,0.8)',
                            borderRadius: '8px',
                            '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
                        }}
                    >
                        <LogoutIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Toolbar>
        </AppBar>
    );
}
