import { useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme }         from '@mui/material/styles';
import useMediaQuery        from '@mui/material/useMediaQuery';
import ForumIcon            from '@mui/icons-material/Forum';
import UnitList             from './UnitList';
import ReceptionChat        from './ReceptionChat';
import IncomingCallDialog   from './IncomingCallDialog';
import OutgoingCallDialog   from './OutgoingCallDialog';
import TopBar               from '../common/TopBar';
import api                  from '../../services/api';
import useChatStore         from '../../stores/useChatStore';
import usePresenceStore     from '../../stores/usePresenceStore';
import useCallStore         from '../../stores/useCallStore';
import echo                 from '../../echo';

export default function ReceptionDashboard() {
    const [units, setUnits] = useState([]);
    const [mobileShowChat, setMobileShowChat] = useState(false);

    const { activeUnitId, setActiveUnit, addMessage, setUnreadCount, incrementUnread } = useChatStore();
    const { setAll, setOnline, setOffline } = usePresenceStore();

    const theme    = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
                    // Only ring for calls initiated by unit owners, not other receptionists.
                    if (e.caller_role === 'reception') return;
                    if (useCallStore.getState().status !== 'idle') return;
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
                .listen('CallAnswered', (e) => {
                    // Skip only the exact tab that answered (matched by socket ID).
                    // Same user on another tab has a different socket ID and must still close.
                    if (e.socket_id && e.socket_id === window.Echo?.socketId()) return;
                    const state = useCallStore.getState();
                    if (state.status === 'ringing' && state.unitId === e.unit_id) {
                        state.reset();
                    }
                })
                .listen('CallEnded', (e) => {
                    const state = useCallStore.getState();
                    if (state.unitId === e.unit_id) {
                        if (state.room) {
                            try { state.room.disconnect(); } catch {}
                        }
                        state.reset();
                    }
                });
        });

        return () => units.forEach((unit) => echo.leave(`conversation.${unit.id}`));
    }, [units]);

    const handleSelectUnit = (unitId) => {
        setActiveUnit(unitId);
        if (isMobile) setMobileShowChat(true);
    };

    // Sidebar: full-width on mobile; hidden when chat is open on mobile
    const sidebarSx = {
        width:       { xs: '100%', sm: 300 },
        flexShrink:  0,
        borderRight: '1px solid',
        borderColor: 'divider',
        overflow:    'hidden',
        display:     isMobile ? (mobileShowChat ? 'none' : 'flex') : 'flex',
        flexDirection: 'column',
    };

    // Chat panel: full-width on mobile; hidden when list is shown on mobile
    const chatPanelSx = {
        flex:          1,
        overflow:      'hidden',
        bgcolor:       '#f0f4f9',
        display:       isMobile ? (mobileShowChat ? 'flex' : 'none') : 'flex',
        flexDirection: 'column',
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <TopBar />

            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Sidebar / unit list */}
                <Box sx={sidebarSx}>
                    <UnitList
                        units={units}
                        activeUnitId={activeUnitId}
                        onSelectUnit={handleSelectUnit}
                    />
                </Box>

                {/* Chat panel */}
                <Box sx={chatPanelSx}>
                    {activeUnitId
                        ? (
                            <ReceptionChat
                                unitId={activeUnitId}
                                unit={activeUnit}
                                onBack={isMobile ? () => setMobileShowChat(false) : undefined}
                            />
                        ) : (
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
                                        Choose a unit from the list to start messaging.
                                    </Typography>
                                </Box>
                            </Box>
                        )
                    }
                </Box>
            </Box>

            <IncomingCallDialog />
            <OutgoingCallDialog />
        </Box>
    );
}
