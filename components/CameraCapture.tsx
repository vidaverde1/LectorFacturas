"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { X, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export function CameraCapture({ onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: "environment" } } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setReady(true);
        }
      })
      .catch(() => setError("No se pudo acceder a la cámara. Comprueba los permisos del navegador."));

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const capture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        streamRef.current?.getTracks().forEach((t) => t.stop());
        onCapture(new File([blob], `captura_${Date.now()}.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92
    );
  }, [onCapture]);

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      <div className="flex justify-between items-center p-4">
        <span className="text-white font-medium">Capturar documento</span>
        <button onClick={onClose} className="text-white hover:text-gray-300 p-1">
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center overflow-hidden px-4">
        {error ? (
          <p className="text-white text-center max-w-sm">{error}</p>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="p-8 flex justify-center">
        <Button
          size="lg"
          onClick={capture}
          disabled={!ready || !!error}
          className="rounded-full h-16 w-16 p-0"
          title="Capturar"
        >
          <Camera className="h-7 w-7" />
        </Button>
      </div>
    </div>
  );
}
