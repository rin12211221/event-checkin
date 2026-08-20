"use client";

import { QRCodeSVG } from "qrcode.react";

export function LinkQr({ value, size = 180 }: { value: string; size?: number }) {
  return (
    <div className="qr-frame compact">
      <QRCodeSVG value={value} size={size} level="M" bgColor="#ffffff" fgColor="#111111" marginSize={2} />
    </div>
  );
}
