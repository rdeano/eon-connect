import { useEffect, useRef, useState } from 'react';
import {
    Box, TextField, Typography, Stack, Avatar,
    IconButton, Tooltip, CircularProgress, Chip,
} from '@mui/material';
import SendIcon     from '@mui/icons-material/Send';
import DoneAllIcon  from '@mui/icons-material/DoneAll';
import CallIcon     from '@mui/icons-material/Call';
import CallEndIcon  from '@mui/icons-material/CallEnd';
import MicIcon      from '@mui/icons-material/Mic';
import MicOffIcon   from '@mui/icons-material/MicOff';
import { Room, RoomEvent } from 'livekit-client';
import api from '../../services/api';
import useChatStore  from '../../stores/useChatStore';
import useAuthStore  from '../../stores/useAuthStore';
import usePresenceStore from '../../stores/usePresenceStore';
import useCallStore  from '../../stores/useCallStore';

function formatTime(ts) {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(ts) {
    const d         = new Date(ts);
    const today     = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString())     return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatDuration(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

export default function ReceptionChat({ unitId, unit }) {
    const [input,       setInput]       = useState('');
    const [sending,     setSending]     = useState(false);
    const [callSeconds, setCallSeconds] = useState(0);
    const bottomRef  = useRef(null);
    const timerRef   = useRef(null);

    const { messages, setMessages, addMessage, markUnitMessagesRead } = useChatStore();
    const { user }        = useAuthStore();
    const { onlineUsers } = usePresenceStore();
    const callStore       = useCallStore();

    const unitMessages    = messages[unitId] || [];
    const isOwnerOnline   = unit?.owner
        ? Object.values(onlineUsers).some((u) => u.id === unit.owner.id)
        : false;

    // Is the current active call with THIS unit?
    const isThisUnitOnCall = callStore.unitId === unitId &&
        (callStore.status === 'calling' || callStore.status === 'active');

    // Load messages when unit changes
    useEffect(() => {
        api.get(`/conversations/${unitId}`).then((res) => {
            setMessages(unitId, res.data.data);
            api.patch(`/conversations/${unitId}/read`).then(() => {
                markUnitMessagesRead(unitId, user?.id);
            });
        });
    }, [unitId]);

    // Scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [unitMessages]);

    // Call duration timer
    useEffect(() => {
        if (isThisUnitOnCall && callStore.status === 'active') {
            setCallSeconds(0);
            timerRef.current = setInterval(() => setCallSeconds((s) => s + 1), 1000);
        } else {
            clearInterval(timerRef.current);
            setCallSeconds(0);
        }
        return () => clearInterval(timerRef.current);
    }, [isThisUnitOnCall, callStore.status]);

    const handleCall = async () => {
        if (callStore.status !== 'idle') return;
        callStore.setCalling(unitId);
        try {
            const res = await api.post('/calls/token', { unit_id: unitId });
            const { token, livekit_url } = res.data;

            // Send invite first so the callee rings immediately,
            // regardless of how long our own room connection takes.
            await api.post('/calls/invite', { unit_id: unitId });

            const room = new Room({ adaptiveStream: true, dynacast: true });

            room.on(RoomEvent.Disconnected, () => {
                if (useCallStore.getState().room === room) {
                    useCallStore.getState().reset();
                }
            });

            await room.connect(livekit_url, token);
            await room.startAudio();
            await room.localParticipant.setMicrophoneEnabled(true);

            callStore.setRoom(room);
            callStore.setActive();
        } catch (e) {
            console.error('[Call] start failed:', e);
            useCallStore.getState().reset();
        }
    };

    const handleEndCall = async () => {
        const { room, unitId: cUnitId } = useCallStore.getState();
        useCallStore.getState().reset();         // clears store first → Disconnected listener is a no-op
        if (room) { try { room.disconnect(); } catch {} }
        try { await api.post('/calls/end', { unit_id: cUnitId }); } catch {}
    };

    const handleToggleMute = async () => {
        const { room, isMuted } = useCallStore.getState();
        if (!room) return;
        const next = !isMuted;
        await room.localParticipant.setMicrophoneEnabled(!next);
        callStore.setMuted(next);
    };

    const sendMessage = async () => {
        if (!input.trim()) return;
        setSending(true);
        try {
            const res = await api.post(`/conversations/${unitId}`, { body: input });
            addMessage(unitId, res.data.data);
            setInput('');
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    let lastDate = null;

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f0f4f9' }}>

            {/* ── Chat header ─────────────────────────────────────────────── */}
            <Box sx={{
                px: 3, py: 1.5,
                bgcolor: 'white',
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
            }}>
                <Avatar sx={{
                    background: 'linear-gradient(135deg, #1e6fc0 0%, #0d3b73 100%)',
                    fontWeight: 700, fontSize: 13,
                    width: 40, height: 40,
                    borderRadius: '12px',
                }}>
                    {unit?.unit_number?.slice(0, 2).toUpperCase() || '?'}
                </Avatar>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight={700} noWrap>
                        Unit {unit?.unit_number}
                        {unit?.owner_name && (
                            <Typography component="span" variant="subtitle2" fontWeight={400} color="text.secondary">
                                {' '}— {unit.owner_name}
                            </Typography>
                        )}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.1 }}>
                        <Box sx={{
                            width: 7, height: 7, borderRadius: '50%',
                            bgcolor: isOwnerOnline ? '#16a34a' : '#d1d5db',
                            boxShadow: isOwnerOnline ? '0 0 0 2px rgba(22,163,74,0.2)' : 'none',
                        }} />
                        <Typography sx={{
                            fontSize: '0.68rem',
                            color: isOwnerOnline ? 'success.main' : 'text.disabled',
                            fontWeight: isOwnerOnline ? 600 : 400,
                        }}>
                            {isOwnerOnline ? 'Online' : 'Offline'}
                        </Typography>
                    </Box>
                </Box>

                {/* ── Call controls ─────────────────────────────────────── */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                    {isThisUnitOnCall && callStore.status === 'active' && (
                        <>
                            {/* Duration chip */}
                            <Chip
                                label={formatDuration(callSeconds)}
                                size="small"
                                sx={{
                                    bgcolor: 'success.50', color: 'success.dark',
                                    fontWeight: 700, fontSize: '0.75rem',
                                    height: 26,
                                }}
                            />

                            {/* Mute toggle */}
                            <Tooltip title={callStore.isMuted ? 'Unmute' : 'Mute'}>
                                <IconButton
                                    size="small"
                                    onClick={handleToggleMute}
                                    sx={{
                                        bgcolor: callStore.isMuted ? 'warning.100' : 'grey.100',
                                        color:   callStore.isMuted ? 'warning.dark' : 'text.secondary',
                                        '&:hover': { bgcolor: callStore.isMuted ? 'warning.200' : 'grey.200' },
                                        width: 34, height: 34,
                                    }}
                                >
                                    {callStore.isMuted ? <MicOffIcon fontSize="small" /> : <MicIcon fontSize="small" />}
                                </IconButton>
                            </Tooltip>

                            {/* End call */}
                            <Tooltip title="End call">
                                <IconButton
                                    size="small"
                                    onClick={handleEndCall}
                                    sx={{
                                        bgcolor: 'error.main', color: 'white',
                                        '&:hover': { bgcolor: 'error.dark' },
                                        width: 34, height: 34,
                                    }}
                                >
                                    <CallEndIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </>
                    )}

                    {isThisUnitOnCall && callStore.status === 'calling' && (
                        <Chip
                            icon={<CircularProgress size={12} color="inherit" />}
                            label="Calling…"
                            size="small"
                            sx={{ bgcolor: 'primary.50', color: 'primary.dark', fontWeight: 600, height: 26 }}
                        />
                    )}

                    {/* Call button — only shown when no call is active for any unit */}
                    {callStore.status === 'idle' && (
                        <Tooltip title="Start voice call">
                            <IconButton
                                size="small"
                                onClick={handleCall}
                                sx={{
                                    bgcolor: 'success.main', color: 'white',
                                    '&:hover': { bgcolor: 'success.dark' },
                                    width: 34, height: 34,
                                }}
                            >
                                <CallIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            </Box>

            {/* ── Messages ────────────────────────────────────────────────── */}
            <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2.5 }}>
                {unitMessages.length === 0 && (
                    <Box sx={{ textAlign: 'center', mt: 8 }}>
                        <Typography variant="body2" color="text.disabled">
                            No messages yet — start the conversation!
                        </Typography>
                    </Box>
                )}
                <Stack spacing={0.5}>
                    {unitMessages.map((msg) => {
                        const isSent    = msg.sender_id === user?.id || msg.sender?.role === 'reception';
                        const dateLabel = formatDate(msg.created_at);
                        const showDate  = dateLabel !== lastDate;
                        lastDate        = dateLabel;

                        return (
                            <Box key={msg.id}>
                                {showDate && (
                                    <Box sx={{ textAlign: 'center', my: 2.5 }}>
                                        <Typography sx={{
                                            display: 'inline-block',
                                            bgcolor: 'rgba(0,0,0,0.06)', color: 'text.secondary',
                                            px: 2, py: 0.5, borderRadius: 10,
                                            fontSize: '0.68rem', fontWeight: 500,
                                        }}>
                                            {dateLabel}
                                        </Typography>
                                    </Box>
                                )}
                                <Box sx={{ display: 'flex', justifyContent: isSent ? 'flex-end' : 'flex-start', mb: 0.75 }}>
                                    <Box sx={{ maxWidth: '65%' }}>
                                        <Box sx={{
                                            px: 2.5, py: 1.25,
                                            bgcolor: isSent ? 'primary.main' : 'white',
                                            color: isSent ? 'white' : 'text.primary',
                                            borderRadius: isSent ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                            boxShadow: isSent
                                                ? '0 2px 8px rgba(26,86,160,0.22)'
                                                : '0 1px 4px rgba(0,0,0,0.08)',
                                        }}>
                                            <Typography variant="body2" sx={{ lineHeight: 1.55, fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                                                {msg.body}
                                            </Typography>
                                        </Box>
                                        <Box sx={{
                                            display: 'flex', alignItems: 'center', gap: 0.4, mt: 0.4,
                                            justifyContent: isSent ? 'flex-end' : 'flex-start',
                                            px: 0.75,
                                        }}>
                                            <Typography sx={{ fontSize: '0.63rem', color: 'text.disabled' }}>
                                                {formatTime(msg.created_at)}
                                            </Typography>
                                            {isSent && (
                                                <Tooltip title={msg.status === 'read' ? 'Seen' : 'Sent'}>
                                                    <DoneAllIcon sx={{ fontSize: 11, color: msg.status === 'read' ? 'primary.main' : '#bdbdbd' }} />
                                                </Tooltip>
                                            )}
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        );
                    })}
                    <div ref={bottomRef} />
                </Stack>
            </Box>

            {/* ── Input ───────────────────────────────────────────────────── */}
            <Box sx={{
                px: 2.5, py: 2,
                bgcolor: 'white',
                borderTop: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                gap: 1.5,
                alignItems: 'flex-end',
                boxShadow: '0 -1px 6px rgba(0,0,0,0.04)',
            }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Type a message…"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    multiline
                    maxRows={4}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                            bgcolor: '#f7f8fa',
                            fontSize: '0.875rem',
                            '& fieldset': { borderColor: '#e2e8f0' },
                            '&:hover fieldset': { borderColor: '#c0cfe8' },
                            '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: '1.5px' },
                        },
                    }}
                />
                <Tooltip title="Send (Enter)">
                    <span>
                        <IconButton
                            onClick={sendMessage}
                            disabled={sending || !input.trim()}
                            sx={{
                                background: sending || !input.trim()
                                    ? '#e5e7eb'
                                    : 'linear-gradient(135deg, #1e6fc0 0%, #0d3b73 100%)',
                                color: sending || !input.trim() ? '#9ca3af' : 'white',
                                width: 42, height: 42,
                                borderRadius: '12px',
                                flexShrink: 0,
                                transition: 'all 0.15s ease',
                                '&:hover:not(.Mui-disabled)': {
                                    background: 'linear-gradient(135deg, #2578d1 0%, #0f4489 100%)',
                                    boxShadow: '0 4px 14px rgba(26,86,160,0.35)',
                                },
                                '&.Mui-disabled': { background: '#e5e7eb', color: '#9ca3af' },
                            }}
                        >
                            {sending ? <CircularProgress size={17} sx={{ color: 'inherit' }} /> : <SendIcon fontSize="small" />}
                        </IconButton>
                    </span>
                </Tooltip>
            </Box>
        </Box>
    );
}
