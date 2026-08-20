"use client";

import { QRCodeSVG } from "qrcode.react";

export function PassQr({ token, size = 260 }: { token: string; size?: number }) {
  return (
    <div className="qr-frame" aria-label="Check-in QR code">
      <QRCodeSVG
        value={`upswell-checkin:${token}`}
        size={size}
        level="M"
        bgColor="#ffffff"
        fgColor="#111111"
        marginSize={2}
      />
    </div>
  );
}
