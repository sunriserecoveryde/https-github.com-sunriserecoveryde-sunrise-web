import React, { useRef, useEffect, useLayoutEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';

export interface WetSignatureCanvasProps {
  height?: number;
  onSigned?: (dataUrl: string) => void;
  onCleared?: () => void;
  existingSignature?: string | null;
  disabled?: boolean;
  lineColor?: string;
  lineWidth?: number;
}

/**
 * Canvas-based wet signature capture.
 * Works with mouse, finger (touch), and stylus via Pointer Events API.
 * Pass existingSignature (dataUrl) to render a saved sig in read-only mode.
 */
export function WetSignatureCanvas({
  height = 140,
  onSigned,
  onCleared,
  existingSignature = null,
  disabled = false,
  lineColor = '#0F2B4B',
  lineWidth = 2,
}: WetSignatureCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const [hasContent, setHasContent] = useState(!!existingSignature);
  // Track whether canvas buffer has been sized
  const sized = useRef(false);

  /** Set canvas buffer to match its CSS size × device pixel ratio */
  function sizeCanvas() {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = window.devicePixelRatio || 1;
    const w = container.clientWidth || 480;
    const h = height;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    sized.current = true;
  }

  /** Draw an existing signature image onto the canvas */
  function drawExisting(src: string) {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const w = container.clientWidth || 480;
      ctx.clearRect(0, 0, w, height);
      ctx.drawImage(img, 0, 0, w, height);
    };
  }

  // Size canvas after first render
  useLayoutEffect(() => {
    sizeCanvas();
    if (existingSignature) {
      drawExisting(existingSignature);
      setHasContent(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to existingSignature changes
  useEffect(() => {
    if (!sized.current) return;
    if (existingSignature) {
      drawExisting(existingSignature);
      setHasContent(true);
    } else {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && canvas) {
        const dpr = window.devicePixelRatio || 1;
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      }
      setHasContent(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingSignature]);

  // Pointer event wiring
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || disabled) return;

    function getCtx() {
      const ctx = canvas!.getContext('2d');
      if (!ctx) return null;
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      return ctx;
    }

    function coords(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function onDown(e: PointerEvent) {
      e.preventDefault();
      canvas!.setPointerCapture(e.pointerId);
      isDrawing.current = true;
      const ctx = getCtx();
      if (!ctx) return;
      const { x, y } = coords(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    }

    function onMove(e: PointerEvent) {
      if (!isDrawing.current) return;
      e.preventDefault();
      const ctx = getCtx();
      if (!ctx) return;
      const { x, y } = coords(e);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    function onUp() {
      if (!isDrawing.current) return;
      isDrawing.current = false;
      setHasContent(true);
      onSigned?.(canvas!.toDataURL('image/png'));
    }

    canvas.addEventListener('pointerdown', onDown, { passive: false });
    canvas.addEventListener('pointermove', onMove, { passive: false });
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);

    return () => {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
    };
  }, [disabled, lineColor, lineWidth, onSigned]);

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    setHasContent(false);
    onCleared?.();
  }

  return (
    <div ref={containerRef} className="relative w-full select-none" style={{ touchAction: 'none' }}>
      <div
        className={`relative rounded-xl overflow-hidden border-2 transition-colors ${
          disabled
            ? 'border-gray-200 bg-gray-50'
            : hasContent
            ? 'border-green-400 bg-white'
            : 'border-dashed border-slate-300 bg-slate-50 hover:border-navy/40'
        }`}
        style={{ height }}
      >
        {/* Placeholder text */}
        {!hasContent && !disabled && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-1">
            <div className="text-slate-400 text-sm font-medium">Sign here</div>
            <div className="text-slate-300 text-xs">Draw with finger, stylus, or mouse</div>
          </div>
        )}
        {/* Signature baseline rule */}
        <div className="absolute bottom-9 left-8 right-8 border-b border-slate-200 pointer-events-none" />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 block"
          style={{ cursor: disabled ? 'default' : 'crosshair', touchAction: 'none' }}
        />
      </div>

      {!disabled && hasContent && (
        <button
          type="button"
          onClick={clear}
          className="absolute top-2 right-2 flex items-center gap-1 text-[10px] text-slate-500 hover:text-red-500 bg-white/90 border border-border rounded px-1.5 py-0.5 shadow-sm transition-colors"
        >
          <Trash2 className="w-2.5 h-2.5" /> Clear
        </button>
      )}
    </div>
  );
}
