import { useState } from 'react';
import {
    Box, List, ListItem, ListItemButton, Typography,
    TextField, Badge, Avatar, InputAdornment, Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import useChatStore from '../../stores/useChatStore';
import usePresenceStore from '../../stores/usePresenceStore';
import useAuthStore from '../../stores/useAuthStore';

function unitInitials(unitNumber) {
    return unitNumber?.slice(0, 2).toUpperCase() || '?';
}

function formatLastTime(ts) {
    if (!ts) return '';
    const d   = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function UnitList({ units, activeUnitId, onSelectUnit }) {
    const [search, setSearch] = useState('');
    const { unreadCounts, messages } = useChatStore();
    const { onlineUsers }            = usePresenceStore();
    const { user }                   = useAuthStore();

    const filtered = units.filter((u) =>
        u.unit_number.toLowerCase().includes(search.toLowerCase()) ||
        u.owner_name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'white' }}>
            {/* Header */}
            <Box sx={{ px: 2.5, pt: 2, pb: 1.5 }}>
                <Typography sx={{
                    fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em',
                    textTransform: 'uppercase', color: 'text.disabled', mb: 1.5,
                }}>
                    Conversations
                </Typography>

                <TextField
                    size="small"
                    fullWidth
                    placeholder="Search units or residents…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" color="action" />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 2.5,
                            bgcolor: '#f7f8fa',
                            '& fieldset': { borderColor: 'transparent' },
                            '&:hover fieldset': { borderColor: '#d0d9e8' },
                            '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: '1.5px' },
                            boxShadow: 'none',
                        },
                    }}
                />
            </Box>

            <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />

            {/* List */}
            <List disablePadding sx={{ flex: 1, overflowY: 'auto' }}>
                {filtered.length === 0 && (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.disabled">No results found</Typography>
                    </Box>
                )}

                {filtered.map((unit) => {
                    const unread   = unreadCounts[unit.id] || 0;
                    const isOnline = Object.values(onlineUsers).some(
                        (u) => u.role === 'unit_owner' && unit.owner?.id === u.id
                    );
                    const isActive = activeUnitId === unit.id;

                    // Prefer live store messages, fall back to API-loaded last message
                    const storeMessages = messages[unit.id];
                    const lastMsg = storeMessages?.length > 0
                        ? storeMessages[storeMessages.length - 1]
                        : unit.messages?.[0];

                    const isSentByMe = lastMsg?.sender_id === user?.id;
                    const isSeen     = lastMsg?.status === 'read';

                    return (
                        <ListItem key={unit.id} disablePadding>
                            <ListItemButton
                                onClick={() => onSelectUnit(unit.id)}
                                sx={{
                                    px: 2, py: 1.5,
                                    bgcolor: isActive ? '#e8f0fb' : 'transparent',
                                    borderLeft: '3px solid',
                                    borderColor: isActive ? 'primary.main' : 'transparent',
                                    '&:hover': { bgcolor: isActive ? '#dde9f8' : '#f7f8fa' },
                                }}
                            >
                                <Badge
                                    overlap="circular"
                                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                    badgeContent={
                                        <Box sx={{
                                            width: 10, height: 10, borderRadius: '50%',
                                            bgcolor: isOnline ? '#16a34a' : '#d1d5db',
                                            border: '2px solid white',
                                            boxShadow: isOnline ? '0 0 0 1.5px rgba(22,163,74,0.25)' : 'none',
                                        }} />
                                    }
                                >
                                    <Avatar sx={{
                                        width: 42, height: 42,
                                        bgcolor: isActive ? 'primary.main' : '#e8edf5',
                                        color: isActive ? 'white' : 'primary.dark',
                                        fontWeight: 700, fontSize: 13,
                                        borderRadius: '12px',
                                    }}>
                                        {unitInitials(unit.unit_number)}
                                    </Avatar>
                                </Badge>

                                <Box sx={{ ml: 1.5, flex: 1, minWidth: 0 }}>
                                    {/* Row 1: unit number + timestamp */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography
                                            variant="body2"
                                            fontWeight={unread > 0 ? 700 : 600}
                                            noWrap
                                            sx={{ color: isActive ? 'primary.dark' : 'text.primary' }}
                                        >
                                            Unit {unit.unit_number}
                                        </Typography>
                                        {lastMsg && (
                                            <Typography sx={{
                                                fontSize: '0.65rem',
                                                color: unread > 0 ? 'primary.main' : 'text.disabled',
                                                fontWeight: unread > 0 ? 600 : 400,
                                                flexShrink: 0, ml: 1,
                                            }}>
                                                {formatLastTime(lastMsg.created_at)}
                                            </Typography>
                                        )}
                                    </Box>

                                    {/* Row 2: last message preview + seen/unread indicator */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.15 }}>
                                        <Typography
                                            variant="caption"
                                            noWrap
                                            sx={{
                                                flex: 1,
                                                color: unread > 0 ? 'text.primary' : 'text.secondary',
                                                fontWeight: unread > 0 ? 600 : 400,
                                                fontSize: '0.7rem',
                                            }}
                                        >
                                            {lastMsg ? lastMsg.body : unit.owner_name}
                                        </Typography>

                                        {unread > 0 ? (
                                            <Box sx={{
                                                width: 8, height: 8, borderRadius: '50%',
                                                bgcolor: 'primary.main', flexShrink: 0,
                                            }} />
                                        ) : isSentByMe && lastMsg ? (
                                            <Tooltip title={isSeen ? 'Seen' : 'Sent'}>
                                                <DoneAllIcon sx={{
                                                    fontSize: 13,
                                                    color: isSeen ? 'primary.main' : '#bdbdbd',
                                                    flexShrink: 0,
                                                }} />
                                            </Tooltip>
                                        ) : null}
                                    </Box>
                                </Box>
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>
        </Box>
    );
}
