"use client";

import { Search, UserCheck, XCircle } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { checkInByRegistrationId, checkInToken, manualLookup } from "@/app/actions";

type ScanResult = {
  tone: "success" | "warning" | "error";
  title: string;
  name?: string;
  club?: string | null;
};

type ManualRow = { id: string; name: string; phone: string; club: string | null; checkedInAt: string | null };

function feedback(success: boolean) {
  if (navigator.vibrate) navigator.vibrate(success ? 80 : [80, 60, 80]);
  try {
    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.frequency.value = success ? 880 : 220;
    gain.gain.value = 0.08;
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.1);
  } catch {}
}

export function Scanner({ eventId }: { eventId: string }) {
  const scannerRef = useRef<{ pause: (shouldPauseVideo?: boolean) => void; resume: () => void; clear: () => Promise<void> } | null>(null);
  const busyRef = useRef(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<ManualRow[]>([]);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let mounted = true;
    let scanner: { pause: (shouldPauseVideo?: boolean) => void; resume: () => void; clear: () => Promise<void> } | null = null;

    import("html5-qrcode").then(({ Html5QrcodeScanner, Html5QrcodeScanType }) => {
      if (!mounted) return;
      const instance = new Html5QrcodeScanner("qr-reader", {
        fps: 12,
        qrbox: { width: 280, height: 280 },
        rememberLastUsedCamera: true,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
      }, false);
      scanner = instance;
      scannerRef.current = instance;
      instance.render(async (decodedText) => {
        if (busyRef.current) return;
        busyRef.current = true;
        try { instance.pause(true); } catch {}
        try {
          const response = await checkInToken(eventId, decodedText);
          if (!response.ok) {
            feedback(false);
            setResult({ tone: "error", title: "QR not found" });
          } else if (response.status === "already") {
            feedback(false);
            setResult({ tone: "warning", title: "Already checked in", name: response.name, club: response.club });
          } else {
            feedback(true);
            setResult({ tone: "success", title: "Checked in", name: response.name, club: response.club });
          }
        } catch {
          feedback(false);
          setResult({ tone: "error", title: "Could not check in" });
        }
        window.setTimeout(() => {
          setResult(null);
          busyRef.current = false;
          try { instance.resume(); } catch {}
        }, 1300);
      }, () => {});
    });

    return () => {
      mounted = false;
      if (scanner) void scanner.clear().catch(() => {});
    };
  }, [eventId]);

  function searchManual() {
    startTransition(async () => setMatches(await manualLookup(eventId, query)));
  }

  function manualCheckIn(row: ManualRow) {
    startTransition(async () => {
      const response = await checkInByRegistrationId(eventId, row.id);
      if (!response.ok) return;
      feedback(response.status === "checked_in");
      setResult({
        tone: response.status === "checked_in" ? "success" : "warning",
        title: response.status === "checked_in" ? "Checked in manually" : "Already checked in",
        name: response.name,
        club: response.club
      });
      setMatches((current) => current.map((item) => item.id === row.id ? { ...item, checkedInAt: item.checkedInAt ?? new Date().toISOString() } : item));
      window.setTimeout(() => setResult(null), 1400);
    });
  }

  return (
    <div className="scanner-workspace">
      <section className="camera-panel">
        <div id="qr-reader" className="qr-reader" />
        <div className="camera-hint">Center the student&apos;s QR inside the box. The scanner resets automatically.</div>
        {result ? (
          <div className={`scan-result ${result.tone}`}>
            {result.tone === "error" ? <XCircle size={30} /> : <UserCheck size={30} />}
            <div><span>{result.title}</span>{result.name ? <strong>{result.name}</strong> : null}{result.club ? <small>{result.club}</small> : null}</div>
          </div>
        ) : null}
      </section>

      <section className="manual-panel">
        <button className="manual-toggle" onClick={() => setManualOpen((value) => !value)}><Search size={18} /> Can&apos;t scan? Search attendee</button>
        {manualOpen ? (
          <div className="manual-body">
            <div className="manual-search"><input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") searchManual(); }} placeholder="Name or phone" /><button className="button button-secondary" onClick={searchManual} disabled={pending}>Search</button></div>
            <div className="manual-results">
              {matches.map((row) => <button key={row.id} onClick={() => manualCheckIn(row)} disabled={pending}><div><strong>{row.name}</strong><span>{row.club ?? "No club"} · {row.phone}</span></div><span className={row.checkedInAt ? "manual-status done" : "manual-status"}>{row.checkedInAt ? "Already in" : "Check in"}</span></button>)}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
