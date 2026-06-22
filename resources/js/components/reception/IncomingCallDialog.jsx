import { useEffect, useState } from 'react';
import {
    Dialog, Box, Typography, Avatar,
    CircularProgress, Button,
} from '@mui/material';
import CallIcon    from '@mui/icons-material/Call';
import CallEndIcon from '@mui/icons-material/CallEnd';
import { Room, RoomEvent } from 'livekit-client';
import useCallStore from '../../stores/useCallStore';
import api from '../../services/api';
import { useRingtone } from '../../hooks/useCallTone';

const TIMEOUT = 30;
const BG      = '#0f172a';

function fmt(s) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function IncomingCallDialog() {
    const [connecting,  setConnecting]  = useState(false);
    const [ringSeconds, setRingSeconds] = useState(0);
    const { status, unitId, callerName, token, livekitUrl, setRoom, setActive, reset } = useCallStore();

    useRingtone(status === 'ringing');

    useEffect(() => {
        if (status !== 'ringing') { setRingSeconds(0); return; }
        setRingSeconds(0);
        const t = setInterval(() => setRingSeconds((s) => s + 1), 1000);
        return () => clearInterval(t);
    }, [status]);

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
    const initial   = (callerName || '?').charAt(0).toUpperCase();

    return (
        <Dialog
            open={status === 'ringing'}
            maxWidth={false}
            PaperProps={{
                elevation: 0,
                sx: {
                    width: 360,
                    borderRadius: '20px',
                    overflow: 'hidden',
                    background: 'transparent',
                },
            }}
            BackdropProps={{
                sx: { backdropFilter: 'blur(6px)', bgcolor: 'rgba(0,0,0,0.55)' },
            }}
        >
            {/* Dark wrapper — applied here, not on Paper, to guarantee bgcolor */}
            <Box sx={{
                bgcolor: BG,
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px',
                overflow: 'hidden',
            }}>

                {/* ── Header label ─────────────────────────────── */}
                <Box sx={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 1,
                    pt: 3, pb: 0,
                }}>
                    <Box sx={{
                        width: 7, height: 7, borderRadius: '50%',
                        bgcolor: '#4ade80',
                        boxShadow: '0 0 8px 2px rgba(74,222,128,0.6)',
                        animation: 'blink 1.4s ease-in-out infinite',
                        '@keyframes blink': {
                            '0%, 100%': { opacity: 1 },
                            '50%':      { opacity: 0.25 },
                        },
                    }} />
                    <Typography sx={{
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: '0.65rem', fontWeight: 700,
                        letterSpacing: '0.14em', textTransform: 'uppercase',
                    }}>
                        Incoming Voice Call
                    </Typography>
                </Box>

                {/* ── Avatar + countdown ring ───────────────────── */}
                <Box sx={{ display: 'flex', justifyContent: 'center', pt: 3.5, pb: 2 }}>
                    <Box sx={{
                        position: 'relative',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        {/* Track ring */}
                        <CircularProgress
                            variant="determinate"
                            value={100}
                            size={100}
                            thickness={2.5}
                            sx={{ position: 'absolute', color: 'rgba(255,255,255,0.08)' }}
                        />
                        {/* Depleting arc */}
                        <CircularProgress
                            variant="determinate"
                            value={progress}
                            size={100}
                            thickness={2.5}
                            sx={{
                                position: 'absolute',
                                color: isUrgent ? '#f87171' : '#4ade80',
                                transition: 'color 0.5s ease',
                                // MUI draws from 3 o'clock; rotate to start at 12
                                transform: 'rotate(-90deg) !important',
                            }}
                        />
                        {/* Subtle pulse glow */}
                        <Box sx={{
                            position: 'absolute',
                            width: 78, height: 78, borderRadius: '50%',
                            bgcolor: isUrgent
                                ? 'rgba(248,113,113,0.12)'
                                : 'rgba(74,222,128,0.10)',
                            animation: 'glow 2s ease-in-out infinite',
                            transition: 'background-color 0.5s',
                            '@keyframes glow': {
                                '0%, 100%': { transform: 'scale(1)',    opacity: 0.5 },
                                '50%':      { transform: 'scale(1.07)', opacity: 1   },
                            },
                        }} />
                        <Avatar sx={{
                            width: 74, height: 74,
                            bgcolor: '#1e3a5f',
                            border: '2px solid rgba(255,255,255,0.12)',
                            fontSize: 30, fontWeight: 700, color: '#fff',
                            position: 'relative', zIndex: 1,
                        }}>
                            {initial}
                        </Avatar>
                    </Box>
                </Box>

                {/* ── Caller name + ringing status ─────────────── */}
                <Box sx={{ textAlign: 'center', px: 3, pb: 0 }}>
                    <Typography sx={{
                        color: '#ffffff',
                        fontSize: '1.35rem',
                        fontWeight: 700,
                        lineHeight: 1.25,
                        mb: 0.5,
                    }}>
                        {callerName ?? 'Unknown'}
                    </Typography>
                    <Typography sx={{
                        color: 'rgba(255,255,255,0.45)',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        letterSpacing: '0.02em',
                    }}>
                        Ringing&nbsp; · &nbsp;{fmt(ringSeconds)}
                    </Typography>
                </Box>

                {/* ── Auto-decline badge ────────────────────────── */}
                <Box sx={{ textAlign: 'center', pt: 2, pb: 0 }}>
                    <Box component="span" sx={{
                        display: 'inline-block',
                        px: 1.5, py: 0.4,
                        borderRadius: '20px',
                        bgcolor: isUrgent
                            ? 'rgba(239,68,68,0.18)'
                            : 'rgba(255,255,255,0.07)',
                        border: `1px solid ${isUrgent ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.1)'}`,
                        transition: 'all 0.4s',
                    }}>
                        <Typography sx={{
                            color: isUrgent ? '#fca5a5' : 'rgba(255,255,255,0.35)',
                            fontSize: '0.7rem', fontWeight: 600,
                            letterSpacing: '0.05em',
                            transition: 'color 0.4s',
                        }}>
                            Auto-decline in 0:{String(remaining).padStart(2, '0')}
                        </Typography>
                    </Box>
                </Box>

                {/* ── Action buttons ────────────────────────────── */}
                <Box sx={{ display: 'flex', gap: 1.5, px: 3, pt: 3, pb: 3.5 }}>
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={handleDecline}
                        disabled={connecting}
                        startIcon={<CallEndIcon />}
                        sx={{
                            bgcolor: '#ef4444',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            py: 1.25,
                            borderRadius: '12px',
                            textTransform: 'none',
                            boxShadow: '0 4px 16px rgba(239,68,68,0.35)',
                            '&:hover': {
                                bgcolor: '#dc2626',
                                boxShadow: '0 6px 20px rgba(239,68,68,0.5)',
                            },
                            '&.Mui-disabled': {
                                bgcolor: 'rgba(239,68,68,0.4)',
                                color: 'rgba(255,255,255,0.5)',
                            },
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
                                : <CallIcon />
                        }
                        sx={{
                            bgcolor: '#22c55e',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            py: 1.25,
                            borderRadius: '12px',
                            textTransform: 'none',
                            boxShadow: '0 4px 16px rgba(34,197,94,0.35)',
                            '&:hover': {
                                bgcolor: '#16a34a',
                                boxShadow: '0 6px 20px rgba(34,197,94,0.5)',
                            },
                            '&.Mui-disabled': {
                                bgcolor: 'rgba(34,197,94,0.4)',
                                color: 'rgba(255,255,255,0.5)',
                            },
                        }}
                    >
                        {connecting ? 'Connecting…' : 'Answer'}
                    </Button>
                </Box>
            </Box>
        </Dialog>
    );
}
