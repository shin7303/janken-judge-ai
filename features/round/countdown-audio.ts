export type AudioContextConstructor = new () => AudioContext;

export function createCountdownAudio(volume: number) {
  if (volume <= 0 || typeof window === "undefined") return null;
  const AudioContextApi =
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: AudioContextConstructor })
      .webkitAudioContext;
  if (!AudioContextApi) return null;
  try {
    const context = new AudioContextApi();
    return {
      beep(pon = false) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.frequency.value = pon ? 880 : 520;
        gain.gain.setValueAtTime(
          0.12 * Math.min(1, volume),
          context.currentTime,
        );
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          context.currentTime + 0.12,
        );
        oscillator.connect(gain).connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.12);
      },
      close: () => context.close(),
    };
  } catch {
    return null;
  }
}
