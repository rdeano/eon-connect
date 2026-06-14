import { useEffect, useRef, useState } from 'react';
import { Box, TextField, Button, Typography, Stack, Avatar, IconButton, Tooltip } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import api from '../../services/api';
import useChatStore from '../../stores/useChatStore';
import useAuthStore from '../../stores/useAuthStore';
import usePresenceStore from '../../stores/usePresenceStore';

function formatTime(ts) {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(ts) {
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function ReceptionChat({ unitId, unit }) {
    const [input,   setInput]   = useState('');
    const [sending, setSending] = useState(false);
    const bottomRef = useRef(null);
    const { messages, setMessages, addMessage } = useChatStore();
    const { user }       = useAuthStore();
    const { onlineUsers } = usePresenceStore();
    const unitMessages   = messages[unitId] || [];

    const isOwnerOnline = unit?.owner
        ? Object.values(onlineUsers).some((u) => u.id === unit.owner.id)
        : false;

    useEffect(() => {
        api.get(`/conversations/${unitId}`).then((res) => {
            setMessages(unitId, res.data.data);
        });
    }, [unitId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [unitMessages]);

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

    // Group messages by date
    let lastDate = null;

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f7f8fa' }}>
            {/* Chat header */}
            <Box sx={{
                px: 3, py: 1.5,
                bgcolor: 'white',
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
            }}>
                <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 700, fontSize: 13, width: 38, height: 38 }}>
                    {unit?.unit_number?.slice(0, 2).toUpperCase() || '?'}
                </Avatar>
                <Box>
                    <Typography variant="subtitle2" fontWeight={700}>
                        Unit {unit?.unit_number} — {unit?.owner_name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: isOwnerOnline ? 'success.main' : 'text.disabled' }}>
                        {isOwnerOnline ? '● Online' : '○ Offline'}
                    </Typography>
                </Box>
            </Box>

            {/* Messages */}
            <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2 }}>
                {unitMessages.length === 0 && (
                    <Box sx={{ textAlign: 'center', mt: 6 }}>
                        <Typography variant="body2" color="text.disabled">No messages yet</Typography>
                    </Box>
                )}
                <Stack spacing={0.5}>
                    {unitMessages.map((msg) => {
                        const isSent     = msg.sender_id === user?.id || msg.sender?.role === 'reception';
                        const dateLabel  = formatDate(msg.created_at);
                        const showDate   = dateLabel !== lastDate;
                        lastDate         = dateLabel;

                        return (
                            <Box key={msg.id}>
                                {showDate && (
                                    <Box sx={{ textAlign: 'center', my: 2 }}>
                                        <Typography variant="caption" sx={{
                                            bgcolor: '#e0e6ef', color: 'text.secondary',
                                            px: 1.5, py: 0.4, borderRadius: 10, fontSize: 11,
                                        }}>
                                            {dateLabel}
                                        </Typography>
                                    </Box>
                                )}
                                <Box sx={{ display: 'flex', justifyContent: isSent ? 'flex-end' : 'flex-start', mb: 0.5 }}>
                                    <Box sx={{ maxWidth: '65%' }}>
                                        <Box sx={{
                                            px: 2, py: 1,
                                            bgcolor: isSent ? 'primary.main' : 'white',
                                            color: isSent ? 'white' : 'text.primary',
                                            borderRadius: isSent ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                                        }}>
                                            <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                                                {msg.body}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3, justifyContent: isSent ? 'flex-end' : 'flex-start', px: 0.5 }}>
                                            <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>
                                                {formatTime(msg.created_at)}
                                            </Typography>
                                            {isSent && (
                                                <DoneAllIcon sx={{ fontSize: 12, color: msg.status === 'read' ? '#1A56A0' : '#bdbdbd' }} />
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

            {/* Input */}
            <Box sx={{
                px: 2, py: 1.5,
                bgcolor: 'white',
                borderTop: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                gap: 1,
                alignItems: 'flex-end',
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
                        },
                    }}
                />
                <Tooltip title="Send (Enter)">
                    <span>
                        <IconButton
                            onClick={sendMessage}
                            disabled={sending || !input.trim()}
                            sx={{
                                bgcolor: 'primary.main',
                                color: 'white',
                                width: 40, height: 40,
                                '&:hover': { bgcolor: 'primary.dark' },
                                '&.Mui-disabled': { bgcolor: '#e0e0e0', color: '#9e9e9e' },
                            }}
                        >
                            <SendIcon fontSize="small" />
                        </IconButton>
                    </span>
                </Tooltip>
            </Box>
        </Box>
    );
}
