import { useEffect, useRef, useState, useCallback } from 'react';
import {
    Box, Typography, Button, Paper, Chip, LinearProgress,
    Divider, Alert,
} from '@mui/material';
import MicIcon         from '@mui/icons-material/Mic';
import MicOffIcon      from '@mui/icons-material/MicOff';
import VolumeUpIcon    from '@mui/icons-material/VolumeUp';
import VolumeOffIcon   from '@mui/icons-material/VolumeOff';
import CheckCircleIcon          from '@mui/icons-material/CheckCircle';
import ErrorIcon                from '@mui/icons-material/Error';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import RefreshIcon              from '@mui/icons-material/Refresh';
import TopBar from '../common/TopBar';

// ── helpers ──────────────────────────────────────────────────────────────────

function StatusChip({ state }) {
    if (state === 'ok')      return <Chip icon={<CheckCircleIcon />} label="Working"     color="success" size="small" />;
    if (state === 'error')   return <Chip icon={<ErrorIcon />}       label="Not working" color="error"   size="small" />;
    if (state === 'denied')  return <Chip icon={<ErrorIcon />}       label="Permission denied" color="error" size="small" />;
    return                          <Chip icon={<RadioButtonUncheckedIcon />}  label="Not tested"  color="default" size="small" />;
}

// Plays a short 440 Hz beep through the Web Audio API.
// Returns a promise that resolves when the beep finishes.
async function playBeep(durationMs = 800) {
    const ctx  = new AudioContext();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type      = 'sine';
    osc.frequency.value = 440;

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.02);
    gain.gain.setValueAtTime(0.4, ctx.currentTime + durationMs / 1000 - 0.05);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + durationMs / 1000);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);

    return new Promise((resolve) => {
        osc.onended = async () => {
            await ctx.close();
            resolve();
        };
    });
}

// ── main component ────────────────────────────────────────────────────────────

export default function MediaTestPage() {
    // mic
    const [micStatus,   setMicStatus]   = useState('idle'); // idle | requesting | ok | denied | error
    const [micVolume,   setMicVolume]   = useState(0);       // 0-100
    const streamRef    = useRef(null);
    const animFrameRef = useRef(null);
    const analyserRef  = useRef(null);

    // audio output
    const [audioStatus,  setAudioStatus]  = useState('idle'); // idle | playing | ok | error
    const [audioTesting, setAudioTesting] = useState(false);

    // ── mic ──────────────────────────────────────────────────────────────────

    const stopMic = useCallback(() => {
        cancelAnimationFrame(animFrameRef.current);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        analyserRef.current = null;
        setMicVolume(0);
    }, []);

    const startMic = useCallback(async () => {
        stopMic();
        setMicStatus('requesting');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            streamRef.current = stream;

            const ctx      = new AudioContext();
            const source   = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyserRef.current = analyser;

            const data = new Uint8Array(analyser.frequencyBinCount);

            const tick = () => {
                analyser.getByteTimeDomainData(data);
                // RMS level
                let sum = 0;
                for (let i = 0; i < data.length; i++) {
                    const v = (data[i] - 128) / 128;
                    sum += v * v;
                }
                const rms = Math.sqrt(sum / data.length);
                setMicVolume(Math.min(100, Math.round(rms * 400)));
                animFrameRef.current = requestAnimationFrame(tick);
            };
            tick();
            setMicStatus('ok');
        } catch (err) {
            setMicStatus(err.name === 'NotAllowedError' ? 'denied' : 'error');
        }
    }, [stopMic]);

    // Stop mic on unmount
    useEffect(() => () => {
        cancelAnimationFrame(animFrameRef.current);
        streamRef.current?.getTracks().forEach((t) => t.stop());
    }, []);

    // ── audio output ─────────────────────────────────────────────────────────

    const testAudio = useCallback(async () => {
        setAudioTesting(true);
        setAudioStatus('playing');
        try {
            await playBeep(800);
            setAudioStatus('ok');
        } catch {
            setAudioStatus('error');
        } finally {
            setAudioTesting(false);
        }
    }, []);

    // ── render ────────────────────────────────────────────────────────────────

    const micActive = micStatus === 'ok';

    // colour for the volume bar
    const barColor = micVolume > 70 ? 'error' : micVolume > 30 ? 'success' : 'primary';

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <TopBar />

            <Box sx={{
                flex: 1, overflow: 'auto',
                display: 'flex', justifyContent: 'center',
                bgcolor: '#f0f4f9', p: { xs: 2, sm: 4 },
            }}>
                <Box sx={{ width: '100%', maxWidth: 560 }}>

                    <Typography variant="h5" fontWeight={700} mb={0.5}>
                        Audio &amp; Microphone Check
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={3}>
                        Use this page to verify your browser can capture your mic and play call audio before taking a call.
                    </Typography>

                    {/* ── Microphone card ───────────────────────────────── */}
                    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: 3, mb: 2.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                            <Box sx={{
                                width: 40, height: 40, borderRadius: '12px',
                                bgcolor: micActive ? 'success.light' : 'grey.100',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'background-color 0.3s',
                            }}>
                                {micActive
                                    ? <MicIcon sx={{ color: 'success.dark', fontSize: 22 }} />
                                    : <MicOffIcon sx={{ color: 'text.disabled', fontSize: 22 }} />
                                }
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography fontWeight={700} lineHeight={1.3}>Microphone</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Speak to see the level meter move
                                </Typography>
                            </Box>
                            <StatusChip state={
                                micStatus === 'ok'         ? 'ok'
                                : micStatus === 'denied'   ? 'denied'
                                : micStatus === 'error'    ? 'error'
                                : 'idle'
                            } />
                        </Box>

                        {/* Volume meter */}
                        <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">Input level</Typography>
                                <Typography variant="caption" color="text.secondary">{micVolume}%</Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={micVolume}
                                color={barColor}
                                sx={{
                                    height: 10, borderRadius: 5,
                                    bgcolor: 'grey.100',
                                    '& .MuiLinearProgress-bar': { transition: 'transform 0.05s linear' },
                                }}
                            />
                        </Box>

                        {micStatus === 'denied' && (
                            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                                Microphone permission was denied. Click the camera icon in your browser's address bar and allow microphone access, then try again.
                            </Alert>
                        )}
                        {micStatus === 'error' && (
                            <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                                Could not access your microphone. Make sure no other app is using it and try again.
                            </Alert>
                        )}

                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant={micActive ? 'outlined' : 'contained'}
                                size="small"
                                startIcon={micActive ? <RefreshIcon /> : <MicIcon />}
                                onClick={startMic}
                                disabled={micStatus === 'requesting'}
                            >
                                {micStatus === 'requesting' ? 'Requesting…'
                                    : micActive ? 'Restart mic'
                                    : 'Test microphone'}
                            </Button>
                            {micActive && (
                                <Button
                                    variant="outlined"
                                    size="small"
                                    color="error"
                                    startIcon={<MicOffIcon />}
                                    onClick={() => { stopMic(); setMicStatus('idle'); }}
                                >
                                    Stop
                                </Button>
                            )}
                        </Box>
                    </Paper>

                    {/* ── Audio output card ─────────────────────────────── */}
                    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: 3, mb: 2.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                            <Box sx={{
                                width: 40, height: 40, borderRadius: '12px',
                                bgcolor: audioStatus === 'ok' ? 'success.light' : 'grey.100',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'background-color 0.3s',
                            }}>
                                {audioStatus === 'ok'
                                    ? <VolumeUpIcon sx={{ color: 'success.dark', fontSize: 22 }} />
                                    : <VolumeOffIcon sx={{ color: 'text.disabled', fontSize: 22 }} />
                                }
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography fontWeight={700} lineHeight={1.3}>Audio Output</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    You should hear a short beep when you click Test
                                </Typography>
                            </Box>
                            <StatusChip state={
                                audioStatus === 'ok'    ? 'ok'
                                : audioStatus === 'error' ? 'error'
                                : 'idle'
                            } />
                        </Box>

                        {audioStatus === 'error' && (
                            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                                Could not play audio. Check that your speakers or headset are connected and the system volume is not muted.
                            </Alert>
                        )}

                        {audioStatus === 'playing' && (
                            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                                Playing beep — did you hear it?
                            </Alert>
                        )}

                        <Button
                            variant={audioStatus === 'ok' ? 'outlined' : 'contained'}
                            size="small"
                            startIcon={audioTesting ? <RefreshIcon /> : <VolumeUpIcon />}
                            onClick={testAudio}
                            disabled={audioTesting}
                        >
                            {audioTesting ? 'Playing…' : audioStatus === 'ok' ? 'Play again' : 'Test audio output'}
                        </Button>
                    </Paper>

                    <Divider sx={{ my: 2.5 }} />

                    {/* ── Summary ───────────────────────────────────────── */}
                    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: 3 }}>
                        <Typography fontWeight={700} mb={1.5}>Summary</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <SummaryRow label="Microphone access" state={
                                micStatus === 'ok' ? 'ok' : micStatus === 'denied' ? 'denied' : micStatus === 'error' ? 'error' : 'idle'
                            } />
                            <SummaryRow label="Mic capturing sound" state={
                                micStatus === 'ok' && micVolume > 0 ? 'ok'
                                : micStatus === 'ok' ? 'idle'
                                : micStatus === 'denied' ? 'denied'
                                : micStatus === 'error' ? 'error'
                                : 'idle'
                            } hint={micStatus === 'ok' && micVolume === 0 ? 'Speak into your mic' : undefined} />
                            <SummaryRow label="Audio output" state={
                                audioStatus === 'ok' ? 'ok' : audioStatus === 'error' ? 'error' : 'idle'
                            } />
                        </Box>

                        {micStatus === 'ok' && audioStatus === 'ok' && (
                            <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>
                                Everything looks good — your mic and audio are ready for calls.
                            </Alert>
                        )}
                    </Paper>

                </Box>
            </Box>
        </Box>
    );
}

function SummaryRow({ label, state, hint }) {
    const icon = state === 'ok'
        ? <CheckCircleIcon sx={{ color: 'success.main', fontSize: 18 }} />
        : state === 'error' || state === 'denied'
            ? <ErrorIcon sx={{ color: 'error.main', fontSize: 18 }} />
            : <RadioButtonUncheckedIcon sx={{ color: 'text.disabled', fontSize: 18 }} />;

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {icon}
            <Typography variant="body2" sx={{ flex: 1 }}>{label}</Typography>
            {hint && <Typography variant="caption" color="text.secondary">{hint}</Typography>}
        </Box>
    );
}
