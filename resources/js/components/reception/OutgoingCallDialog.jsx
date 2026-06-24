import { useEffect, useRef, useState } from 'react';
import {
    Dialog, Box, Typography, Avatar,
    CircularProgress, Button, IconButton, Tooltip,
} from '@mui/material';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon     from '@mui/icons-material/Mic';
import MicOffIcon  from '@mui/icons-material/MicOff';
import useCallStore from '../../stores/useCallStore';
import api from '../../services/api';
import { useRingbackTone } from '../../hooks/useCallTone';

const TIMEOUT = 30;
const BG      = '#0f172a';

function fmt(s) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function OutgoingCallDialog() {
    const [callSeconds, setCallSeconds] = useState(0);
    const [waitSeconds, setWaitSeconds] = useState(0);
    const timeoutRef = useRef(null);

    const {
        status, direction, unitId, calleeName,
        isMuted, remoteJoined, noMic,
        setMuted, reset,
    } = useCallStore();

    const open = direction === 'outbound' && status !== 'idle';

    // Ringback tone while waiting for callee to answer
    useRingbackTone(open && status === 'active' && !remoteJoined);

    // Wait timer (ringing phase)
    useEffect(() => {
        if (!open || status !== 'active' || remoteJoined) {
            setWaitSeconds(0);
            return;
        }
        setWaitSeconds(0);
        const t = setInterval(() => setWaitSeconds((s) => s + 1), 1000);
        return () => clearInterval(t);
    }, [open, status, remoteJoined]);

    // Call duration timer (active phase — callee answered)
    useEffect(() => {
        if (!open || !remoteJoined) {
            setCallSeconds(0);
            return;
        }
        setCallSeconds(0);
        const t = setInterval(() => setCallSeconds((s) => s + 1), 1000);
        return () => clearInterval(t);
    }, [open, remoteJoined]);

    // Auto-cancel if callee doesn't join within TIMEOUT seconds
    useEffect(() => {
        if (!open || status !== 'active' || remoteJoined) {
            clearTimeout(timeoutRef.current);
            return;
        }
        timeoutRef.current = setTimeout(() => handleEndCall(), TIMEOUT * 1000);
        return () => clearTimeout(timeoutRef.current);
    }, [open, status, remoteJoined]);

    const handleEndCall = async () => {
        clearTimeout(timeoutRef.current);
        const state = useCallStore.getState();
        const { room, unitId: cUnitId } = state;
        state.reset();
        if (room) { try { room.disconnect(); } catch {} }
        try { await api.post('/calls/end', { unit_id: cUnitId }); } catch {}
    };

    const handleToggleMute = async () => {
        const state = useCallStore.getState();
        if (!state.room) return;
        const next = !state.isMuted;
        await state.room.localParticipant.setMicrophoneEnabled(!next);
        setMuted(next);
    };

    const initial = (calleeName || '?').charAt(0).toUpperCase();

    const isConnecting = status === 'calling';
    const isRinging    = status === 'active' && !remoteJoined;
    const isActive     = status === 'active' && remoteJoined;

    const remaining  = TIMEOUT - waitSeconds;
    const isUrgent   = isRinging && remaining <= 10;

    return (
        <Dialog
            open={open}
            maxWidth={false}
            PaperProps={{
                elevation: 0,
                sx: {
                    width: 360,
                    borderRadius: '20px',
                    overflow: 'hidden',
                    bgcolor: BG,
                    boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
                    border: '1px solid rgba(255,255,255,0.08)',
                },
            }}
            BackdropProps={{
                sx: { backdropFilter: 'blur(6px)', bgcolor: 'rgba(0,0,0,0.55)' },
            }}
        >
            <Box sx={{ bgcolor: BG }}>

                {/* ── Header label ─────────────────────────────── */}
                <Box sx={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 1,
                    pt: 3, pb: 0,
                }}>
                    <Box sx={{
                        width: 7, height: 7, borderRadius: '50%',
                        bgcolor: isActive ? '#4ade80' : '#60a5fa',
                        boxShadow: isActive
                            ? '0 0 8px 2px rgba(74,222,128,0.6)'
                            : '0 0 8px 2px rgba(96,165,250,0.6)',
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
                        {isConnecting ? 'Connecting…' : isRinging ? 'Outgoing Voice Call' : 'Call Connected'}
                    </Typography>
                </Box>

                {/* ── Avatar ring ──────────────────────────────── */}
                <Box sx={{ display: 'flex', justifyContent: 'center', pt: 3.5, pb: 2 }}>
                    <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        {/* Track ring */}
                        <CircularProgress
                            variant="determinate"
                            value={100}
                            size={100}
                            thickness={2.5}
                            sx={{ position: 'absolute', color: 'rgba(255,255,255,0.08)' }}
                        />
                        {/* Spinning arc when connecting/ringing; depleting when active */}
                        {isActive ? (
                            <CircularProgress
                                variant="determinate"
                                value={100}
                                size={100}
                                thickness={2.5}
                                sx={{ position: 'absolute', color: '#4ade80' }}
                            />
                        ) : (
                            <CircularProgress
                                variant="indeterminate"
                                size={100}
                                thickness={2.5}
                                sx={{
                                    position: 'absolute',
                                    color: isUrgent ? '#f87171' : '#60a5fa',
                                    transition: 'color 0.5s ease',
                                }}
                            />
                        )}
                        {/* Pulse glow */}
                        <Box sx={{
                            position: 'absolute',
                            width: 78, height: 78, borderRadius: '50%',
                            bgcolor: isActive
                                ? 'rgba(74,222,128,0.10)'
                                : isUrgent
                                    ? 'rgba(248,113,113,0.12)'
                                    : 'rgba(96,165,250,0.10)',
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

                {/* ── Callee name + status ─────────────────────── */}
                <Box sx={{ textAlign: 'center', px: 3, pb: 0 }}>
                    <Typography sx={{
                        color: '#ffffff',
                        fontSize: '1.35rem',
                        fontWeight: 700,
                        lineHeight: 1.25,
                        mb: 0.5,
                    }}>
                        {calleeName ?? 'Unknown'}
                    </Typography>
                    <Typography sx={{
                        color: 'rgba(255,255,255,0.45)',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        letterSpacing: '0.02em',
                    }}>
                        {isConnecting && 'Connecting…'}
                        {isRinging    && `Ringing  ·  ${fmt(waitSeconds)}`}
                        {isActive     && `●  ${fmt(callSeconds)}`}
                    </Typography>
                </Box>

                {/* ── Listen-only badge (no microphone) ───────── */}
                {isActive && noMic && (
                    <Box sx={{ textAlign: 'center', pt: 1.5 }}>
                        <Box component="span" sx={{
                            display: 'inline-flex', alignItems: 'center', gap: 0.75,
                            px: 1.5, py: 0.5, borderRadius: '20px',
                            bgcolor: 'rgba(251,191,36,0.12)',
                            border: '1px solid rgba(251,191,36,0.3)',
                        }}>
                            <MicOffIcon sx={{ fontSize: 13, color: '#fbbf24' }} />
                            <Typography sx={{ color: '#fbbf24', fontSize: '0.7rem', fontWeight: 600 }}>
                                Listen only · No microphone detected
                            </Typography>
                        </Box>
                    </Box>
                )}

                {/* ── Auto-cancel badge (ringing phase only) ───── */}
                {isRinging && (
                    <Box sx={{ textAlign: 'center', pt: 2, pb: 0 }}>
                        <Box component="span" sx={{
                            display: 'inline-block',
                            px: 1.5, py: 0.4,
                            borderRadius: '20px',
                            bgcolor: isUrgent ? 'rgba(239,68,68,0.18)' : 'rgba(255,255,255,0.07)',
                            border: `1px solid ${isUrgent ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.1)'}`,
                            transition: 'all 0.4s',
                        }}>
                            <Typography sx={{
                                color: isUrgent ? '#fca5a5' : 'rgba(255,255,255,0.35)',
                                fontSize: '0.7rem', fontWeight: 600,
                                letterSpacing: '0.05em',
                                transition: 'color 0.4s',
                            }}>
                                Auto-cancel in 0:{String(remaining).padStart(2, '0')}
                            </Typography>
                        </Box>
                    </Box>
                )}

                {/* ── Action buttons ────────────────────────────── */}
                <Box sx={{ display: 'flex', gap: 1.5, px: 3, pt: 3, pb: 3.5, justifyContent: 'center' }}>
                    {isActive && !noMic && (
                        <Tooltip title={isMuted ? 'Unmute' : 'Mute'}>
                            <IconButton
                                onClick={handleToggleMute}
                                sx={{
                                    bgcolor: isMuted ? 'rgba(251,191,36,0.18)' : 'rgba(255,255,255,0.08)',
                                    color:   isMuted ? '#fbbf24' : 'rgba(255,255,255,0.7)',
                                    border:  `1px solid ${isMuted ? 'rgba(251,191,36,0.35)' : 'rgba(255,255,255,0.12)'}`,
                                    width: 52, height: 52,
                                    '&:hover': {
                                        bgcolor: isMuted ? 'rgba(251,191,36,0.28)' : 'rgba(255,255,255,0.14)',
                                    },
                                }}
                            >
                                {isMuted ? <MicOffIcon /> : <MicIcon />}
                            </IconButton>
                        </Tooltip>
                    )}

                    <Button
                        variant="contained"
                        onClick={handleEndCall}
                        startIcon={<CallEndIcon />}
                        style={{ background: '#ef4444', color: '#ffffff', borderRadius: 12 }}
                        sx={{
                            fontWeight: 700, fontSize: '0.9rem',
                            py: 1.25, px: 4, textTransform: 'none',
                            boxShadow: '0 4px 16px rgba(239,68,68,0.4)',
                            '&:hover': { background: '#dc2626 !important', boxShadow: '0 6px 20px rgba(239,68,68,0.55)' },
                        }}
                    >
                        {isActive ? 'End Call' : 'Cancel'}
                    </Button>
                </Box>
            </Box>
        </Dialog>
    );
}
