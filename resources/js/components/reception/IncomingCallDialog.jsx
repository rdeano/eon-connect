import { useState } from 'react';
import {
    Dialog, DialogContent, Box, Typography, Button, Avatar, CircularProgress,
} from '@mui/material';
import CallIcon    from '@mui/icons-material/Call';
import CallEndIcon from '@mui/icons-material/CallEnd';
import { Room, RoomEvent } from 'livekit-client';
import useCallStore from '../../stores/useCallStore';
import api from '../../services/api';

export default function IncomingCallDialog() {
    const [connecting, setConnecting] = useState(false);
    const { status, unitId, callerName, token, livekitUrl, setRoom, setActive, reset } = useCallStore();

    const handleAnswer = async () => {
        setConnecting(true);
        try {
            const room = new Room({ adaptiveStream: true, dynacast: true });

            room.on(RoomEvent.Disconnected, () => {
                if (useCallStore.getState().room === room) {
                    useCallStore.getState().reset();
                }
            });

            await room.connect(livekitUrl, token);
            await room.localParticipant.setMicrophoneEnabled(true);

            setRoom(room);
            setActive();
        } catch (e) {
            console.error('[Call] answer failed:', e);
            reset();
        } finally {
            setConnecting(false);
        }
    };

    const handleDecline = async () => {
        try { await api.post('/calls/end', { unit_id: unitId }); } catch {}
        reset();
    };

    return (
        <Dialog
            open={status === 'ringing'}
            maxWidth="xs"
            fullWidth
            PaperProps={{ sx: { borderRadius: 4, overflow: 'visible' } }}
        >
            <DialogContent sx={{ textAlign: 'center', py: 5, px: 4 }}>
                {/* Pulsing avatar */}
                <Box sx={{ position: 'relative', display: 'inline-flex', mb: 3 }}>
                    <Box sx={{
                        position: 'absolute', inset: -10,
                        borderRadius: '50%',
                        bgcolor: 'success.main', opacity: 0.12,
                        animation: 'pulse 1.5s ease-in-out infinite',
                        '@keyframes pulse': {
                            '0%, 100%': { transform: 'scale(1)' },
                            '50%': { transform: 'scale(1.15)' },
                        },
                    }} />
                    <Avatar sx={{
                        width: 72, height: 72,
                        background: 'linear-gradient(135deg, #1e6fc0 0%, #0d3b73 100%)',
                        fontSize: 28, fontWeight: 700,
                    }}>
                        {(callerName || '?').charAt(0).toUpperCase()}
                    </Avatar>
                </Box>

                <Typography variant="overline" color="text.secondary" display="block">
                    Incoming Voice Call
                </Typography>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                    {callerName ?? 'Unknown'}
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'center' }}>
                    <Button
                        variant="contained"
                        color="error"
                        startIcon={<CallEndIcon />}
                        onClick={handleDecline}
                        disabled={connecting}
                        sx={{ borderRadius: 3, px: 3, py: 1.25, fontWeight: 600 }}
                    >
                        Decline
                    </Button>
                    <Button
                        variant="contained"
                        color="success"
                        startIcon={connecting ? <CircularProgress size={16} color="inherit" /> : <CallIcon />}
                        onClick={handleAnswer}
                        disabled={connecting}
                        sx={{ borderRadius: 3, px: 3, py: 1.25, fontWeight: 600 }}
                    >
                        {connecting ? 'Connecting…' : 'Answer'}
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    );
}
