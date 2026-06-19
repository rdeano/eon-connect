import { useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import ForumIcon from '@mui/icons-material/Forum';
import UnitList          from './UnitList';
import ReceptionChat     from './ReceptionChat';
import IncomingCallDialog from './IncomingCallDialog';
import TopBar            from '../common/TopBar';
import api               from '../../services/api';
import useChatStore      from '../../stores/useChatStore';
import usePresenceStore  from '../../stores/usePresenceStore';
import useCallStore      from '../../stores/useCallStore';
import echo              from '../../echo';

export default function ReceptionDashboard() {
    const [units, setUnits] = useState([]);
    const { activeUnitId, setActiveUnit, addMessage, setUnreadCount, incrementUnread } = useChatStore();
    const { setAll, setOnline, setOffline } = usePresenceStore();

    const activeUnitIdRef = useRef(activeUnitId);
    useEffect(() => { activeUnitIdRef.current = activeUnitId; }, [activeUnitId]);

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
        if (!units.length) return;

        units.forEach((unit) => {
            echo.private(`conversation.${unit.id}`)
                .listen('MessageSent', (e) => {
                    const msg = e.message ?? e;
                    if (activeUnitIdRef.current === unit.id) {
                        addMessage(unit.id, msg);
                    } else {
                        incrementUnread(unit.id);
                    }
                })
                .listen('CallInvited', async (e) => {
                    // Unit owner is calling — get our token then show the incoming dialog
                    try {
                        const res = await api.post('/calls/token', { unit_id: e.unit_id });
                        const { token, livekit_url } = res.data;
                        useCallStore.getState().setRinging(
                            e.unit_id, e.caller_name, token, livekit_url,
                        );
                    } catch (err) {
                        console.error('[Call] failed to get token for incoming call:', err);
                    }
                })
                .listen('CallEnded', (e) => {
                    const state = useCallStore.getState();
                    if (state.unitId === e.unit_id) {
                        // Remote party hung up — disconnect our room (if connected) and reset
                        if (state.room) {
                            try { state.room.disconnect(); } catch {}
                        }
                        state.reset();
                    }
                });
        });

        return () => units.forEach((unit) => echo.leave(`conversation.${unit.id}`));
    }, [units]);

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

            {/* Global incoming call dialog — appears over any screen state */}
            <IncomingCallDialog />
        </Box>
    );
}
