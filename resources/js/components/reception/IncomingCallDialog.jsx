import { useEffect, useState } from 'react';
import {
    Dialog, DialogContent, Box, Typography, Button, Avatar,
    CircularProgress, LinearProgress,
} from '@mui/material';
import CallIcon    from '@mui/icons-material/Call';
import CallEndIcon from '@mui/icons-material/CallEnd';
import { Room, RoomEvent } from 'livekit-client';
import useCallStore from '../../stores/useCallStore';
import api from '../../services/api';
import { useRingtone } from '../../hooks/useCallTone';

const TIMEOUT = 30;

function fmt(s) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function IncomingCallDialog() {
    const [connecting,  setConnecting]  = useState(false);
    const [ringSeconds, setRingSeconds] = useState(0);
    const { status, unitId, callerName, token, livekitUrl, setRoom, setActive, reset } = useCallStore();

    useRingtone(status === 'ringing');

    // Ring count-up timer
    useEffect(() => {
        if (status !== 'ringing') { setRingSeconds(0); return; }
        setRingSeconds(0);
        const t = setInterval(() => setRingSeconds((s) => s + 1), 1000);
        return () => clearInterval(t);
    }, [status]);

    // Auto-decline after TIMEOUT seconds
    useEffect(() => {
        if (status !== 'ringing') return;
        const t = setTimeout(async () => {
            try { await api.post('/calls/end', { unit_id: unitId }); } catch {}
            reset();
        }, TIMEOUT * 1000);
        return () => clearTimeout(t);
    }, [status]);

    const handleAnswer = async () => {
        setConnecting(true);
        try {
            const room = new Room({ adaptiveStream: true, dynacast: true });
            room.on(RoomEvent.Disconnected, () => {
                if (useCallStore.getState().room === room) useCallStore.getState().reset();
            });
            await room.connect(livekitUrl, token);
            await room.startAudio();
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

    const remaining = TIMEOUT - ringSeconds;
    const progress  = (remaining / TIMEOUT) * 100;
    const isUrgent  = remaining <= 10;

    return (
        <Dialog
            open={status === 'ringing'}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '20px',
                    overflow: 'hidden',
                    background: 'linear-gradient(160deg, #0a2f5e 0%, #1A56A0 60%, #1e6fc0 100%)',
                    boxShadow: '0 32px 80px rgba(0,0,0,0.45), 0 8px 24px rgba(0,0,0,0.3)',
                },
            }}
            BackdropProps={{
                sx: { backdropFilter: 'blur(4px)', bgcolor: 'rgba(0,0,0,0.55)' },
            }}
        >
            <DialogContent sx={{ p: 0 }}>
                {/* Countdown progress strip */}
                <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                        height: 3,
                        bgcolor: 'rgba(255,255,255,0.12)',
                        '& .MuiLinearProgress-bar': {
                            background: isUrgent
                                ? 'linear-gradient(90deg, #f87171, #ef4444)'
                                : 'linear-gradient(90deg, #4ade80, #22c55e)',
                            transition: 'background 0.5s ease',
                        },
                    }}
                />

                <Box sx={{ textAlign: 'center', pt: 4.5, pb: 5, px: 4 }}>

                    {/* Pulsing avatar ring */}
                    <Box sx={{ position: 'relative', display: 'inline-flex', mb: 3.5 }}>
                        {/* Outer ring */}
                        <Box sx={{
                            position: 'absolute', inset: -18,
                            borderRadius: '50%',
                            border: '1.5px solid rgba(74,222,128,0.35)',
                            animation: 'outer-ring 2s ease-out infinite',
                            '@keyframes outer-ring': {
                                '0%':   { transform: 'scale(0.9)', opacity: 0.8 },
                                '80%':  { transform: 'scale(1.1)', opacity: 0 },
                                '100%': { transform: 'scale(1.1)', opacity: 0 },
                            },
                        }} />
                        {/* Inner glow */}
                        <Box sx={{
                            position: 'absolute', inset: -8,
                            borderRadius: '50%',
                            bgcolor: 'rgba(74,222,128,0.15)',
                            animation: 'inner-glow 2s ease-in-out infinite',
                            '@keyframes inner-glow': {
                                '0%, 100%': { transform: 'scale(1)',    opacity: 0.5 },
                                '50%':      { transform: 'scale(1.06)', opacity: 1 },
                            },
                        }} />
                        <Avatar sx={{
                            width: 84, height: 84,
                            background: 'rgba(255,255,255,0.15)',
                            border: '2px solid rgba(255,255,255,0.25)',
                            fontSize: 34, fontWeight: 700, color: 'white',
                            backdropFilter: 'blur(8px)',
                        }}>
                            {(callerName || '?').charAt(0).toUpperCase()}
                        </Avatar>
                    </Box>

                    {/* Caller info */}
                    <Typography sx={{
                        color: 'rgba(255,255,255,0.55)', fontSize: '0.68rem',
                        fontWeight: 700, letterSpacing: '0.12em',
                        textTransform: 'uppercase', mb: 0.75,
                    }}>
                        Incoming Voice Call
                    </Typography>
                    <Typography variant="h5" fontWeight={700} color="white" sx={{ mb: 0.25 }}>
                        {callerName ?? 'Unknown'}
                    </Typography>

                    {/* Timer cards */}
                    <Box sx={{ display: 'flex', gap: 1.5, mt: 3.5, mb: 4 }}>
                        {/* Ringing duration */}
                        <Box sx={{
                            flex: 1,
                            bgcolor: 'rgba(255,255,255,0.08)',
                            borderRadius: '14px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            py: 1.75, px: 2,
                        }}>
                            <Typography sx={{
                                color: 'rgba(255,255,255,0.45)',
                                fontSize: '0.6rem', fontWeight: 700,
                                letterSpacing: '0.1em', textTransform: 'uppercase', mb: 0.5,
                            }}>
                                Ringing
                            </Typography>
                            <Typography sx={{
                                color: 'white', fontSize: '1.6rem',
                                fontWeight: 300, letterSpacing: '0.12em', lineHeight: 1,
                            }}>
                                {fmt(ringSeconds)}
                            </Typography>
                        </Box>

                        {/* Auto-decline countdown */}
                        <Box sx={{
                            flex: 1,
                            bgcolor: isUrgent ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)',
                            borderRadius: '14px',
                            border: `1px solid ${isUrgent ? 'rgba(239,68,68,0.45)' : 'rgba(255,255,255,0.1)'}`,
                            py: 1.75, px: 2,
                            transition: 'all 0.4s ease',
                        }}>
                            <Typography sx={{
                                color: isUrgent ? 'rgba(252,165,165,0.8)' : 'rgba(255,255,255,0.45)',
                                fontSize: '0.6rem', fontWeight: 700,
                                letterSpacing: '0.1em', textTransform: 'uppercase', mb: 0.5,
                                transition: 'color 0.4s',
                            }}>
                                Auto-decline
                            </Typography>
                            <Typography sx={{
                                fontSize: '1.6rem', fontWeight: 300,
                                letterSpacing: '0.12em', lineHeight: 1,
                                color: isUrgent ? '#fca5a5' : 'white',
                                transition: 'color 0.4s ease',
                            }}>
                                0:{String(remaining).padStart(2, '0')}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Action buttons */}
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={handleDecline}
                            disabled={connecting}
                            startIcon={<CallEndIcon sx={{ fontSize: '1.1rem' }} />}
                            sx={{
                                bgcolor: 'rgba(239,68,68,0.8)',
                                color: 'white',
                                borderRadius: '12px',
                                py: 1.5,
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                textTransform: 'none',
                                border: '1px solid rgba(239,68,68,0.4)',
                                '&:hover': { bgcolor: 'rgba(220,38,38,0.9)' },
                                '&.Mui-disabled': { bgcolor: 'rgba(239,68,68,0.3)', color: 'rgba(255,255,255,0.4)' },
                            }}
                        >
                            Decline
                        </Button>
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={handleAnswer}
                            disabled={connecting}
                            startIcon={
                                connecting
                                    ? <CircularProgress size={16} sx={{ color: 'inherit' }} />
                                    : <CallIcon sx={{ fontSize: '1.1rem' }} />
                            }
                            sx={{
                                bgcolor: 'rgba(74,222,128,0.85)',
                                color: '#052e16',
                                borderRadius: '12px',
                                py: 1.5,
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                textTransform: 'none',
                                border: '1px solid rgba(74,222,128,0.4)',
                                '&:hover': { bgcolor: 'rgba(34,197,94,0.92)' },
                                '&.Mui-disabled': { bgcolor: 'rgba(74,222,128,0.3)', color: 'rgba(5,46,22,0.5)' },
                            }}
                        >
                            {connecting ? 'Connecting…' : 'Answer'}
                        </Button>
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    );
}
