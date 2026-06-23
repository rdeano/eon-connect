import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, CircularProgress, Box } from '@mui/material';
import theme from './theme';
import LoginPage from './components/common/LoginPage';
import ReceptionDashboard from './components/reception/ReceptionDashboard';
import UnitOwnersPage from './components/reception/UnitOwnersPage';
import UnitOwnerPlaceholder from './components/unit/UnitOwnerPlaceholder';
import useAuthStore from './stores/useAuthStore';
import api from './services/api';

function ProtectedRoute({ children, role }) {
    const { user, token } = useAuthStore();
    if (!token) return <Navigate to="/login" />;
    if (role && user?.role !== role) return <Navigate to="/login" />;
    return children;
}

function GuestRoute({ children }) {
    const { user, token } = useAuthStore();
    if (token && user) {
        return <Navigate to={user.role === 'reception' ? '/reception' : '/chat'} />;
    }
    return children;
}

function App() {
    const { token, user, setAuth, logout } = useAuthStore();
    const [booting, setBooting] = useState(!!token && !user);

    useEffect(() => {
        if (!token || user) {
            setBooting(false);
            return;
        }
        api.get('/me')
            .then((res) => setAuth(res.data.data, token))
            .catch(() => logout())
            .finally(() => setBooting(false));
    }, []);

    if (booting) {
        return (
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                    <CircularProgress />
                </Box>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
                    <Route path="/reception" element={
                        <ProtectedRoute role="reception">
                            <ReceptionDashboard />
                        </ProtectedRoute>
                    } />
                    <Route path="/reception/units" element={
                        <ProtectedRoute role="reception">
                            <UnitOwnersPage />
                        </ProtectedRoute>
                    } />
                    <Route path="/chat" element={
                        <ProtectedRoute role="unit_owner">
                            <UnitOwnerPlaceholder />
                        </ProtectedRoute>
                    } />
                    <Route path="*" element={<Navigate to="/login" />} />
                </Routes>
            </BrowserRouter>
        </ThemeProvider>
    );
}

createRoot(document.getElementById('app')).render(<App />);
