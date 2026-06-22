import { useEffect, useState } from 'react';
import {
    Dialog, Box, Typography, Avatar,
    CircularProgress, IconButton, Tooltip,
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

    const remaining  = TIMEOUT - ringSeconds;
    const progress   = (remaining / TIMEOUT) * 100;
    const isUrgent   = remaining <= 10;
    const initial    = (callerName || '?').charAt(0).toUpperCase();

    return (
        <Dialog
            open={status === 'ringing'}
            maxWidth={false}
            PaperProps={{
                sx: {
                    width: 340,
                    borderRadius: '24px',
                    bgcolor: '#0f172a',
                    boxShadow: '0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
                    overflow: 'visible',
                },
            }}
            BackdropProps={{
                sx: { backdropFilter: 'blur(6px)', bgcolor: 'rgba(0,0,0,0.6)' },
            }}
        >
            {/* Top label bar */}
            <Box sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75,
                pt: 3, pb: 0, px: 3,
            }}>
                <Box sx={{
                    width: 7, height: 7, borderRadius: '50%',
                    bgcolor: '#4ade80',
                    boxShadow: '0 0 8px #4ade80',
                    animation: 'blink 1.4s ease-in-out infinite',
                    '@keyframes blink': {
                        '0%, 100%': { opacity: 1 },
                        '50%':      { opacity: 0.3 },
                    },
                }} />
                <Typography sx={{
                    color: 'rgba(255,255,255,0.45)', fontSize: '0.65rem',
                    fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
                }}>
                    Incoming Voice Call
                </Typography>
            </Box>

            {/* Avatar + countdown ring */}
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 3.5, pb: 2.5 }}>
                <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    {/* Background track */}
                    <CircularProgress
                        variant="determinate"
                        value={100}
                        size={96}
                        thickness={2.5}
                        sx={{
                            position: 'absolute',
                            color: 'rgba(255,255,255,0.07)',
                        }}
                    />
                    {/* Countdown arc */}
                    <CircularProgress
                        variant="determinate"
                        value={progress}
                        size={96}
                        thickness={2.5}
                        sx={{
                            position: 'absolute',
                            color: isUrgent ? '#f87171' : '#4ade80',
                            transition: 'color 0.6s ease',
                            transform: 'rotate(-90deg) !important',
                        }}
                    />
                    {/* Pulsing glow */}
                    <Box sx={{
                        position: 'absolute',
                        width: 76, height: 76, borderRadius: '50%',
                        bgcolor: isUrgent ? 'rgba(248,113,113,0.12)' : 'rgba(74,222,128,0.1)',
                        animation: 'glow 2s ease-in-out infinite',
                        transition: 'background-color 0.6s',
                        '@keyframes glow': {
                            '0%, 100%': { transform: 'scale(1)',    opacity: 0.6 },
                            '50%':      { transform: 'scale(1.08)', opacity: 1   },
                        },
                    }} />
                    <Avatar sx={{
                        width: 72, height: 72,
                        bgcolor: '#1e3a5f',
                        border: '2px solid rgba(255,255,255,0.12)',
                        fontSize: 28, fontWeight: 700, color: 'white',
                        position: 'relative',
                        zIndex: 1,
                    }}>
                        {initial}
                    </Avatar>
                </Box>
            </Box>

            {/* Caller name */}
            <Box sx={{ textAlign: 'center', px: 3, pb: 0.5 }}>
                <Typography sx={{
                    color: 'white', fontSize: '1.25rem', fontWeight: 700,
                    lineHeight: 1.2, mb: 0.5,
                }}>
                    {callerName ?? 'Unknown'}
                </Typography>
                <Typography sx={{
                    color: 'rgba(255,255,255,0.38)', fontSize: '0.75rem',
                    fontWeight: 500,
                }}>
                    Ringing&nbsp;&nbsp;{fmt(ringSeconds)}
                </Typography>
            </Box>

            {/* Auto-decline countdown */}
            <Box sx={{ textAlign: 'center', pt: 2, pb: 0.5, px: 3 }}>
                <Typography sx={{
                    display: 'inline-block',
                    color: isUrgent ? '#fca5a5' : 'rgba(255,255,255,0.22)',
                    fontSize: '0.7rem', fontWeight: 600,
                    letterSpacing: '0.06em',
                    transition: 'color 0.5s',
                    bgcolor: isUrgent ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)',
                    px: 1.5, py: 0.5, borderRadius: '20px',
                    transition: 'all 0.5s',
                }}>
                    Auto-decline in 0:{String(remaining).padStart(2, '0')}
                </Typography>
            </Box>

            {/* Action buttons */}
            <Box sx={{
                display: 'flex', justifyContent: 'center', gap: 4,
                pt: 3, pb: 4,
            }}>
                {/* Decline */}
                <Box sx={{ textAlign: 'center' }}>
                    <Tooltip title="Decline" placement="top">
                        <IconButton
                            onClick={handleDecline}
                            disabled={connecting}
                            sx={{
                                width: 60, height: 60,
                                bgcolor: '#ef4444',
                                color: 'white',
                                '&:hover': { bgcolor: '#dc2626', transform: 'scale(1.06)' },
                                '&.Mui-disabled': { bgcolor: 'rgba(239,68,68,0.35)', color: 'rgba(255,255,255,0.4)' },
                                transition: 'all 0.18s ease',
                                boxShadow: '0 4px 20px rgba(239,68,68,0.4)',
                            }}
                        >
                            <CallEndIcon sx={{ fontSize: 26 }} />
                        </IconButton>
                    </Tooltip>
                    <Typography sx={{
                        color: 'rgba(255,255,255,0.35)', fontSize: '0.68rem',
                        fontWeight: 600, mt: 0.75, letterSpacing: '0.04em',
                    }}>
                        Decline
                    </Typography>
                </Box>

                {/* Answer */}
                <Box sx={{ textAlign: 'center' }}>
                    <Tooltip title="Answer" placement="top">
                        <IconButton
                            onClick={handleAnswer}
                            disabled={connecting}
                            sx={{
                                width: 60, height: 60,
                                bgcolor: '#22c55e',
                                color: 'white',
                                '&:hover': { bgcolor: '#16a34a', transform: 'scale(1.06)' },
                                '&.Mui-disabled': { bgcolor: 'rgba(34,197,94,0.35)', color: 'rgba(255,255,255,0.4)' },
                                transition: 'all 0.18s ease',
                                boxShadow: '0 4px 20px rgba(34,197,94,0.4)',
                            }}
                        >
                            {connecting
                                ? <CircularProgress size={22} sx={{ color: 'white' }} />
                                : <CallIcon sx={{ fontSize: 26 }} />
                            }
                        </IconButton>
                    </Tooltip>
                    <Typography sx={{
                        color: 'rgba(255,255,255,0.35)', fontSize: '0.68rem',
                        fontWeight: 600, mt: 0.75, letterSpacing: '0.04em',
                    }}>
                        {connecting ? 'Connecting…' : 'Answer'}
                    </Typography>
                </Box>
            </Box>
        </Dialog>
    );
}
