"use client";
import React, { useState, useEffect } from "react";
import {
  GYOU, SYMBOLS, DEFAULT_ODAI, applyMarkToText, applyKogakiToText, compareToTarget,
} from "@/lib/kana";
import { useSpeech } from "@/lib/useSpeech";
import { Mascot, Hanamaru } from "@/components/Graphics";

const C = {
  bg: "#FFF6E9", bgDeep: "#FDEBCF", ink: "#4A3B2F", inkSoft: "#8A7A68",
  key: "#FFFFFF", keyShadow: "#E9D8BE", teal: "#36B6A0", tealDeep: "#1F9685",
  almost: "#FFE89A", almostRing: "#F2B705", pink: "#FF8FA3", red: "#E8513C",
};

const LS_ODAI = "hiragana.odai.v1";
const LS_RATE = "hiragana.rate.v1";

export default function HiraganaApp() {
  const [mode, setMode] = useState("odai"); // 'odai' | 'jiyuu'
  const [typed, setTyped] = useState("");
  const [odaiList, setOdaiList] = useState(DEFAULT_ODAI);
  const [odaiIdx, setOdaiIdx] = useState(0);
  const [status, setStatus] = useState(null); // null | 'correct' | 'almost'
  const [mismatches, setMismatches] = useState([]);
  const [choice, setChoice] = useState(null); // { index, wrong, correct }
  const [celebrate, setCelebrate] = useState(false);
  const [rate, setRate] = useState(0.85);
  const [showParent, setShowParent] = useState(false);
  const [showSymbols, setShowSymbols] = useState(false);
  const [customWord, setCustomWord] = useState("");

  const { speak, playChime } = useSpeech(rate);
  const target = odaiList[odaiIdx] || "";

  // 保存されたお題・声の速さを読み込む（次回も残るように）
  useEffect(() => {
    try {
      const savedOdai = JSON.parse(localStorage.getItem(LS_ODAI) || "null");
      if (Array.isArray(savedOdai) && savedOdai.length) setOdaiList(savedOdai);
      const savedRate = parseFloat(localStorage.getItem(LS_RATE) || "");
      if (!Number.isNaN(savedRate)) setRate(savedRate);
    } catch (e) { /* 初回などは無視 */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(LS_ODAI, JSON.stringify(odaiList)); } catch (e) {}
  }, [odaiList]);
  useEffect(() => {
    try { localStorage.setItem(LS_RATE, String(rate)); } catch (e) {}
  }, [rate]);

  const resetFeedback = () => {
    setStatus(null); setMismatches([]); setChoice(null); setCelebrate(false);
  };

  const pushChar = (ch) => { if (!ch) return; resetFeedback(); setTyped((t) => t + ch); };

  // 直前の1文字に濁点/半濁点（付けられない文字はそのまま）
  const applyMark = (kind) => {
    setTyped((t) => {
      const next = applyMarkToText(t, kind);
      if (next !== t) resetFeedback();
      return next;
    });
  };

  const applyKogaki = () => {
    setTyped((t) => {
      const next = applyKogakiToText(t);
      if (next !== t) resetFeedback();
      return next;
    });
  };

  const backspace = () => { resetFeedback(); setTyped((t) => t.slice(0, -1)); };
  const clearAll = () => { resetFeedback(); setTyped(""); };

  const evaluate = (value) => {
    const res = compareToTarget(value, target);
    if (res.correct) {
      setStatus("correct"); setMismatches([]); setChoice(null); setCelebrate(true);
      playChime(); speak(value);
      window.setTimeout(() => speak("せいかい！", 1.0), 700);
      return;
    }
    if (res.sameLength) {
      setStatus("almost"); setMismatches(res.wrong);
      const first = res.wrong[0];
      setChoice(res.wrong.length ? { index: first, wrong: value[first], correct: target[first] } : null);
      speak(value); // まずは正直に読む
    } else {
      setStatus("almost"); setMismatches([]); setChoice(null);
      speak(value);
    }
  };

  const handleRead = () => {
    if (!typed) return;
    if (mode === "jiyuu") { speak(typed); setStatus(null); return; }
    evaluate(typed);
  };

  const pickCorrect = () => {
    if (!choice) return;
    const arr = typed.split("");
    arr[choice.index] = choice.correct;
    const next = arr.join("");
    setTyped(next);
    window.setTimeout(() => evaluate(next), 50);
  };
  const pickKeep = () => { speak(typed); setChoice(null); };

  const nextOdai = () => { resetFeedback(); setTyped(""); setOdaiIdx((i) => (i + 1) % odaiList.length); };

  const applyCustom = () => {
    const w = customWord.trim();
    if (!w) return;
    setOdaiList((list) => [w, ...list]);
    setOdaiIdx(0); setCustomWord(""); resetFeedback(); setTyped("");
  };
  const removeOdai = (i) => {
    setOdaiList((list) => list.filter((_, idx) => idx !== i));
    setOdaiIdx((cur) => (i < cur ? cur - 1 : i === cur ? 0 : cur));
    resetFeedback(); setTyped("");
  };

  return (
    <div style={S.root}>
      <style>{CSS}</style>

      {/* ヘッダー：モード切り替え */}
      <div style={S.header}>
        <div style={S.logo}>
          <Mascot happy={status === "correct"} />
          <span style={S.logoText}>ひらがな よもう</span>
        </div>
        <div style={S.tabs}>
          <button style={{ ...S.tab, ...(mode === "odai" ? S.tabOn : {}) }}
            onClick={() => { setMode("odai"); resetFeedback(); setTyped(""); }}>おだい</button>
          <button style={{ ...S.tab, ...(mode === "jiyuu" ? S.tabOn : {}) }}
            onClick={() => { setMode("jiyuu"); resetFeedback(); setTyped(""); }}>じゆう</button>
        </div>
      </div>

      {/* お題バー */}
      {mode === "odai" && (
        <div style={S.odaiBar}>
          <span style={S.odaiLabel}>かいてみよう</span>
          <span style={S.odaiWord}>{target}</span>
          <button style={S.odaiSpeak} onClick={() => speak(target)} aria-label="おだいをきく">🔊</button>
          <button style={S.nextBtn} onClick={nextOdai}>つぎ ▶</button>
        </div>
      )}

      {/* 表示エリア */}
      <div style={S.stage}>
        <div style={S.display}>
          {typed.length === 0 && (
            <span style={S.placeholder}>{mode === "odai" ? "ここに かいてね" : "すきな ことばを かいてね"}</span>
          )}
          {typed.split("").map((ch, i) => {
            const isWrong = mismatches.includes(i);
            const isAsk = choice && choice.index === i;
            const cls = isAsk ? "askPulse" : isWrong ? "wrongFlash" : "";
            return (
              <span key={i} className={cls}
                style={{ ...S.charTile, ...(isWrong ? S.charWrong : {}), ...(status === "correct" ? S.charOk : {}) }}>{ch}</span>
            );
          })}
          {celebrate && (
            <div style={S.hanamaru} className="hanamaruPop" aria-hidden>
              <Hanamaru size={96} />
            </div>
          )}
        </div>

        <div style={S.feedback}>
          {status === "correct" && <span style={{ ...S.fbText, color: C.tealDeep }} className="bounceIn">はなまる！ せいかい！🎉</span>}
          {status === "almost" && !choice && <span style={{ ...S.fbText, color: C.almostRing }}>おしい！ もういちど きいてみよう</span>}
        </div>

        {choice && (
          <div style={S.askPanel} className="bounceIn">
            <div style={S.askTitle}>ここ、<b style={{ color: C.red }}>「{choice.wrong}」</b>で あってるかな？</div>
            <div style={S.askBtns}>
              <button style={{ ...S.askBtn, ...S.askBtnGood }} onClick={pickCorrect}>「{choice.correct}」に する</button>
              <button style={{ ...S.askBtn, ...S.askBtnKeep }} onClick={pickKeep}>このまま「{choice.wrong}」</button>
            </div>
          </div>
        )}
      </div>

      {/* 五十音グリッド */}
      <div style={S.keyboard}>
        {GYOU.map((row, r) => (
          <div key={r} style={S.kbRow}>
            {row.map((ch, c) => {
              if (!ch) return <span key={c} style={S.keyGap} />;
              if (ch === "゛") return <button key={c} style={{ ...S.key, ...S.keyFn }} className="key" onClick={() => applyMark("dakuten")} aria-label="てんてん"><span style={S.fnMark}>゛</span></button>;
              if (ch === "゜") return <button key={c} style={{ ...S.key, ...S.keyFn }} className="key" onClick={() => applyMark("handakuten")} aria-label="まる"><span style={S.fnMark}>゜</span></button>;
              if (ch === "ー") return <button key={c} style={{ ...S.key, ...S.keyFn }} className="key" onClick={() => pushChar("ー")} aria-label="のばすぼう">ー</button>;
              if (ch === "小") return <button key={c} style={{ ...S.key, ...S.keyFn }} className="key" onClick={applyKogaki} aria-label="ちいさく">小</button>;
              if (ch === "きごう") return (
                <button key={c} style={{ ...S.key, ...S.keyKigou }} className="key" onClick={() => setShowSymbols((v) => !v)} aria-label="きごう">
                  きごう{showSymbols ? "▲" : "▼"}
                </button>
              );
              return <button key={c} style={S.key} className="key" onClick={() => pushChar(ch)}>{ch}</button>;
            })}
          </div>
        ))}
      </div>

      {/* きごうパネル（折りたたみ） */}
      {showSymbols && (
        <div style={S.symbolRow}>
          {SYMBOLS.map((s) => (
            <button key={s} style={S.symbolKey} className="key" onClick={() => pushChar(s)}>{s}</button>
          ))}
        </div>
      )}

      {/* 操作ボタン（キーボードの下） */}
      <div style={{ ...S.controls, marginTop: 12, marginBottom: 0 }}>
        <button style={{ ...S.ctrl, ...S.ctrlSub }} onClick={backspace}>← けす</button>
        <button style={{ ...S.ctrl, ...S.ctrlSub }} onClick={clearAll}>ぜんぶ けす</button>
        <button style={{ ...S.ctrl, ...S.ctrlRead }} onClick={handleRead}>🔊 よむ</button>
      </div>

      {/* おうちの人へ（設定） */}
      <div style={S.parentWrap}>
        <button style={S.parentToggle} onClick={() => setShowParent((v) => !v)}>
          ⚙ おうちの人へ {showParent ? "▲" : "▼"}
        </button>
        {showParent && (
          <div style={S.parentBox}>
            <div style={S.parentRow}>
              <label style={S.parentLabel}>おだいを ついか</label>
              <input style={S.parentInput} value={customWord}
                onChange={(e) => setCustomWord(e.target.value)}
                placeholder="ひらがなで（例：なまえ・すきなもの）"
                onKeyDown={(e) => { if (e.key === "Enter") applyCustom(); }} />
              <button style={S.parentAdd} onClick={applyCustom}>ついか</button>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ ...S.parentLabel, display: "block", marginBottom: 8 }}>
                おだいの いちらん（タップで そのおだいに／×でけす）
              </label>
              <div style={S.chipWrap}>
                {odaiList.map((w, i) => (
                  <span key={w + i} style={{ ...S.chip, ...(i === odaiIdx ? S.chipOn : {}) }}>
                    <button style={S.chipText} onClick={() => { setOdaiIdx(i); resetFeedback(); setTyped(""); }}>{w}</button>
                    <button style={S.chipX} onClick={() => removeOdai(i)} aria-label={w + "をけす"}>×</button>
                  </span>
                ))}
                {odaiList.length === 0 && <span style={S.parentNote}>おだいが ありません。うえで ついかしてね。</span>}
              </div>
            </div>

            <div style={S.parentRow}>
              <label style={S.parentLabel}>こえの はやさ</label>
              <input type="range" min="0.5" max="1.2" step="0.05" value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))} style={{ flex: 1 }} />
              <span style={S.parentVal}>{rate.toFixed(2)}</span>
            </div>
            <p style={S.parentNote}>※ 読み上げは端末の日本語音声を使います（iPad は Safari 推奨）。お名前・好きなキャラ・好きな食べものを追加すると、お子さんがぐっと取り組みやすくなります。設定はこの端末に保存され、次回も残ります。</p>
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  root: {
    minHeight: "100vh", background: `linear-gradient(180deg, ${C.bg} 0%, ${C.bgDeep} 100%)`,
    fontFamily: "'Zen Maru Gothic','M PLUS Rounded 1c',system-ui,sans-serif",
    color: C.ink, padding: "12px 4px 20px",
    WebkitTapHighlightColor: "transparent", userSelect: "none",
  },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  logo: { display: "flex", alignItems: "center", gap: 10 },
  logoText: { fontSize: 22, fontWeight: 700 },
  tabs: { display: "flex", gap: 8, background: "#F1E2C8", padding: 5, borderRadius: 18 },
  tab: { border: "none", background: "transparent", fontFamily: "inherit", fontSize: 18, fontWeight: 700, color: C.inkSoft, padding: "8px 18px", borderRadius: 14, cursor: "pointer" },
  tabOn: { background: "#fff", color: C.tealDeep, boxShadow: "0 2px 6px rgba(0,0,0,.08)" },

  odaiBar: { display: "flex", alignItems: "center", gap: 12, background: "#fff", borderRadius: 20, padding: "10px 16px", boxShadow: "0 3px 10px rgba(180,140,80,.15)", marginBottom: 14 },
  odaiLabel: { fontSize: 15, color: C.inkSoft, fontWeight: 700 },
  odaiWord: { fontSize: 34, fontWeight: 700, letterSpacing: 4, color: C.tealDeep },
  odaiSpeak: { marginLeft: "auto", border: "none", background: "#EAF7F4", fontSize: 22, width: 48, height: 48, borderRadius: 14, cursor: "pointer" },
  nextBtn: { border: "none", background: C.teal, color: "#fff", fontFamily: "inherit", fontWeight: 700, fontSize: 16, padding: "10px 16px", borderRadius: 14, cursor: "pointer" },

  stage: { position: "relative", marginBottom: 14 },
  display: {
    position: "relative", minHeight: 130, background: "#fff", borderRadius: 26,
    boxShadow: "inset 0 2px 8px rgba(180,140,80,.12), 0 4px 14px rgba(180,140,80,.12)",
    display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center",
    gap: 10, padding: "18px 16px",
  },
  placeholder: { fontSize: 26, color: "#D9C7A8", fontWeight: 700 },
  charTile: { fontSize: 64, fontWeight: 700, lineHeight: 1, padding: "6px 10px", borderRadius: 16, minWidth: 56, textAlign: "center", color: C.ink, transition: "all .18s ease" },
  charWrong: { background: C.almost, boxShadow: `0 0 0 4px ${C.almostRing}`, color: C.red, fontWeight: 900 },
  charOk: { color: C.tealDeep },

  hanamaru: { position: "absolute", top: -18, right: -6, pointerEvents: "none", zIndex: 3, filter: "drop-shadow(0 3px 6px rgba(232,81,60,.25))" },

  feedback: { textAlign: "center", minHeight: 30, marginTop: 10 },
  fbText: { fontSize: 24, fontWeight: 700 },

  askPanel: { background: "#fff", borderRadius: 22, padding: "16px 18px", marginTop: 10, boxShadow: "0 4px 14px rgba(180,140,80,.18)", border: `3px solid ${C.almost}` },
  askTitle: { fontSize: 22, fontWeight: 700, textAlign: "center", marginBottom: 14 },
  askBtns: { display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" },
  askBtn: { border: "none", fontFamily: "inherit", fontWeight: 700, fontSize: 22, padding: "16px 22px", borderRadius: 18, cursor: "pointer" },
  askBtnGood: { background: C.teal, color: "#fff", boxShadow: "0 4px 0 " + C.tealDeep },
  askBtnKeep: { background: "#F1E2C8", color: C.inkSoft },

  controls: { display: "flex", gap: 10, marginBottom: 16 },
  ctrl: { flex: 1, border: "none", fontFamily: "inherit", fontWeight: 700, borderRadius: 18, cursor: "pointer", padding: "14px 0" },
  ctrlSub: { background: "#F1E2C8", color: C.ink, fontSize: 18 },
  ctrlRead: { flex: 1.6, background: C.teal, color: "#fff", fontSize: 26, boxShadow: "0 5px 0 " + C.tealDeep },

  keyboard: { display: "flex", flexDirection: "column", gap: 4 },
  kbRow: { display: "grid", gridTemplateColumns: "repeat(11, 1fr)", gap: 4 },
  key: { width: "100%", minWidth: 0, height: "clamp(36px, 8vh, 80px)", border: "none", background: C.key, borderRadius: 8, fontFamily: "inherit", fontSize: "clamp(14px, min(5vh, 5.5vw), 44px)", fontWeight: 700, color: C.ink, cursor: "pointer", boxShadow: `0 3px 0 ${C.keyShadow}`, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, overflow: "hidden" },
  keyFn: { background: "#FCEFD6", color: C.ink, fontSize: "clamp(12px, min(4.5vh, 5vw), 38px)", fontWeight: 700, position: "relative" },
  fnMark: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -20%)", lineHeight: 1, pointerEvents: "none" },
  keyKigou: { background: "#F3E7CF", color: C.inkSoft, fontSize: "clamp(8px, min(2vh, 2.5vw), 16px)", fontWeight: 700, height: "clamp(36px, 8vh, 80px)", display: "flex", alignItems: "center", justifyContent: "center" },
  keyGap: {},

  symbolRow: { display: "flex", gap: 5, justifyContent: "flex-start", marginTop: 5 },
  symbolKey: { width: 60, height: 52, border: "none", background: "#F3E7CF", color: C.inkSoft, borderRadius: 14, fontFamily: "inherit", fontSize: 22, fontWeight: 700, cursor: "pointer", boxShadow: `0 3px 0 ${C.keyShadow}` },

  parentWrap: { marginTop: 22 },
  parentToggle: { width: "100%", border: "none", background: "transparent", color: C.inkSoft, fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer", padding: 8 },
  parentBox: { background: "#fff", borderRadius: 18, padding: 16, boxShadow: "0 3px 10px rgba(180,140,80,.12)" },
  parentRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 },
  parentLabel: { fontSize: 15, fontWeight: 700, color: C.inkSoft, minWidth: 110 },
  parentInput: { flex: 1, border: "2px solid #EADFC8", borderRadius: 12, padding: "10px 12px", fontFamily: "inherit", fontSize: 18 },
  parentAdd: { border: "none", background: C.teal, color: "#fff", fontFamily: "inherit", fontWeight: 700, padding: "10px 16px", borderRadius: 12, cursor: "pointer" },
  parentVal: { minWidth: 42, textAlign: "right", fontWeight: 700, color: C.inkSoft },
  parentNote: { fontSize: 13, color: C.inkSoft, margin: 0, lineHeight: 1.6 },
  chipWrap: { display: "flex", flexWrap: "wrap", gap: 8 },
  chip: { display: "inline-flex", alignItems: "center", background: "#F6ECD8", borderRadius: 12, overflow: "hidden" },
  chipOn: { background: "#D6F1EA", boxShadow: `0 0 0 2px ${C.teal}` },
  chipText: { border: "none", background: "transparent", fontFamily: "inherit", fontSize: 18, fontWeight: 700, color: C.ink, padding: "8px 4px 8px 12px", cursor: "pointer" },
  chipX: { border: "none", background: "transparent", color: C.inkSoft, fontSize: 18, fontWeight: 700, padding: "8px 10px", cursor: "pointer" },
};

const CSS = `
* { box-sizing: border-box; }
.key:active { transform: translateY(4px); box-shadow: 0 0 0 ${C.keyShadow} !important; }
@keyframes float { 0%,100%{ transform: translateY(0);} 50%{ transform: translateY(-4px);} }
.mascotFloat { animation: float 3s ease-in-out infinite; }
@keyframes happy { 0%,100%{ transform: rotate(0) scale(1);} 25%{ transform: rotate(-8deg) scale(1.1);} 75%{ transform: rotate(8deg) scale(1.1);} }
.mascotHappy { animation: happy .5s ease-in-out 2; }
@keyframes pop { 0%{ transform: scale(0) rotate(-30deg); opacity:0;} 60%{ transform: scale(1.15) rotate(8deg); opacity:1;} 100%{ transform: scale(1) rotate(0); opacity:1;} }
.hanamaruPop { animation: pop .6s cubic-bezier(.2,1.4,.4,1) both; }
@keyframes bounceIn { 0%{ transform: scale(.6); opacity:0;} 60%{ transform: scale(1.08);} 100%{ transform: scale(1); opacity:1;} }
.bounceIn { animation: bounceIn .4s ease both; }
@keyframes askPulse { 0%,100%{ box-shadow: 0 0 0 4px ${C.almostRing};} 50%{ box-shadow: 0 0 0 8px ${C.almostRing};} }
.askPulse { animation: askPulse 1s ease-in-out infinite; }
@keyframes wrongFlash { 0%{ color: ${C.ink}; transform: scale(1);} 30%{ color: ${C.red}; transform: scale(1.18);} 60%{ transform: scale(0.96);} 100%{ color: ${C.red}; transform: scale(1);} }
.wrongFlash { animation: wrongFlash 0.45s cubic-bezier(.2,1.4,.4,1) both; }
`;
