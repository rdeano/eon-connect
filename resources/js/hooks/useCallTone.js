import { useEffect } from 'react';

function tone(ctx, freq, start, end, volume = 0.09) {
    const node = ctx.createOscillator();
    const gain = ctx.createGain();
    node.frequency.value = freq;
    // Short fade in/out to avoid clicks
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.03);
    gain.gain.setValueAtTime(volume, end - 0.03);
    gain.gain.linearRampToValueAtTime(0, end);
    node.connect(gain);
    gain.connect(ctx.destination);
    node.start(start);
    node.stop(end);
}

/**
 * Caller-side ringback: 440 + 480 Hz, 1 s on / 3 s off.
 * Pre-schedules 2 minutes of audio so the Web Audio clock drives it,
 * not unreliable JS timers.
 */
export function useRingbackTone(active) {
    useEffect(() => {
        if (!active) return;
        const ctx = new AudioContext();
        const t0  = ctx.currentTime + 0.1;
        for (let i = 0; i < 30; i++) {          // 30 × 4 s = 2 min
            const t = t0 + i * 4;
            tone(ctx, 440, t, t + 1.0);
            tone(ctx, 480, t, t + 1.0);
        }
        return () => ctx.close();
    }, [active]);
}

/**
 * Callee-side ringtone: 480 Hz double-ring (0.4 s + 0.4 s) / 2.4 s silence.
 * Pre-schedules 2 minutes of audio.
 */
export function useRingtone(active) {
    useEffect(() => {
        if (!active) return;
        const ctx = new AudioContext();
        const t0  = ctx.currentTime + 0.1;
        for (let i = 0; i < 37; i++) {          // 37 × 3.2 s ≈ 2 min
            const t = t0 + i * 3.2;
            tone(ctx, 480, t,       t + 0.4);   // first ring
            tone(ctx, 480, t + 0.6, t + 1.0);   // second ring
        }
        return () => ctx.close();
    }, [active]);
}
