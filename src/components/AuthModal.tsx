"use client";

import React, { useState, useEffect } from "react";
import { X, ArrowRight, Loader2 } from "lucide-react";
import { useUI } from "@/buffer/UIContext";
import { useCustomer, type Customer } from "@/buffer/CustomerContext";

const AuthModal = () => {
    const { isAuthModalOpen, closeAuthModal } = useUI();
    const { setCustomer, refresh } = useCustomer();

    const [step, setStep] = useState<"phone" | "otp" | "name">("phone");
    const [loading, setLoading] = useState(false);
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [devCode, setDevCode] = useState<string | null>(null);
    const [timer, setTimer] = useState(0);

    useEffect(() => {
        if (!isAuthModalOpen) {
            setStep("phone"); setPhone(""); setOtp(""); setName("");
            setLoading(false); setError(null); setDevCode(null);
        }
    }, [isAuthModalOpen]);

    useEffect(() => {
        if (step === "otp" && timer > 0) {
            const t = setInterval(() => setTimer((p) => p - 1), 1000);
            return () => clearInterval(t);
        }
    }, [step, timer]);

    if (!isAuthModalOpen) return null;

    const sendOtp = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (phone.length < 10) return;
        setLoading(true); setError(null);
        try {
            const r = await fetch("/api/auth/request-otp", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone }),
            });
            const j = await r.json();
            if (!r.ok) { setError(j.error || "Failed to send OTP"); return; }
            setDevCode(j.devCode ?? null);
            setStep("otp"); setTimer(30); setOtp("");
        } finally { setLoading(false); }
    };

    const verifyOtp = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (otp.length < 4) return;
        setLoading(true); setError(null);
        try {
            const r = await fetch("/api/auth/verify-otp", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone, code: otp }),
            });
            const j = await r.json();
            if (!r.ok) { setError(j.error || "Invalid code"); return; }
            const c = j.customer as Customer;
            setCustomer(c);
            if (!c.name) { setStep("name"); return; }
            await refresh();
            closeAuthModal();
        } finally { setLoading(false); }
    };

    const saveName = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!name.trim()) return;
        setLoading(true); setError(null);
        try {
            const r = await fetch("/api/account/profile", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim() }),
            });
            const j = await r.json();
            if (!r.ok) { setError(j.error || "Failed"); return; }
            setCustomer(j.customer);
            await refresh();
            closeAuthModal();
        } finally { setLoading(false); }
    };

    const title = step === "name" ? "Almost there" : "Login / Sign up";
    const subtitle =
        step === "phone" ? "Enter your mobile number to continue"
        : step === "otp" ? `Enter the 6-digit code sent to +91 ${phone}`
        : "Tell us your name to finish";

    return (
        <div className="fixed inset-0 z-[60] flex items-end lg:items-center justify-center p-0 lg:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full lg:max-w-sm bg-card border-t lg:border border-border shadow-2xl overflow-hidden rounded-t-2xl lg:rounded-[5px]" onClick={(e) => e.stopPropagation()}>
                <button onClick={closeAuthModal} className="absolute right-4 top-4 p-2 hover:bg-muted transition-colors z-10 rounded-full"><X size={20} /></button>

                <div className="p-8 pt-12 pb-12 lg:pb-8">
                    <div className="text-center mb-8">
                        <h2 className="text-xl font-black tracking-[0.2em] uppercase mb-2">{title}</h2>
                        <p className="text-xs text-muted-foreground tracking-wide">{subtitle}</p>
                    </div>

                    {step === "phone" && (
                        <form onSubmit={sendOtp} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-muted-foreground">Mobile Number</label>
                                <div className="flex gap-4">
                                    <span className="py-3 border-b border-border text-lg font-medium text-muted-foreground">+91</span>
                                    <input type="tel" required value={phone}
                                        onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); if (v.length <= 10) setPhone(v); }}
                                        placeholder="00000 00000" autoFocus
                                        className="flex-1 bg-transparent border-b border-border py-3 text-lg font-medium focus:outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground/30 tracking-widest" />
                                </div>
                            </div>
                            {error && <p className="text-xs text-destructive">{error}</p>}
                            <button disabled={loading || phone.length < 10}
                                className="w-full bg-foreground text-background py-4 text-xs font-bold tracking-[0.2em] hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-8 group rounded-[5px]">
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <>SEND OTP <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>}
                            </button>
                        </form>
                    )}

                    {step === "otp" && (
                        <form onSubmit={verifyOtp} className="space-y-6">
                            {devCode && (
                                <div className="rounded-[5px] bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 text-center">
                                    Test mode — your OTP is <span className="font-bold">{devCode}</span>
                                </div>
                            )}
                            <input type="text" inputMode="numeric" maxLength={6} value={otp} autoFocus
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                placeholder="------"
                                className="w-full bg-muted/30 border border-border text-center text-2xl font-bold tracking-[0.6em] py-4 focus:outline-none focus:border-foreground rounded-[5px]" />
                            {error && <p className="text-xs text-destructive text-center">{error}</p>}
                            <div className="text-center">
                                {timer > 0 ? (
                                    <p className="text-[10px] text-muted-foreground tracking-wide">Resend code in <span className="text-foreground font-medium">{timer}s</span></p>
                                ) : (
                                    <button type="button" onClick={() => sendOtp()} className="text-[10px] uppercase tracking-widest font-bold border-b border-foreground pb-0.5 hover:opacity-60">Resend Code</button>
                                )}
                            </div>
                            <button disabled={loading || otp.length < 4}
                                className="w-full bg-foreground text-background py-4 text-xs font-bold tracking-[0.2em] hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 rounded-[5px]">
                                {loading ? <Loader2 size={16} className="animate-spin" /> : "VERIFY & CONTINUE"}
                            </button>
                            <button type="button" onClick={() => setStep("phone")} className="w-full text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground">Change Number</button>
                        </form>
                    )}

                    {step === "name" && (
                        <form onSubmit={saveName} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-muted-foreground">Full Name</label>
                                <input type="text" required value={name} autoFocus
                                    onChange={(e) => setName(e.target.value)} placeholder="ENTER YOUR NAME"
                                    className="w-full bg-transparent border-b border-border py-3 text-lg font-medium focus:outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground/30" />
                            </div>
                            {error && <p className="text-xs text-destructive">{error}</p>}
                            <button disabled={loading || !name.trim()}
                                className="w-full bg-foreground text-background py-4 text-xs font-bold tracking-[0.2em] hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 rounded-[5px]">
                                {loading ? <Loader2 size={16} className="animate-spin" /> : "FINISH"}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
