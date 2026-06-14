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

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'white' }}>
            {/* Header */}
            <Box sx={{ px: 2, pt: 2, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <TextField
                    size="small"
                    fullWidth
                    placeholder="Search…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" color="action" />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f7f8fa' } }}
                />
            </Box>

            {/* List */}
            <List disablePadding sx={{ flex: 1, overflowY: 'auto' }}>
                {filtered.length === 0 && (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.disabled">No results</Typography>
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
                                    bgcolor: isActive ? 'primary.50' : 'transparent',
                                    borderLeft: isActive ? '3px solid' : '3px solid transparent',
                                    borderColor: isActive ? 'primary.main' : 'transparent',
                                    '&:hover': { bgcolor: isActive ? 'primary.50' : '#f7f8fa' },
                                }}
                            >
                                <Badge
                                    overlap="circular"
                                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                    badgeContent={
                                        <Box sx={{
                                            width: 10, height: 10, borderRadius: '50%',
                                            bgcolor: isOnline ? '#44b700' : '#bdbdbd',
                                            border: '2px solid white',
                                        }} />
                                    }
                                >
                                    <Avatar sx={{
                                        width: 40, height: 40,
                                        bgcolor: isActive ? 'primary.main' : '#e8edf5',
                                        color: isActive ? 'white' : 'primary.main',
                                        fontWeight: 700, fontSize: 13,
                                    }}>
                                        {unitInitials(unit.unit_number)}
                                    </Avatar>
                                </Badge>

                                <Box sx={{ ml: 1.5, flex: 1, minWidth: 0 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="body2" fontWeight={isActive ? 700 : 600} noWrap>
                                            Unit {unit.unit_number}
                                        </Typography>
                                        {unread > 0 && (
                                            <Box sx={{
                                                minWidth: 20, height: 20, borderRadius: 10,
                                                bgcolor: 'primary.main', color: 'white',
                                                fontSize: 11, fontWeight: 700,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                px: 0.5,
                                            }}>
                                                {unread}
                                            </Box>
                                        )}
                                    </Box>
                                    <Typography variant="caption" color="text.secondary" noWrap>
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
