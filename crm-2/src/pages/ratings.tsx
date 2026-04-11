/**
 * SAI RoloTech — Ratings & Reviews
 * Rate products, services, and overall experience
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Star, ThumbsUp, ThumbsDown, MessageSquare,
  CheckCircle2, Loader2, Send, Cpu, Wrench, Bot, Package,
  Phone, MapPin, User, Smile, Meh, Frown,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const WHATSAPP = "919667146889";

function StarRatingLarge({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-2 justify-center">
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={(e) => {
            const buttons = e.currentTarget.parentElement?.querySelectorAll("button");
            buttons?.forEach((btn, i) => {
              if (i < s) btn.classList.add("scale-110");
            });
          }}
          onMouseLeave={(e) => {
            const buttons = e.currentTarget.parentElement?.querySelectorAll("button");
            buttons?.forEach(btn => btn.classList.remove("scale-110"));
          }}
          className={`text-4xl transition-all duration-200 ${
            s <= value ? "text-amber-400" : "text-gray-300"
          } hover:scale-110`}
          aria-label={`Rate ${s} star${s !== 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function RatingCard({ icon: Icon, label, description, value, onChange, color, iconBg }: {
  icon: React.ElementType; label: string; description: string;
  value: number; onChange: (v: number) => void;
  color: string; iconBg: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800">{label}</p>
          <p className="text-[10px] text-gray-500">{description}</p>
        </div>
      </div>
      <StarRatingLarge value={value} onChange={onChange} />
      <p className="text-center text-[10px] text-gray-400 mt-2">
        {value === 5 ? "Excellent! ⭐⭐⭐⭐⭐" :
         value === 4 ? "Very Good ⭐⭐⭐⭐" :
         value === 3 ? "Average ⭐⭐⭐" :
         value === 2 ? "Needs Improvement ⭐⭐" :
         value === 1 ? "Poor ⭐" : "Tap to rate"}
      </p>
    </div>
  );
}

const MOOD_LABELS = [
  { value: "5", label: "Very Satisfied", icon: Smile, color: "text-emerald-600", bg: "bg-emerald-50" },
  { value: "3", label: "Neutral", icon: Meh, color: "text-amber-600", bg: "bg-amber-50" },
  { value: "1", label: "Dissatisfied", icon: Frown, color: "text-red-600", bg: "bg-red-50" },
];

/* ─── Main Page ─────────────────────────────────────────────── */
export default function RatingsPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const [tab, setTab] = useState<"product" | "service" | "ai" | "app">("product");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Product ratings
  const [productRatings, setProductRatings] = useState({
    machineQuality: 0,
    priceValue: 0,
    deliveryTime: 0,
    afterSalesSupport: 0,
  });

  // Service ratings
  const [serviceRatings, setServiceRatings] = useState({
    responseTime: 0,
    technicalSupport: 0,
    installationService: 0,
    communication: 0,
  });

  // AI ratings
  const [aiRatings, setAiRatings] = useState({
    quotationAccuracy: 0,
    troubleshootHelpful: 0,
    responseTime: 0,
    easeOfUse: 0,
  });

  // App rating
  const [appRating, setAppRating] = useState(0);
  const [mood, setMood] = useState<string>("5");
  const [feedback, setFeedback] = useState("");
  const [suggestions, setSuggestions] = useState("");

  const getCurrentRatings = () => {
    if (tab === "product") return productRatings;
    if (tab === "service") return serviceRatings;
    if (tab === "ai") return aiRatings;
    return {};
  };

  const getCurrentSetters = () => {
    if (tab === "product") return setProductRatings;
    if (tab === "service") return setServiceRatings;
    if (tab === "ai") return setAiRatings;
    return () => {};
  };

  const totalRatings = Object.values(getCurrentRatings() as Record<string, number>).filter(v => v > 0).length;
  const totalPossible = Object.keys(getCurrentRatings() as Record<string, number>).length;

  const handleSubmit = async () => {
    const hasRatings = appRating > 0 || Object.values(productRatings).some(v => v > 0) ||
      Object.values(serviceRatings).some(v => v > 0) || Object.values(aiRatings).some(v => v > 0);

    if (!hasRatings) {
      toast({ title: "Kuch rating dijiye", description: "Minimum 1 rating zaroor hai.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));
    setSubmitting(false);
    setSubmitted(true);
  };

  const handleWhatsAppSubmit = () => {
    const allRatings = {
      "Machine Quality": productRatings.machineQuality || "Not rated",
      "Price Value": productRatings.priceValue || "Not rated",
      "Delivery Time": productRatings.deliveryTime || "Not rated",
      "After Sales Support": productRatings.afterSalesSupport || "Not rated",
      "Response Time": serviceRatings.responseTime || "Not rated",
      "Technical Support": serviceRatings.technicalSupport || "Not rated",
      "Installation Service": serviceRatings.installationService || "Not rated",
      "Communication": serviceRatings.communication || "Not rated",
      "AI Quotation Accuracy": aiRatings.quotationAccuracy || "Not rated",
      "AI Troubleshooting": aiRatings.troubleshootHelpful || "Not rated",
      "AI Response Time": aiRatings.responseTime || "Not rated",
      "AI Ease of Use": aiRatings.easeOfUse || "Not rated",
      "App Overall": appRating,
    };

    let text = `⭐ *SAI RoloTech Rating & Review*\n\n`;
    text += `*User:* ${user?.name || "Guest"}\n`;
    text += `*Date:* ${new Date().toLocaleDateString("en-IN")}\n\n`;

    text += `*📦 Product Ratings:*\n`;
    Object.entries({
      "Machine Quality": productRatings.machineQuality,
      "Price Value": productRatings.priceValue,
      "Delivery Time": productRatings.deliveryTime,
      "After Sales Support": productRatings.afterSalesSupport,
    }).forEach(([k, v]) => { text += `  ${k}: ${"★".repeat(v || 0)}${"☆".repeat(5 - (v || 0))}\n`; });

    text += `\n*🔧 Service Ratings:*\n`;
    Object.entries({
      "Response Time": serviceRatings.responseTime,
      "Technical Support": serviceRatings.technicalSupport,
      "Installation": serviceRatings.installationService,
      "Communication": serviceRatings.communication,
    }).forEach(([k, v]) => { text += `  ${k}: ${"★".repeat(v || 0)}${"☆".repeat(5 - (v || 0))}\n`; });

    text += `\n*🤖 AI Features Ratings:*\n`;
    Object.entries({
      "Quotation Accuracy": aiRatings.quotationAccuracy,
      "Troubleshooting Help": aiRatings.troubleshootHelpful,
      "Response Time": aiRatings.responseTime,
      "Ease of Use": aiRatings.easeOfUse,
    }).forEach(([k, v]) => { text += `  ${k}: ${"★".repeat(v || 0)}${"☆".repeat(5 - (v || 0))}\n`; });

    text += `\n*📱 App Rating:* ${"★".repeat(appRating)}${"☆".repeat(5 - appRating)}\n`;
    text += `*Mood:* ${mood === "5" ? "Very Satisfied 😊" : mood === "3" ? "Neutral 😐" : "Dissatisfied 😞"}\n`;

    if (feedback) text += `\n*💬 Feedback:*\n${feedback}\n`;
    if (suggestions) text += `\n*💡 Suggestions:*\n${suggestions}\n`;

    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, "_blank");
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-white flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4 max-w-sm"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-amber-200">
            <Star className="w-10 h-10 text-white fill-white" />
          </div>
          <h2 className="text-2xl font-black text-gray-800">Thank You! 🙏</h2>
          <p className="text-sm text-gray-500">Aapki rating submit ho gayi hai. Aapki feedback se hamari service aur better hogi.</p>
          <div className="space-y-2">
            <button
              onClick={handleWhatsAppSubmit}
              className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
            >
              WhatsApp pe Review Bhejein
            </button>
            <button
              onClick={() => setLocation("/home")}
              className="w-full py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium"
            >
              Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/20 to-white pb-10">

      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 px-4 pt-6 pb-8">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => setLocation("/home")}
            className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div>
            <p className="text-orange-200 text-xs font-medium">Your Opinion Matters</p>
            <h1 className="text-xl font-black text-white">Rate SAI RoloTech</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-4">

        {/* Progress indicator */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-700">
              {totalRatings}/{totalPossible} rated
            </p>
            <p className="text-xs text-gray-500">
              {tab === "product" ? "📦 Products" :
               tab === "service" ? "🔧 Services" :
               tab === "ai" ? "🤖 AI Features" : "📱 App Overall"}
            </p>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-300"
              style={{ width: `${(totalRatings / totalPossible) * 100}%` }}
            />
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {[
            { id: "product" as const, icon: Cpu, label: "Products", count: 4 },
            { id: "service" as const, icon: Wrench, label: "Services", count: 4 },
            { id: "ai" as const, icon: Bot, label: "AI Tools", count: 4 },
            { id: "app" as const, icon: Package, label: "App Overall", count: 1 },
          ].map(t => {
            const currentRatings = t.id === "product" ? productRatings :
              t.id === "service" ? serviceRatings :
              t.id === "ai" ? aiRatings : { appRating };

            const filled = Object.values(currentRatings as Record<string, number>).filter(v => v > 0).length;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 py-3 rounded-2xl text-xs font-semibold transition-all flex flex-col items-center gap-1 min-w-[70px] ${
                  tab === t.id
                    ? "bg-white border-2 border-amber-400 text-amber-700 shadow-md"
                    : "bg-white/70 border-2 border-transparent text-gray-600 hover:border-gray-200"
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100">
                  {filled}/{t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Product Ratings Tab */}
        {tab === "product" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <RatingCard
              icon={Cpu}
              label="Machine Quality"
              description="Build quality, materials, durability"
              value={productRatings.machineQuality}
              onChange={(v) => setProductRatings(p => ({ ...p, machineQuality: v }))}
              color="text-blue-600"
              iconBg="bg-blue-50"
            />
            <RatingCard
              icon={Star}
              label="Price vs Value"
              description="Kitna value for money mila"
              value={productRatings.priceValue}
              onChange={(v) => setProductRatings(p => ({ ...p, priceValue: v }))}
              color="text-amber-600"
              iconBg="bg-amber-50"
            />
            <RatingCard
              icon={Package}
              label="Delivery Time"
              description="Delivery kitni fast thi"
              value={productRatings.deliveryTime}
              onChange={(v) => setProductRatings(p => ({ ...p, deliveryTime: v }))}
              color="text-emerald-600"
              iconBg="bg-emerald-50"
            />
            <RatingCard
              icon={Phone}
              label="After Sales Support"
              description="Support ka response aur help"
              value={productRatings.afterSalesSupport}
              onChange={(v) => setProductRatings(p => ({ ...p, afterSalesSupport: v }))}
              color="text-violet-600"
              iconBg="bg-violet-50"
            />
          </motion.div>
        )}

        {/* Service Ratings Tab */}
        {tab === "service" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <RatingCard
              icon={Clock}
              label="Response Time"
              description=" inquiry ka kitni jaldi reply mila"
              value={serviceRatings.responseTime}
              onChange={(v) => setServiceRatings(p => ({ ...p, responseTime: v }))}
              color="text-cyan-600"
              iconBg="bg-cyan-50"
            />
            <RatingCard
              icon={Wrench}
              label="Technical Support"
              description="Machine problems mein madad"
              value={serviceRatings.technicalSupport}
              onChange={(v) => setServiceRatings(p => ({ ...p, technicalSupport: v }))}
              color="text-orange-600"
              iconBg="bg-orange-50"
            />
            <RatingCard
              icon={User}
              label="Installation Service"
              description="Setup aur installation ki quality"
              value={serviceRatings.installationService}
              onChange={(v) => setServiceRatings(p => ({ ...p, installationService: v }))}
              color="text-teal-600"
              iconBg="bg-teal-50"
            />
            <RatingCard
              icon={MessageSquare}
              label="Communication"
              description="Clear aur helpful communication"
              value={serviceRatings.communication}
              onChange={(v) => setServiceRatings(p => ({ ...p, communication: v }))}
              color="text-pink-600"
              iconBg="bg-pink-50"
            />
          </motion.div>
        )}

        {/* AI Ratings Tab */}
        {tab === "ai" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <RatingCard
              icon={Bot}
              label="AI Quotation Accuracy"
              description="Generated quotation kitna accurate tha"
              value={aiRatings.quotationAccuracy}
              onChange={(v) => setAiRatings(p => ({ ...p, quotationAccuracy: v }))}
              color="text-blue-600"
              iconBg="bg-blue-50"
            />
            <RatingCard
              icon={Wrench}
              label="AI Troubleshooting"
              description="Machine guide kitna helpful tha"
              value={aiRatings.troubleshootHelpful}
              onChange={(v) => setAiRatings(p => ({ ...p, troubleshootHelpful: v }))}
              color="text-orange-600"
              iconBg="bg-orange-50"
            />
            <RatingCard
              icon={Bot}
              label="AI Response Speed"
              description="Kitni der mein AI ne reply diya"
              value={aiRatings.responseTime}
              onChange={(v) => setAiRatings(p => ({ ...p, responseTime: v }))}
              color="text-violet-600"
              iconBg="bg-violet-50"
            />
            <RatingCard
              icon={Smile}
              label="AI Ease of Use"
              description="AI tools kitne easy the use karne mein"
              value={aiRatings.easeOfUse}
              onChange={(v) => setAiRatings(p => ({ ...p, easeOfUse: v }))}
              color="text-emerald-600"
              iconBg="bg-emerald-50"
            />
          </motion.div>
        )}

        {/* App Overall Tab */}
        {tab === "app" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

            {/* Overall Stars */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center shadow-sm">
              <p className="text-sm font-bold text-gray-800 mb-3">Overall App Rating</p>
              <StarRatingLarge value={appRating} onChange={setAppRating} />
              <p className="text-sm text-gray-500 mt-2">
                {appRating === 5 ? "Excellent! Best app I've used!" :
                 appRating === 4 ? "Very Good! Impressed." :
                 appRating === 3 ? "Average. Some improvements needed." :
                 appRating === 2 ? "Below Average" :
                 appRating === 1 ? "Poor experience" : "Tap to rate the app"}
              </p>
            </div>

            {/* Mood */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-700 mb-3">How do you feel about SAI RoloTech?</p>
              <div className="flex gap-3 justify-center">
                {MOOD_LABELS.map(m => (
                  <button
                    key={m.value}
                    onClick={() => setMood(m.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${
                      mood === m.value
                        ? `${m.bg} border-current ${m.color}`
                        : "border-gray-200 text-gray-400 hover:border-gray-300"
                    }`}
                  >
                    <m.icon className="w-6 h-6" />
                    <span className="text-[10px] font-semibold">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                <MessageSquare className="w-3.5 h-3.5 inline mr-1" />
                Your Feedback (optional)
              </label>
              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="Kya aapko sabse achha laga? Kya improvements chahiye?"
                rows={3}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs placeholder-gray-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all resize-none"
              />
            </div>

            {/* Suggestions */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                <Star className="w-3.5 h-3.5 inline mr-1" />
                Suggestions (optional)
              </label>
              <textarea
                value={suggestions}
                onChange={e => setSuggestions(e.target.value)}
                placeholder="Naya feature chahiye? Koi missing feature? Koi suggestion?"
                rows={2}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs placeholder-gray-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all resize-none"
              />
            </div>
          </motion.div>
        )}

        {/* Submit */}
        <div className="mt-4 space-y-2">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-90 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-200 disabled:opacity-60"
          >
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><CheckCircle2 className="w-4 h-4" /> Submit Rating</>}
          </button>
          <button
            onClick={handleWhatsAppSubmit}
            className="w-full py-2.5 border-2 border-green-500 text-green-700 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
          >
            WhatsApp pe Bhejein
          </button>
        </div>

        {/* Previous reviews note */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-blue-800 mb-1">Previous Reviews ki Importance</p>
          <p className="text-[11px] text-blue-700 leading-relaxed">
            Aapki honest review se hamare naye customers ko pata chalta hai ki SAI RoloTech machines quality achhi hai ya nahi.
            Sirf 2 minute lagate hain — aapki rating aur feedback hamari team ke liye bahut valuable hai.
          </p>
        </div>

      </div>
    </div>
  );
}
