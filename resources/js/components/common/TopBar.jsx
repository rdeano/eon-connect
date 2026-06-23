import { AppBar, Toolbar, Typography, Box, Avatar, IconButton, Tooltip, Button } from '@mui/material';
import ApartmentIcon  from '@mui/icons-material/Apartment';
import LogoutIcon     from '@mui/icons-material/Logout';
import ForumIcon      from '@mui/icons-material/Forum';
import PeopleAltIcon  from '@mui/icons-material/PeopleAlt';
import useAuthStore from '../../stores/useAuthStore';
import api from '../../services/api';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV = [
    { label: 'Messages',    icon: ForumIcon,     path: '/reception' },
    { label: 'Unit Owners', icon: PeopleAltIcon, path: '/reception/units' },
];

export default function TopBar() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const { pathname } = useLocation();

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
                <Typography variant="subtitle1" fontWeight={700} color="white">
                    Eon Connect
                </Typography>

                {/* Reception navigation */}
                {user?.role === 'reception' && (
                    <Box sx={{ display: 'flex', gap: 0.5, ml: 2 }}>
                        {NAV.map(({ label, icon: Icon, path }) => {
                            const active = pathname === path;
                            return (
                                <Button
                                    key={path}
                                    onClick={() => navigate(path)}
                                    startIcon={<Icon sx={{ fontSize: '1rem !important' }} />}
                                    size="small"
                                    sx={{
                                        color: active ? 'white' : 'rgba(255,255,255,0.65)',
                                        bgcolor: active ? 'rgba(255,255,255,0.18)' : 'transparent',
                                        borderRadius: '8px',
                                        textTransform: 'none',
                                        fontWeight: active ? 700 : 500,
                                        fontSize: '0.8rem',
                                        px: 1.5, py: 0.6,
                                        '&:hover': {
                                            bgcolor: 'rgba(255,255,255,0.12)',
                                            color: 'white',
                                        },
                                    }}
                                >
                                    {label}
                                </Button>
                            );
                        })}
                    </Box>
                )}

                <Box sx={{ flexGrow: 1 }} />

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
