import { useEffect, useState } from 'react';
import {
    Dialog, Box, Typography, Avatar,
    CircularProgress, Button, IconButton, Tooltip,
    Snackbar, Alert,
} from '@mui/material';
import CallIcon    from '@mui/icons-material/Call';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon     from '@mui/icons-material/Mic';
import MicOffIcon  from '@mui/icons-material/MicOff';
import { Room, RoomEvent, Track } from 'livekit-client';
import useCallStore from '../../stores/useCallStore';
import api from '../../services/api';
import { useRingtone } from '../../hooks/useCallTone';

const TIMEOUT = 30;
const BG      = '#0f172a';

function fmt(s) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function IncomingCallDialog() {
    const [connecting,   setConnecting]   = useState(false);
    const [ringSeconds,  setRingSeconds]  = useState(0);
    const [callSeconds,  setCallSeconds]  = useState(0);
    const [callError,    setCallError]    = useState(null);
    const { status, direction, unitId, callerName, token, livekitUrl, isMuted, noMic, setRoom, setActive, setMuted, reset } = useCallStore();

    const isInbound = direction === 'inbound';
    const isRinging = status === 'ringing';
    const isActive  = status === 'active' && isInbound;

    useRingtone(isRinging);

    useEffect(() => {
        if (!isRinging) { setRingSeconds(0); return; }
        setRingSeconds(0);
        const t = setInterval(() => setRingSeconds((s) => s + 1), 1000);
        return () => clearInterval(t);
    }, [isRinging]);

    useEffect(() => {
        if (!isActive) { setCallSeconds(0); return; }
        setCallSeconds(0);
        const t = setInterval(() => setCallSeconds((s) => s + 1), 1000);
        return () => clearInterval(t);
    }, [isActive]);

    useEffect(() => {
        if (!isRinging) return;
        const t = setTimeout(async () => {
            try { await api.post('/calls/end', { unit_id: unitId }); } catch {}
            reset();
        }, TIMEOUT * 1000);
        return () => clearTimeout(t);
    }, [isRinging]);

    const handleAnswer = async () => {
        setConnecting(true);

        // Unlock the browser's audio autoplay policy synchronously, before any awaits
        // consume the click handler's user-activation window. LiveKit creates its own
        // AudioContext internally; once ANY context is resumed via a gesture the browser
        // unlocks audio for the whole page, so room.startAudio() will succeed even after
        // the async connect() call finishes.
        try { const c = new AudioContext(); c.resume().then(() => c.close()); } catch {}

        try {
            // Atomically claim the call — 409 means another receptionist already answered.
            try {
                await api.post('/calls/answer', { unit_id: unitId });
            } catch (claimErr) {
                if (claimErr?.response?.status === 409) {
                    setCallError('This call was already answered by another receptionist.');
                    reset();
                    return;
                }
                throw claimErr;
            }

            const room = new Room({ adaptiveStream: true, dynacast: true });

            room.on(RoomEvent.Disconnected, () => {
                if (useCallStore.getState().room === room) useCallStore.getState().reset();
            });

            // The raw Room API does not render remote audio automatically — that is only
            // done by @livekit/components-react. We must attach each subscribed audio
            // track to an <audio> element so the browser actually plays it.
            room.on(RoomEvent.TrackSubscribed, (track) => {
                if (track.kind === Track.Kind.Audio) track.attach();
            });
            room.on(RoomEvent.TrackUnsubscribed, (track) => {
                if (track.kind === Track.Kind.Audio) track.detach();
            });

            await room.connect(livekitUrl, token);
            await room.startAudio();
            try {
                await room.localParticipant.setMicrophoneEnabled(true);
            } catch (micErr) {
                console.warn('[Call] no microphone available, continuing in listen-only mode:', micErr);
                useCallStore.getState().setNoMic(true);
            }
            setRoom(room);
            setActive();
        } catch (e) {
            console.error('[Call] answer failed:', e);
            setCallError('Could not connect to the call. Please try again.');
            reset();
        } finally {
            setConnecting(false);
        }
    };

    const handleDecline = async () => {
        try { await api.post('/calls/end', { unit_id: unitId }); } catch {}
        reset();
    };

    const handleEndCall = async () => {
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

    const remaining = TIMEOUT - ringSeconds;
    const progress  = (remaining / TIMEOUT) * 100;
    const isUrgent  = remaining <= 10;
    const initial   = (callerName || '?').charAt(0).toUpperCase();

    return (
        <>
        <Dialog
            open={isRinging || isActive}
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
            {/* bgcolor repeated here so inner content never shows white if Paper bg loses specificity */}
            <Box sx={{ bgcolor: BG }}>

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
                        {isActive ? 'Call Connected' : 'Incoming Voice Call'}
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
                        {/* Depleting arc (ringing) / solid arc (active) */}
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
                                variant="determinate"
                                value={progress}
                                size={100}
                                thickness={2.5}
                                sx={{
                                    position: 'absolute',
                                    color: isUrgent ? '#f87171' : '#4ade80',
                                    transition: 'color 0.5s ease',
                                    transform: 'rotate(-90deg) !important',
                                }}
                            />
                        )}
                        {/* Subtle pulse glow */}
                        <Box sx={{
                            position: 'absolute',
                            width: 78, height: 78, borderRadius: '50%',
                            bgcolor: isActive
                                ? 'rgba(74,222,128,0.10)'
                                : isUrgent
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
                        {isActive ? `●  ${fmt(callSeconds)}` : `Ringing  ·  ${fmt(ringSeconds)}`}
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

                {/* ── Auto-decline badge (ringing only) ────────── */}
                {isRinging && (
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
                )}

                {/* ── Action buttons ────────────────────────────── */}
                {isActive ? (
                    <Box sx={{ display: 'flex', gap: 1.5, px: 3, pt: 3, pb: 3.5, justifyContent: 'center' }}>
                        {!noMic && <Tooltip title={isMuted ? 'Unmute' : 'Mute'}>
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
                        </Tooltip>}

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
                            End Call
                        </Button>
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', gap: 1.5, px: 3, pt: 3, pb: 3.5 }}>
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={handleDecline}
                            disabled={connecting}
                            startIcon={<CallEndIcon />}
                            style={{ background: '#ef4444', color: '#ffffff', borderRadius: 12 }}
                            sx={{
                                fontWeight: 700, fontSize: '0.9rem',
                                py: 1.25, textTransform: 'none',
                                boxShadow: '0 4px 16px rgba(239,68,68,0.4)',
                                '&:hover': { background: '#dc2626 !important', boxShadow: '0 6px 20px rgba(239,68,68,0.55)' },
                                '&.Mui-disabled': { background: 'rgba(239,68,68,0.35) !important', color: 'rgba(255,255,255,0.45) !important' },
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
                            style={{ background: '#22c55e', color: '#ffffff', borderRadius: 12 }}
                            sx={{
                                fontWeight: 700, fontSize: '0.9rem',
                                py: 1.25, textTransform: 'none',
                                boxShadow: '0 4px 16px rgba(34,197,94,0.4)',
                                '&:hover': { background: '#16a34a !important', boxShadow: '0 6px 20px rgba(34,197,94,0.55)' },
                                '&.Mui-disabled': { background: 'rgba(34,197,94,0.35) !important', color: 'rgba(255,255,255,0.45) !important' },
                            }}
                        >
                            {connecting ? 'Connecting…' : 'Answer'}
                        </Button>
                    </Box>
                )}
            </Box>
        </Dialog>

        <Snackbar
            open={!!callError}
            autoHideDuration={6000}
            onClose={() => setCallError(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
            <Alert severity="error" onClose={() => setCallError(null)} sx={{ width: '100%' }}>
                {callError}
            </Alert>
        </Snackbar>
        </>
    );
}
