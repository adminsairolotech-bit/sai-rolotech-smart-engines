import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Camera, Upload, X, Loader2,
  CheckCircle2, AlertTriangle, Lightbulb, RefreshCw, ImageIcon
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AIDisclaimer } from "@/components/shared";

interface Result {
  reply: string;
  imagePreview: string;
}

function ResultCard({ result, onReset }: { result: Result; onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
        <img
          src={result.imagePreview}
          alt="Uploaded"
          className="w-full max-h-56 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <span className="text-white text-xs font-semibold">AI Analysis Complete</span>
        </div>
      </div>

      <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">AI Solution</h3>
        </div>
        <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
          {result.reply}
        </div>
      </div>

      <AIDisclaimer />

      <button
        onClick={onReset}
        className="w-full py-3 border-2 border-dashed border-slate-300 text-slate-600 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 hover:border-blue-400 hover:text-blue-600 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Nayi Photo Upload Karein
      </button>
    </motion.div>
  );
}

export default function AIPhotoSolutionPage() {
  const [, setLocation] = useLocation();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Sirf image files upload karein (JPG, PNG, WEBP)", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Image 10MB se chhoti honi chahiye", variant: "destructive" });
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setResult(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleAnalyze = async () => {
    if (!imageFile || !imagePreview) {
      toast({ title: "Photo chahiye", description: "Pehle ek photo upload karein", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const base64 = imagePreview.split(",")[1];
      const mimeType = imageFile.type || "image/jpeg";

      const res = await fetch("/api/ai-photo-solution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType, description }),
      });
      const data = await res.json();
      if (data.success) {
        setResult({ reply: data.reply, imagePreview: imagePreview });
      } else {
        throw new Error(data.error || "AI analysis failed");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImageFile(null);
    setImagePreview(null);
    setDescription("");
    setResult(null);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pb-10">
      <header className="bg-white/90 backdrop-blur-sm border-b border-blue-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setLocation("/home")}
            className="p-2 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-slate-800 font-bold text-sm">AI Photo Solution</h1>
            <p className="text-blue-600 text-xs font-medium">Photo Upload → Instant AI Diagnosis</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-5">
        {!result ? (
          <>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-4 text-white">
              <p className="text-sm font-semibold mb-1">Kaise kaam karta hai?</p>
              <p className="text-xs opacity-85 leading-relaxed">
                Apni machine, VFD, PLC ya kisi bhi industrial equipment ki photo upload karein —
                AI turant diagnose karega aur step-by-step solution dega.
              </p>
            </div>

            {!imagePreview ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                  dragOver ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:border-blue-400 bg-white"
                }`}
                onClick={() => fileRef.current?.click()}
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="w-7 h-7 text-blue-500" />
                </div>
                <p className="text-sm font-semibold text-slate-700 mb-1">Photo yahan drop karein</p>
                <p className="text-xs text-slate-400 mb-4">ya click karke select karein</p>
                <div className="flex gap-3 justify-center">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" /> Gallery
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); cameraRef.current?.click(); }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" /> Camera
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-3">JPG, PNG, WEBP — Max 10MB</p>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full max-h-64 object-cover"
                />
                <button
                  onClick={() => { setImageFile(null); setImagePreview(null); }}
                  className="absolute top-3 right-3 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                  {imageFile?.name}
                </div>
              </div>
            )}

            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Problem describe karein (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jaise: Machine trip ho raha hai, E.OC error aa raha hai, ya koi aur problem..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm resize-none"
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!imagePreview || loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-500 hover:to-indigo-600 transition-all"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> AI Analyze kar raha hai...</>
              ) : (
                <><Camera className="w-5 h-5" /> AI Se Solution Lein</>
              )}
            </button>

            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: "🔧", label: "Roll Forming Machine" },
                { icon: "⚡", label: "VFD / Drive Error" },
                { icon: "🖥️", label: "PLC / HMI" },
                { icon: "🌀", label: "Motor Problem" },
                { icon: "📐", label: "Profile Defect" },
                { icon: "🔩", label: "Mechanical Issue" },
              ].map((item) => (
                <div key={item.label} className="bg-white border border-slate-200 rounded-xl p-2.5 text-center">
                  <div className="text-lg mb-1">{item.icon}</div>
                  <p className="text-[10px] text-slate-600 font-medium leading-tight">{item.label}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <ResultCard result={result} onReset={handleReset} />
        )}
      </div>
    </div>
  );
}
