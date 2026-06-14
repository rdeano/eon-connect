import { useState } from 'react';
import {
    Box, TextField, Button, Typography, Paper,
    Alert, InputAdornment, IconButton,
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
            backgroundImage: 'linear-gradient(135deg, #1A56A0 0%, #0d3b73 100%)',
        }}>
            <Paper elevation={8} sx={{ width: 380, borderRadius: 3, overflow: 'hidden' }}>
                <Box sx={{ bgcolor: 'primary.main', px: 4, py: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <ApartmentIcon sx={{ color: 'white', fontSize: 28 }} />
                    <Box>
                        <Typography variant="h6" fontWeight={700} color="white" lineHeight={1.2}>
                            Eon Connect
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            Eon Realty and Development Corporation
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ px: 4, py: 4 }}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                            {error}
                        </Alert>
                    )}

                    <TextField
                        label="Email"
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
                        sx={{ py: 1.3, fontWeight: 600 }}
                    >
                        {loading ? 'Signing in…' : 'Sign In'}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}
