"use client";

import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, Camera, Download, Loader2, RotateCcw, ScanLine, Key, Eye, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResultsTable } from "@/components/ResultsTable";
import { CameraCapture } from "@/components/CameraCapture";
import { downloadExcel } from "@/lib/excel";
import { extractItems, getSavedApiKey, saveApiKey, clearApiKey } from "@/lib/extract";
import type { LineItem } from "@/lib/types";

export type { LineItem };

const schema = z.object({
  file: z
    .instanceof(File)
    .refine((f) => f.size <= 10 * 1024 * 1024, "Máximo 10MB")
    .refine(
      (f) => ["image/jpeg", "image/png"].includes(f.type),
      "Solo JPG o PNG"
    ),
});

type FormData = z.infer<typeof schema>;
type AppState = "idle" | "processing" | "done" | "error";

export default function Home() {
  const [state, setState] = useState<AppState>("idle");
  const [items, setItems] = useState<LineItem[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [showKeyForm, setShowKeyForm] = useState(false);

  useEffect(() => {
    const saved = getSavedApiKey();
    setApiKey(saved);
  }, []);

  const { setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const processFile = useCallback(async (file: File) => {
    setState("processing");
    setErrorMsg("");
    setFileName(file.name);
    try {
      const result = await extractItems(file);
      setItems(result);
      setState("done");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      setErrorMsg(msg);
      setState("error");
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) { setValue("file", file, { shouldValidate: true }); processFile(file); }
  }, [setValue, processFile]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setValue("file", file, { shouldValidate: true }); processFile(file); }
  };

  const onCameraCapture = (file: File) => {
    setShowCamera(false);
    setValue("file", file, { shouldValidate: true });
    processFile(file);
  };

  const handleSaveKey = () => {
    if (!keyInput.trim()) return;
    saveApiKey(keyInput.trim());
    setApiKey(keyInput.trim());
    setKeyInput("");
    setShowKeyForm(false);
    if (state === "error" && errorMsg === "NO_API_KEY") {
      setState("idle");
      setErrorMsg("");
    }
  };

  const handleClearKey = () => {
    clearApiKey();
    setApiKey("");
  };

  const reset = () => { setState("idle"); setItems([]); setFileName(""); setErrorMsg(""); };

  const total = items.reduce((acc, i) => acc + i.cantidad * i.precio_sin_iva, 0);
  const noKey = !apiKey;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-brand-500 rounded-xl p-2">
              <ScanLine className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-base font-semibold text-slate-900">Lector de Facturas</h1>
          </div>
          <button
            onClick={() => setShowKeyForm((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            <Key className="h-3.5 w-3.5" />
            {apiKey ? "API key guardada" : "Configurar API key"}
          </button>
        </div>

        {/* API key form */}
        {showKeyForm && (
          <div className="max-w-3xl mx-auto mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            {apiKey ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-slate-500">API key:</span>
                  <span className="font-mono text-xs text-slate-700 truncate">
                    {showKey ? apiKey : `${apiKey.slice(0, 8)}${"•".repeat(12)}`}
                  </span>
                  <button onClick={() => setShowKey((v) => !v)} className="text-slate-400 hover:text-slate-600 shrink-0">
                    {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <button onClick={handleClearKey} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 shrink-0">
                  <Trash2 className="h-3.5 w-3.5" />
                  Eliminar
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveKey()}
                  placeholder="gsk_..."
                  className="flex-1 text-sm bg-white border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-brand-400 font-mono"
                />
                <Button size="sm" onClick={handleSaveKey} className="rounded-lg shrink-0">
                  Guardar
                </Button>
              </div>
            )}
          </div>
        )}
      </header>

      <main className="flex-1 px-4 py-6 md:py-10">
        <div className="max-w-3xl mx-auto space-y-5">

          {/* No API key banner */}
          {noKey && !showKeyForm && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
              <p className="text-sm text-amber-700">
                Necesitás una API key de <strong>Groq</strong> para usar la app.
              </p>
              <button
                onClick={() => setShowKeyForm(true)}
                className="text-sm font-medium text-amber-700 underline underline-offset-2 shrink-0"
              >
                Configurar
              </button>
            </div>
          )}

          {/* Upload */}
          {(state === "idle" || state === "error") && (
            <div className="space-y-4">
              <button
                onClick={() => setShowCamera(true)}
                disabled={noKey}
                className="w-full bg-brand-500 hover:bg-brand-600 active:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl p-6 flex flex-col items-center gap-3 transition-colors shadow-sm shadow-brand-200"
              >
                <div className="bg-brand-400 rounded-full p-3">
                  <Camera className="h-7 w-7" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-base">Fotografiar documento</p>
                  <p className="text-brand-100 text-sm mt-0.5">Usá la cámara de tu dispositivo</p>
                </div>
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 font-medium">o subí una imagen</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <div
                onDrop={onDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                className={`bg-white border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                  dragOver ? "border-brand-400 bg-brand-50" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <Upload className="mx-auto h-8 w-8 text-slate-300 mb-3" />
                <label className={noKey ? "cursor-not-allowed" : "cursor-pointer"}>
                  <span className={`font-medium text-sm ${noKey ? "text-slate-300" : "text-brand-500 hover:underline"}`}>
                    Seleccioná un archivo
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".jpg,.jpeg,.png"
                    disabled={noKey}
                    onChange={onFileChange}
                  />
                </label>
                <p className="text-slate-400 text-xs mt-1.5">JPG · PNG — máx. 10 MB</p>
                {errors.file && <p className="text-red-500 text-xs mt-2">{errors.file.message}</p>}
              </div>

              {state === "error" && errorMsg !== "NO_API_KEY" && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
                  {errorMsg}
                </div>
              )}
            </div>
          )}

          {/* Processing */}
          {state === "processing" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center gap-4 shadow-sm">
              <div className="bg-brand-50 rounded-full p-5">
                <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
              </div>
              <div className="text-center">
                <p className="font-medium text-slate-800">Analizando documento</p>
                <p className="text-slate-400 text-sm mt-1 max-w-xs truncate">{fileName}</p>
              </div>
            </div>
          )}

          {/* Results */}
          {state === "done" && items.length > 0 && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="secondary" className="shrink-0">{items.length} artículos</Badge>
                    <span className="text-slate-500 text-sm truncate">{fileName}</span>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-2">
                    <span className="text-slate-900 font-semibold text-sm">
                      Total s/IVA:&nbsp;
                      <span className="text-brand-500">
                        $ {total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </span>
                    </span>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="outline" size="sm" onClick={reset} className="rounded-xl">
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Nuevo</span>
                      </Button>
                      <Button size="sm" onClick={() => downloadExcel(items, fileName)} className="rounded-xl">
                        <Download className="h-3.5 w-3.5" />
                        <span>Excel</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <ResultsTable items={items} />
            </div>
          )}

        </div>
      </main>

      {showCamera && (
        <CameraCapture onCapture={onCameraCapture} onClose={() => setShowCamera(false)} />
      )}
    </div>
  );
}
