import { useState } from 'react';
import {
    Box, List, ListItem, ListItemButton, Typography,
    TextField, Badge, Avatar, InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import useChatStore from '../../stores/useChatStore';
import usePresenceStore from '../../stores/usePresenceStore';

function unitInitials(unitNumber) {
    return unitNumber?.slice(0, 2).toUpperCase() || '?';
}

export default function UnitList({ units, activeUnitId, onSelectUnit }) {
    const [search, setSearch] = useState('');
    const { unreadCounts } = useChatStore();
    const { onlineUsers }  = usePresenceStore();

    const filtered = units.filter((u) =>
        u.unit_number.toLowerCase().includes(search.toLowerCase()) ||
        u.owner_name.toLowerCase().includes(search.toLowerCase())
    );

    const totalUnread = Object.values(unreadCounts).reduce((sum, c) => sum + c, 0);

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'white' }}>
            {/* Header */}
            <Box sx={{ px: 2.5, pt: 2, pb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography sx={{
                        fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em',
                        textTransform: 'uppercase', color: 'text.disabled',
                    }}>
                        Conversations
                    </Typography>
                    {totalUnread > 0 && (
                        <Box sx={{
                            minWidth: 18, height: 18, borderRadius: 9,
                            bgcolor: 'primary.main', color: 'white',
                            fontSize: 10, fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', px: 0.5,
                        }}>
                            {totalUnread > 99 ? '99+' : totalUnread}
                        </Box>
                    )}
                </Box>

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
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography
                                            variant="body2"
                                            fontWeight={isActive || unread > 0 ? 700 : 600}
                                            noWrap
                                            sx={{ color: isActive ? 'primary.dark' : 'text.primary' }}
                                        >
                                            Unit {unit.unit_number}
                                        </Typography>
                                        {unread > 0 && (
                                            <Box sx={{
                                                minWidth: 20, height: 20, borderRadius: 10,
                                                bgcolor: 'primary.main', color: 'white',
                                                fontSize: 11, fontWeight: 700, flexShrink: 0,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', px: 0.5,
                                            }}>
                                                {unread > 99 ? '99+' : unread}
                                            </Box>
                                        )}
                                    </Box>
                                    <Typography
                                        variant="caption"
                                        noWrap
                                        sx={{
                                            color: isOnline ? 'success.main' : 'text.secondary',
                                            fontWeight: isOnline ? 600 : 400,
                                            fontSize: '0.7rem',
                                        }}
                                    >
                                        {unit.owner_name}
                                    </Typography>
                                </Box>
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>
        </Box>
    );
}
