import { useEffect } from 'react';

function scheduleBurst(ctx, start, freqs, duration, volume = 0.08) {
    freqs.forEach((freq) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(volume, start);
        gain.gain.linearRampToValueAtTime(0, start + duration - 0.02);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
    });
}

/**
 * Caller-side ringback tone: 440 + 480 Hz, 1 s on / 3 s off.
 * Classic US telephone ringback so the caller knows the other end is ringing.
 */
export function useRingbackTone(active) {
    useEffect(() => {
        if (!active) return;
        const ctx = new AudioContext();
        let stopped = false;
        const tick = () => {
            if (stopped) return;
            scheduleBurst(ctx, ctx.currentTime, [440, 480], 1.0);
            setTimeout(tick, 4000); // 1 s tone + 3 s silence
        };
        tick();
        return () => {
            stopped = true;
            ctx.close();
        };
    }, [active]);
}

/**
 * Callee-side ringtone: 480 Hz double-ring (0.4 s + 0.4 s) then 2.4 s silence.
 */
export function useRingtone(active) {
    useEffect(() => {
        if (!active) return;
        const ctx = new AudioContext();
        let stopped = false;
        const tick = () => {
            if (stopped) return;
            const t = ctx.currentTime;
            scheduleBurst(ctx, t,       [480], 0.4);
            scheduleBurst(ctx, t + 0.6, [480], 0.4);
            setTimeout(tick, 3200); // 1 s pattern + 2.2 s silence
        };
        tick();
        return () => {
            stopped = true;
            ctx.close();
        };
    }, [active]);
}
