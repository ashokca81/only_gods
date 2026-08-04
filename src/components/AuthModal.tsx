"use client";

import React, { useState, useEffect } from "react";
import { X, ArrowRight, Loader2 } from "lucide-react";
import { useUI } from "@/buffer/UIContext";

const AuthModal = () => {
    const { isAuthModalOpen, closeAuthModal, authView, setAuthView } = useUI();
    const [step, setStep] = useState<"phone" | "otp">("phone");
    const [loading, setLoading] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [otp, setOtp] = useState(["", "", "", ""]);
    const [timer, setTimer] = useState(30);

    // Reset state when modal opens/closes or view changes
    useEffect(() => {
        if (!isAuthModalOpen) {
            setStep("phone");
            setPhoneNumber("");
            setOtp(["", "", "", ""]);
            setLoading(false);
        }
    }, [isAuthModalOpen, authView]);

    // Timer for OTP resend
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (step === "otp" && timer > 0) {
            interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [step, timer]);

    if (!isAuthModalOpen) return null;

    const handleSendOtp = (e: React.FormEvent) => {
        e.preventDefault();
        if (!phoneNumber) return;

        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            setStep("otp");
            setTimer(30);
        }, 1500);
    };

    const handleVerifyOtp = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate verification
        setTimeout(() => {
            setLoading(false);
            closeAuthModal();
        }, 1500);
    };

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 3) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            prevInput?.focus();
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-end lg:items-center justify-center p-0 lg:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="relative w-full lg:max-w-sm bg-card border-t lg:border border-border shadow-2xl overflow-hidden rounded-t-2xl lg:rounded-lg animate-in slide-in-from-bottom duration-300 lg:animate-in lg:fade-in lg:zoom-in-95 lg:slide-in-from-bottom-0"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={closeAuthModal}
                    className="absolute right-4 top-4 p-2 hover:bg-muted transition-colors z-10 rounded-full"
                >
                    <X size={20} />
                </button>

                <div className="p-8 pt-12 pb-12 lg:pb-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h2 className="text-xl font-black tracking-[0.2em] uppercase mb-2">
                            {authView === "login" ? "Welcome Back" : "Join the Elite"}
                        </h2>
                        <p className="text-xs text-muted-foreground tracking-wide">
                            {step === "phone"
                                ? "Enter your mobile number to continue"
                                : `Enter the code sent to +91 ${phoneNumber}`
                            }
                        </p>
                    </div>

                    {step === "phone" ? (
                        <form onSubmit={handleSendOtp} className="space-y-6">
                            {authView === "register" && (
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-muted-foreground">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="ENTER YOUR NAME"
                                        className="w-full bg-transparent border-b border-border py-3 text-lg font-medium focus:outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground/30"
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-muted-foreground">
                                    Mobile Number
                                </label>
                                <div className="flex gap-4">
                                    <span className="py-3 border-b border-border text-lg font-medium text-muted-foreground">
                                        +91
                                    </span>
                                    <input
                                        type="tel"
                                        required
                                        value={phoneNumber}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            if (val.length <= 10) setPhoneNumber(val);
                                        }}
                                        placeholder="00000 00000"
                                        className="flex-1 bg-transparent border-b border-border py-3 text-lg font-medium focus:outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground/30 tracking-widest"
                                    />
                                </div>
                            </div>

                            <button
                                disabled={loading || phoneNumber.length < 10}
                                className="w-full bg-foreground text-background py-4 text-xs font-bold tracking-[0.2em] hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-8 group"
                            >
                                {loading ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <>
                                        SEND OTP
                                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-8">
                            <div className="flex justify-between gap-2">
                                {otp.map((digit, i) => (
                                    <input
                                        key={i}
                                        id={`otp-${i}`}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(i, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(i, e)}
                                        className="w-12 h-14 bg-muted/30 border border-border text-center text-xl font-bold focus:outline-none focus:border-foreground focus:bg-background transition-all rounded-sm"
                                    />
                                ))}
                            </div>

                            <div className="text-center">
                                {timer > 0 ? (
                                    <p className="text-[10px] text-muted-foreground tracking-wide">
                                        Resend code in <span className="text-foreground font-medium">{timer}s</span>
                                    </p>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => { setTimer(30); }}
                                        className="text-[10px] uppercase tracking-widest font-bold border-b border-foreground pb-0.5 hover:opacity-60 transition-opacity"
                                    >
                                        Resend Code
                                    </button>
                                )}
                            </div>

                            <button
                                disabled={loading || otp.join("").length < 4}
                                className="w-full bg-foreground text-background py-4 text-xs font-bold tracking-[0.2em] hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    "VERIFY & PROCEED"
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep("phone")}
                                className="w-full text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Change Number
                            </button>
                        </form>
                    )}

                    {/* Toggle Login/Register */}
                    <div className="mt-8 pt-6 border-t border-border text-center">
                        <p className="text-xs text-muted-foreground">
                            {authView === "login" ? "New to Only Gods?" : "Already have an account?"}
                            <button
                                onClick={() => {
                                    setAuthView(authView === "login" ? "register" : "login");
                                    setStep("phone");
                                }}
                                className="ml-2 font-bold text-foreground hover:underline tracking-wide uppercase text-[10px]"
                            >
                                {authView === "login" ? "Create Account" : "Sign In"}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
