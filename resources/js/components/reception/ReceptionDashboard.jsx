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
                <Box sx={{ flex: 1, overflow: 'hidden', bgcolor: '#f0f4f9' }}>
                    {activeUnitId
                        ? <ReceptionChat unitId={activeUnitId} unit={activeUnit} />
                        : (
                            <Box sx={{
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                height: '100%', gap: 2,
                            }}>
                                <Box sx={{
                                    width: 72, height: 72, borderRadius: '20px',
                                    bgcolor: 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                }}>
                                    <ForumIcon sx={{ fontSize: 34, color: 'primary.main', opacity: 0.5 }} />
                                </Box>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                                        No conversation selected
                                    </Typography>
                                    <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.25 }}>
                                        Choose a unit from the sidebar to start messaging.
                                    </Typography>
                                </Box>
                            </Box>
                        )
                    }
                </Box>
            </Box>
        </Box>
    );
}
