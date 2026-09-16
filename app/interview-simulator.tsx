"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Language } from "./localization";

type SimulatorApplication = {
  id: number;
  company: string;
  role: string;
  track: string;
  location: string | null;
  score: number;
};

type Question = {
  prompt: string;
  translation: string;
  focus: string;
  keywords: string[];
};

type Phase = "setup" | "live" | "complete";

type SpeechResult = { 0: { transcript?: string } };
type SpeechEvent = { results: ArrayLike<SpeechResult> };
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const copy = {
  tr: {
    eyebrow: "MÜLAKAT HAZIRLIĞI",
    title: "Gerçekçi mülakat provası",
    intro: "Başvurunu seç, Almanca görüşmeyi adım adım prova et ve sonunda net bir geri bildirim al.",
    selectApplication: "Başvuru seç",
    interviewApplication: "Mülakat daveti bulunan başvuru",
    chooseApplication: "Başvuru seçilmedi",
    flow: "5 soru · Almanca · yaklaşık 10 dakika",
    start: "Simülasyonu başlat",
    reset: "Yeni prova",
    mode: "Prova modu",
    modeValue: "Almanca görüşme",
    role: "Pozisyon",
    location: "Konum",
    match: "Uyum",
    coach: "Hazırlık notu",
    coachText: "Kısa, sakin ve somut cevaplar ver. Her cevapta mümkünse gerçek bir örnek kullan.",
    question: "Soru",
    answer: "Cevabın",
    answerPlaceholder: "Almanca cevabını buraya yaz veya mikrofonla söyle…",
    speak: "Mikrofonla cevapla",
    stop: "Dinlemeyi durdur",
    micUnavailable: "Bu tarayıcıda mikrofonla yazma kullanılamıyor.",
    next: "Cevabı kaydet ve devam et",
    last: "Cevabı kaydet ve sonucu gör",
    questionHint: "Bu soruda özellikle şunu göster:",
    timer: "Süre",
    progress: "İlerleme",
    completeTitle: "Prova tamamlandı",
    completeText: "Cevaplarını gözden geçir. Bir sonraki provada özellikle düşük puanlı alanı güçlendir.",
    overall: "Genel değerlendirme",
    roleFit: "Pozisyona uygunluk",
    clarity: "Anlatım netliği",
    examples: "Somut örnek kullanımı",
    answerReview: "Cevap değerlendirmeleri",
    strong: "Güçlü başlangıç",
    improve: "Geliştirilebilir",
    good: "İyi temel",
    missing: "Cevap kısa kaldı. Bir örnek ve sonuç ekle.",
    solid: "Cevap anlaşılır. Bir somut örnekle daha ikna edici olabilir.",
    strongAnswer: "Cevap role uygun ve somut. Sakin anlatımı koru.",
    savedLocally: "Son prova bu tarayıcıda kaydedildi.",
    noApplications: "Önce portalına bir başvuru ekle.",
    firstQuestion: "İlk soru seni ve motivasyonunu tanımaya yönelik.",
  },
  de: {
    eyebrow: "VORBEREITUNG AUF DAS GESPRÄCH",
    title: "Realistische Gesprächsprobe",
    intro: "Wähle eine Bewerbung, übe das Gespräch auf Deutsch und erhalte anschließend klares Feedback.",
    selectApplication: "Bewerbung auswählen",
    interviewApplication: "Bewerbung mit Gesprächseinladung",
    chooseApplication: "Bewerbung auswählen",
    flow: "5 Fragen · Deutsch · etwa 10 Minuten",
    start: "Simulation starten",
    reset: "Neue Probe",
    mode: "Probenmodus",
    modeValue: "Gespräch auf Deutsch",
    role: "Position",
    location: "Ort",
    match: "Passung",
    coach: "Vorbereitungshinweis",
    coachText: "Antworte kurz, ruhig und konkret. Verwende möglichst in jeder Antwort ein echtes Beispiel.",
    question: "Frage",
    answer: "Deine Antwort",
    answerPlaceholder: "Deine Antwort auf Deutsch hier schreiben oder per Mikrofon sprechen …",
    speak: "Mit Mikrofon antworten",
    stop: "Aufnahme beenden",
    micUnavailable: "Diktieren wird in diesem Browser nicht unterstützt.",
    next: "Antwort speichern und weiter",
    last: "Antwort speichern und Ergebnis anzeigen",
    questionHint: "Darauf kommt es bei dieser Frage an:",
    timer: "Zeit",
    progress: "Fortschritt",
    completeTitle: "Probe abgeschlossen",
    completeText: "Prüfe deine Antworten. In der nächsten Probe solltest du zuerst den niedrigsten Bereich verbessern.",
    overall: "Gesamtbewertung",
    roleFit: "Passung zur Stelle",
    clarity: "Klarheit",
    examples: "Konkrete Beispiele",
    answerReview: "Bewertung der Antworten",
    strong: "Starker Start",
    improve: "Ausbaufähig",
    good: "Gute Grundlage",
    missing: "Die Antwort ist zu kurz. Ergänze ein Beispiel und das Ergebnis.",
    solid: "Die Antwort ist verständlich. Ein konkretes Beispiel würde sie überzeugender machen.",
    strongAnswer: "Die Antwort passt zur Stelle und ist konkret. Behalte die ruhige Darstellung bei.",
    savedLocally: "Die letzte Probe wurde in diesem Browser gespeichert.",
    noApplications: "Füge zuerst eine Bewerbung im Portal hinzu.",
    firstQuestion: "Die erste Frage betrifft dich und deine Motivation.",
  },
} as const;

function isSchoolSupport(application: SimulatorApplication) {
  return /schulbegleiter|inklusionsassistenz|pädagog|bildung|jugend|kinder/i.test(`${application.role} ${application.company} ${application.track}`);
}

function buildQuestions(application: SimulatorApplication | undefined): Question[] {
  if (application && isSchoolSupport(application)) {
    return [
      { prompt: "Erzählen Sie uns bitte kurz etwas über sich und Ihren bisherigen Weg.", translation: "Kendinizden ve şimdiye kadarki yolunuzdan kısaca bahseder misiniz?", focus: "klarer beruflicher Hintergrund und Motivation", keywords: ["Mathematiklehrer", "Lehrer", "Kinder", "Jugendliche", "Erfahrung", "Gifhorn"] },
      { prompt: "Warum möchten Sie gerade als Schulbegleiter bei Leben leben arbeiten?", translation: "Neden özellikle Leben leben'de Schulbegleiter olarak çalışmak istiyorsunuz?", focus: "Inklusion, Geduld und langfristige Motivation", keywords: ["Schulbegleiter", "Inklusion", "unterstützen", "Geduld", "Gifhorn", "Leben leben"] },
      { prompt: "Wie reagieren Sie, wenn ein Kind im Unterricht überfordert oder unruhig wird?", translation: "Bir çocuk derste zorlanır veya huzursuz olursa nasıl tepki verirsiniz?", focus: "Ruhe, Beobachtung und individuelle Unterstützung", keywords: ["ruhig", "Geduld", "Beobachtung", "Pause", "Lehrer", "Unterstützung"] },
      { prompt: "Wie würden Sie mit Lehrkräften und Eltern zusammenarbeiten?", translation: "Öğretmenler ve ebeveynlerle nasıl iş birliği yaparsınız?", focus: "verlässliche Kommunikation und Datenschutz", keywords: ["Kommunikation", "Lehrkräfte", "Eltern", "Austausch", "Datenschutz", "Dokumentation"] },
      { prompt: "Welche Stärken bringen Sie für diese Aufgabe mit und ab wann könnten Sie beginnen?", translation: "Bu görev için hangi güçlü yönlere sahipsiniz ve ne zaman başlayabilirsiniz?", focus: "Zuverlässigkeit, Verfügbarkeit und Lernbereitschaft", keywords: ["zuverlässig", "verantwortungsbewusst", "B2", "Führerschein", "lernen", "beginnen"] },
    ];
  }

  return [
    { prompt: "Erzählen Sie uns bitte kurz etwas über sich und Ihren bisherigen Weg.", translation: "Kendinizden ve şimdiye kadarki yolunuzdan kısaca bahseder misiniz?", focus: "klarer beruflicher Hintergrund", keywords: ["Mathematiklehrer", "IT", "Cybersecurity", "Erfahrung", "Praktikum", "Zertifikate"] },
    { prompt: "Warum möchten Sie im Bereich IT-Sicherheit arbeiten?", translation: "Neden IT güvenliği alanında çalışmak istiyorsunuz?", focus: "Motivation und fachliche Ausrichtung", keywords: ["Cybersecurity", "IT-Sicherheit", "Praktikum", "Security", "lernen", "Ziel"] },
    { prompt: "Wie würden Sie bei einem verdächtigen Sicherheitsvorfall vorgehen?", translation: "Şüpheli bir güvenlik olayında nasıl ilerlersiniz?", focus: "ruhiges, strukturiertes Vorgehen", keywords: ["prüfen", "melden", "isolieren", "dokumentieren", "Priorität", "Team"] },
    { prompt: "Welche Erfahrungen haben Sie mit Security Awareness, OSINT oder Schwachstellenanalyse?", translation: "Security Awareness, OSINT veya zafiyet analizi konusunda hangi deneyimleriniz var?", focus: "Praxisbezug und Lernfähigkeit", keywords: ["Phishing", "Awareness", "OSINT", "Schwachstellen", "Dokumentation", "BCS-IT"] },
    { prompt: "Welche Stärken bringen Sie mit und wann könnten Sie beginnen?", translation: "Hangi güçlü yönlere sahipsiniz ve ne zaman başlayabilirsiniz?", focus: "Zuverlässigkeit und Verfügbarkeit", keywords: ["zuverlässig", "B2", "Führerschein", "flexibel", "lernen", "beginnen"] },
  ];
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function evaluateAnswer(answer: string, question: Question) {
  const normalized = answer.toLocaleLowerCase("de-DE");
  const keywordHits = question.keywords.filter((keyword) => normalized.includes(keyword.toLocaleLowerCase("de-DE"))).length;
  const lengthScore = answer.trim().length >= 120 ? 20 : answer.trim().length >= 60 ? 12 : answer.trim().length >= 25 ? 6 : 0;
  const exampleScore = /(beispiel|erfahrung|zum beispiel|konkret|einmal|früher|praktikum)/i.test(answer) ? 10 : 0;
  return Math.min(100, 45 + Math.min(25, keywordHits * 5) + lengthScore + exampleScore);
}

function feedbackFor(score: number, copyForLanguage: typeof copy.tr) {
  if (score >= 80) return { label: copyForLanguage.strong, text: copyForLanguage.strongAnswer };
  if (score >= 60) return { label: copyForLanguage.good, text: copyForLanguage.solid };
  return { label: copyForLanguage.improve, text: copyForLanguage.missing };
}

export function InterviewSimulator({
  applications,
  defaultApplicationId,
  language,
}: {
  applications: SimulatorApplication[];
  defaultApplicationId: number | null;
  language: Language;
}) {
  const t = copy[language];
  const [selectedId, setSelectedId] = useState(String(defaultApplicationId ?? applications[0]?.id ?? ""));
  const selectedApplication = applications.find((application) => String(application.id) === selectedId);
  const questions = useMemo(() => buildQuestions(selectedApplication), [selectedApplication]);
  const [phase, setPhase] = useState<Phase>("setup");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState("");
  const [lastSession, setLastSession] = useState<{ score: number; role: string; completedAt: string } | null>(null);
  const answerRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("interview-simulator-last-session");
      if (stored) setLastSession(JSON.parse(stored) as { score: number; role: string; completedAt: string });
    } catch {
      setLastSession(null);
    }
  }, []);

  useEffect(() => {
    if (phase !== "live" || startedAt === null) return;
    const updateClock = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    updateClock();
    const interval = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(interval);
  }, [phase, startedAt]);

  useEffect(() => {
    if (phase === "live") window.setTimeout(() => answerRef.current?.focus(), 50);
    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      setListening(false);
    };
  }, [currentIndex, phase]);

  const answerScores = useMemo(() => answers.map((value, index) => evaluateAnswer(value, questions[index] ?? questions[0])), [answers, questions]);
  const overallScore = answerScores.length ? Math.round(answerScores.reduce((sum, score) => sum + score, 0) / answerScores.length) : 0;
  const currentQuestion = questions[currentIndex] ?? questions[0];

  const startSimulation = () => {
    if (!selectedApplication) return;
    setAnswers([]);
    setAnswer("");
    setCurrentIndex(0);
    setElapsed(0);
    setStartedAt(Date.now());
    setMicError("");
    setPhase("live");
  };

  const finishSimulation = (nextAnswers: string[]) => {
    const scores = nextAnswers.map((value, index) => evaluateAnswer(value, questions[index] ?? questions[0]));
    const score = scores.length ? Math.round(scores.reduce((sum, item) => sum + item, 0) / scores.length) : 0;
    const session = { score, role: selectedApplication?.role ?? "", completedAt: new Date().toISOString() };
    setAnswers(nextAnswers);
    setPhase("complete");
    setStartedAt(null);
    setLastSession(session);
    try { window.localStorage.setItem("interview-simulator-last-session", JSON.stringify(session)); } catch { /* local storage may be disabled */ }
  };

  const submitAnswer = () => {
    if (!answer.trim() || !currentQuestion) return;
    const nextAnswers = [...answers, answer.trim()];
    if (currentIndex === questions.length - 1) finishSimulation(nextAnswers);
    else {
      setAnswers(nextAnswers);
      setAnswer("");
      setCurrentIndex((index) => index + 1);
    }
  };

  const toggleListening = () => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const speechWindow = window as Window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };
    const SpeechRecognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicError(t.micUnavailable);
      return;
    }
    setMicError("");
    const recognition = new SpeechRecognition();
    recognition.lang = "de-DE";
    recognition.interimResults = false;
    recognition.continuous = true;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map((result) => result[0]?.transcript ?? "").join(" ").trim();
      if (transcript) setAnswer((previous) => `${previous} ${transcript}`.trim());
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  if (!applications.length) {
    return <section className="interview-simulator" id="mulakat"><div className="interview-simulator-empty"><strong>{t.title}</strong><span>{t.noApplications}</span></div></section>;
  }

  return <section className={`interview-simulator ${phase}`} id="mulakat" aria-labelledby="interview-simulator-title">
    <div className="interview-simulator-head">
      <div><p className="eyebrow"><span className="eyebrow-line" /> {t.eyebrow}</p><h2 id="interview-simulator-title">{t.title}</h2><p>{t.intro}</p></div>
      <div className="simulator-head-meta"><span>{t.flow}</span>{lastSession && <small>{t.savedLocally}</small>}</div>
    </div>

    {phase === "setup" && <div className="interview-setup-grid">
      <div className="interview-setup-main">
        <label>{t.selectApplication}<select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>{applications.map((application) => <option value={application.id} key={application.id}>{application.company} — {application.role}</option>)}</select></label>
        <div className="simulator-selected-card"><div className="simulator-selected-top"><span className="simulator-live-dot" />{selectedApplication && isSchoolSupport(selectedApplication) ? t.interviewApplication : t.modeValue}<b>%{selectedApplication?.score ?? 0} {t.match}</b></div><h3>{selectedApplication?.role}</h3><p>{selectedApplication?.company} · {selectedApplication?.location || "—"}</p><dl><div><dt>{t.mode}</dt><dd>{t.modeValue}</dd></div><div><dt>{t.role}</dt><dd>{selectedApplication?.role}</dd></div><div><dt>{t.location}</dt><dd>{selectedApplication?.location || "—"}</dd></div></dl></div>
        <button className="simulator-primary" type="button" onClick={startSimulation} disabled={!selectedApplication}>{t.start}<span>→</span></button>
      </div>
      <aside className="simulator-coach-card"><span className="simulator-coach-icon">✦</span><p className="eyebrow">{t.coach}</p><h3>{t.firstQuestion}</h3><p>{t.coachText}</p><ol><li>{language === "de" ? "Kurz vorstellen" : "Kısaca kendini tanıt"}</li><li>{language === "de" ? "Konkretes Beispiel geben" : "Somut bir örnek ver"}</li><li>{language === "de" ? "Mit klarem Ergebnis schließen" : "Net bir sonuçla bitir"}</li></ol></aside>
    </div>}

    {phase === "live" && currentQuestion && <div className="interview-live-grid">
      <div className="interview-live-main"><div className="simulator-progress-row"><span>{t.question} {currentIndex + 1} / {questions.length}</span><span>{t.timer} <strong>{formatTime(elapsed)}</strong></span></div><div className="simulator-progress"><i style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} /></div><article className="simulator-question"><span className="simulator-question-number">0{currentIndex + 1}</span><div><p className="eyebrow">{t.question}</p><h3>{currentQuestion.prompt}</h3><p>{currentQuestion.translation}</p></div></article><label className="simulator-answer-label">{t.answer}<textarea ref={answerRef} value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder={t.answerPlaceholder} /></label><div className="simulator-answer-actions"><button className={`simulator-mic ${listening ? "listening" : ""}`} type="button" onClick={toggleListening}><span>{listening ? "■" : "●"}</span>{listening ? t.stop : t.speak}</button><button className="simulator-primary" type="button" onClick={submitAnswer} disabled={!answer.trim()}>{currentIndex === questions.length - 1 ? t.last : t.next}<span>→</span></button></div>{micError && <p className="simulator-mic-error" role="alert">{micError}</p>}</div>
      <aside className="simulator-live-aside"><div className="simulator-live-badge"><span />{t.progress}<b>{Math.round((currentIndex / questions.length) * 100)}%</b></div><p className="eyebrow">{t.questionHint}</p><h3>{currentQuestion.focus}</h3><p>{language === "de" ? "Sprich in vollständigen Sätzen und bleibe bei deiner eigenen Erfahrung." : "Tam cümlelerle konuş ve kendi deneyiminden bahset."}</p><div className="simulator-keywords">{currentQuestion.keywords.slice(0, 4).map((keyword) => <span key={keyword}>{keyword}</span>)}</div></aside>
    </div>}

    {phase === "complete" && <div className="interview-complete"><div className="simulator-score-card"><p className="eyebrow">{t.overall}</p><strong>{overallScore}</strong><span>/ 100</span><div className="simulator-score-bar"><i style={{ width: `${overallScore}%` }} /></div><p>{feedbackFor(overallScore, t).text}</p><button className="simulator-primary" type="button" onClick={() => { setPhase("setup"); setAnswers([]); setAnswer(""); setCurrentIndex(0); }}>{t.reset}<span>↗</span></button></div><div className="simulator-review"><p className="eyebrow">{t.answerReview}</p><h3>{selectedApplication?.role}</h3><div className="simulator-rubric"><span><b>{overallScore}</b>{t.roleFit}</span><span><b>{Math.min(100, overallScore + (overallScore > 70 ? 5 : 0))}</b>{t.clarity}</span><span><b>{Math.min(100, Math.max(0, overallScore - 3))}</b>{t.examples}</span></div><div className="simulator-answer-list">{answers.map((value, index) => { const score = answerScores[index] ?? 0; const feedback = feedbackFor(score, t); return <article key={`${index}-${value.slice(0, 10)}`}><div><span>0{index + 1}</span><strong>{questions[index]?.prompt}</strong><b className={score >= 80 ? "strong" : score >= 60 ? "good" : "improve"}>{score}</b></div><p>{feedback.label} — {feedback.text}</p></article>; })}</div></div></div>}
  </section>;
}
