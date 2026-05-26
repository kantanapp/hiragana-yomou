"use client";
import { useEffect, useRef, useCallback } from "react";

// ブラウザの音声合成（Web Speech API）で日本語を読み上げるフック。
// iPad / Safari は voices の読み込みが遅れるため onvoiceschanged で取り直す。
export function useSpeech(rate = 0.85) {
  const voicesRef = useRef([]);
  const rateRef = useRef(rate);
  rateRef.current = rate;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    const load = () => { voicesRef.current = synth.getVoices(); };
    load();
    synth.onvoiceschanged = load;
    return () => { synth.onvoiceschanged = null; };
  }, []);

  const speak = useCallback((text, r) => {
    if (!text || typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ja-JP";
    u.rate = r ?? rateRef.current;
    u.pitch = 1.05;
    const v = voicesRef.current.find(
      (x) => /ja(-|_)?JP/i.test(x.lang) || x.lang.startsWith("ja")
    );
    if (v) u.voice = v;
    synth.speak(u);
  }, []);

  // 「ピンポン♪」のやさしい2音チャイム
  const playChime = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      const now = ctx.currentTime;
      [[783.99, 0], [1046.5, 0.16]].forEach(([f, t]) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.value = f;
        o.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0.0001, now + t);
        g.gain.exponentialRampToValueAtTime(0.32, now + t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.45);
        o.start(now + t); o.stop(now + t + 0.5);
      });
    } catch (e) { /* 音が出せない環境では無視 */ }
  }, []);

  return { speak, playChime };
}
