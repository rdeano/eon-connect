import { useState } from 'react';
import {
    Box, TextField, Button, Typography, Paper,
    Alert, InputAdornment, IconButton, CircularProgress,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ApartmentIcon from '@mui/icons-material/Apartment';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import useAuthStore from '../../stores/useAuthStore';

export default function LoginPage() {
    const [email,    setEmail]    = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [error,    setError]    = useState('');
    const [loading,  setLoading]  = useState(false);
    const { setAuth } = useAuthStore();
    const navigate = useNavigate();

    const handleLogin = async () => {
        if (!email || !password) { setError('Please enter your email and password.'); return; }
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/login', { email, password });
            setAuth(res.data.data.user, res.data.data.token);
            navigate(res.data.data.user.role === 'reception' ? '/reception' : '/chat');
        } catch {
            setError('Invalid email or password.');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => { if (e.key === 'Enter') handleLogin(); };

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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
                width: 420,
                borderRadius: 4,
                overflow: 'hidden',
                boxShadow: '0 25px 80px rgba(0,0,0,0.25), 0 8px 24px rgba(0,0,0,0.15)',
                position: 'relative',
            }}>
                {/* Brand header */}
                <Box sx={{
                    background: 'linear-gradient(135deg, #1e6fc0 0%, #0d3b73 100%)',
                    px: 4, py: 3.5,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 1.5,
                }}>
                    <Box sx={{
                        width: 60, height: 60, borderRadius: '18px',
                        bgcolor: 'rgba(255,255,255,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1.5px solid rgba(255,255,255,0.25)',
                        backdropFilter: 'blur(8px)',
                    }}>
                        <ApartmentIcon sx={{ color: 'white', fontSize: 32 }} />
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" fontWeight={700} color="white" lineHeight={1.2}>
                            Eon Connect
                        </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', mt: 0.25 }}>
                            Eon Realty and Development Corporation
                        </Typography>
                    </Box>
                </Box>

                {/* Form */}
                <Box sx={{ px: 4, pt: 3.5, pb: 4 }}>
                    <Typography variant="subtitle1" fontWeight={700} color="text.primary" mb={0.5}>
                        Welcome back
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={2.5}>
                        Sign in to your account to continue.
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }} onClose={() => setError('')}>
                            {error}
                        </Alert>
                    )}

                    <TextField
                        label="Email address"
                        fullWidth
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoComplete="email"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <EmailIcon fontSize="small" color="action" />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        label="Password"
                        type={showPass ? 'text' : 'password'}
                        fullWidth
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoComplete="current-password"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <LockIcon fontSize="small" color="action" />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => setShowPass(!showPass)} edge="end">
                                        {showPass ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                        sx={{ mb: 3 }}
                    />

                    <Button
                        variant="contained"
                        fullWidth
                        size="large"
                        onClick={handleLogin}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={18} sx={{ color: 'rgba(255,255,255,0.7)' }} /> : null}
                        sx={{ py: 1.4, fontWeight: 700, fontSize: '0.95rem', borderRadius: 2 }}
                    >
                        {loading ? 'Signing in…' : 'Sign In'}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}
