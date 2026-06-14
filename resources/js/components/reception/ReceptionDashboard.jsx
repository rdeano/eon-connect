import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import ForumIcon from '@mui/icons-material/Forum';
import UnitList from './UnitList';
import ReceptionChat from './ReceptionChat';
import TopBar from '../common/TopBar';
import api from '../../services/api';
import useChatStore from '../../stores/useChatStore';
import usePresenceStore from '../../stores/usePresenceStore';
import echo from '../../echo';

export default function ReceptionDashboard() {
    const [units, setUnits] = useState([]);
    const { activeUnitId, setActiveUnit, addMessage, setUnreadCount } = useChatStore();
    const { setAll, setOnline, setOffline } = usePresenceStore();

    const activeUnit = units.find((u) => u.id === activeUnitId) || null;

    useEffect(() => {
        api.get('/conversations').then((res) => {
            setUnits(res.data.data);
            res.data.data.forEach((unit) => setUnreadCount(unit.id, unit.unread_count));
        });
    }, []);

    useEffect(() => {
        echo.join('presence.building')
            .here((users) => setAll(users))
            .joining((user) => setOnline(user))
            .leaving((user) => setOffline(user.id));
        return () => echo.leave('presence.building');
    }, []);

    useEffect(() => {
        if (!activeUnitId) return;
        echo.private(`conversation.${activeUnitId}`)
            .listen('MessageSent', (e) => addMessage(activeUnitId, e));
        return () => echo.leave(`conversation.${activeUnitId}`);
    }, [activeUnitId]);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <TopBar />

            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Sidebar */}
                <Box sx={{
                    width: 300,
                    flexShrink: 0,
                    borderRight: '1px solid',
                    borderColor: 'divider',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                    <UnitList
                        units={units}
                        activeUnitId={activeUnitId}
                        onSelectUnit={setActiveUnit}
                    />
                </Box>

                {/* Chat panel */}
                <Box sx={{ flex: 1, overflow: 'hidden' }}>
                    {activeUnitId
                        ? <ReceptionChat unitId={activeUnitId} unit={activeUnit} />
                        : (
                            <Box sx={{
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                height: '100%', gap: 1, color: 'text.disabled',
                            }}>
                                <ForumIcon sx={{ fontSize: 40, opacity: 0.25 }} />
                                <Typography variant="body2" color="text.disabled">
                                    Select a unit to view messages
                                </Typography>
                            </Box>
                        )
                    }
                </Box>
            </Box>
        </Box>
    );
}
