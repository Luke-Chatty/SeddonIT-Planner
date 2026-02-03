"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Lock, Mail, ShieldAlert } from "lucide-react";
import Image from "next/image";


export default function LoginPage() {
    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [adminEmail, setAdminEmail] = useState("");
    const [adminPassword, setAdminPassword] = useState("");
    const [error, setError] = useState("");

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            const res = await signIn("credentials", {
                email: adminEmail,
                password: adminPassword,
                redirect: true,
                callbackUrl: "/"
            });

            if (res?.error) {
                setError("Invalid admin credentials");
            }
        } catch (err) {
            setError("Something went wrong");
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:bg-[#001524] relative font-sans selection:bg-[#ed1c24]/30 transition-colors duration-300">
            {/* Background Grain/Subtle Glow */}
            <div className="absolute inset-0 bg-[url('/grain.png')] opacity-[0.03] pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#022943]/5 dark:bg-blue-500/10 blur-[120px] rounded-full pointer-events-none"></div>

            {/* Logo Placement */}
            <div className="mb-10 relative z-30 group">
                {/* Subtle Glow behind logo */}
                <div className="absolute inset-0 bg-[#ed1c24]/20 dark:bg-blue-400/20 blur-3xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

                <div className="relative w-[300px] h-[80px]">
                    <Image
                        src="/seddon-logo-white.png"
                        alt="Seddon Logo"
                        fill
                        className="object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-105 dark:brightness-100 brightness-0"
                        priority
                        unoptimized
                    />
                </div>
            </div>

            {/* Main Card */}
            <div className="bg-white dark:bg-[#022943] rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] w-full max-w-[440px] overflow-hidden flex flex-col relative z-10 border border-slate-200 dark:border-white/10 transition-all duration-300">
                <div className="p-10 pb-6 flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-1 w-8 bg-[#ed1c24] rounded-full"></div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ed1c24]/70 dark:text-[#ed1c24]">Secure Portal</span>
                        <div className="h-1 w-8 bg-[#ed1c24] rounded-full"></div>
                    </div>

                    <h2 className="text-3xl font-extrabold text-[#022943] dark:text-white mb-8 tracking-tight text-center">
                        Project Workspace <span className="text-[#ed1c24]">Manager</span>
                    </h2>

                    {!showAdminLogin ? (
                        <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <Button
                                className="w-full h-14 bg-slate-50 dark:bg-white border border-slate-200 dark:border-gray-200 text-[#022943] dark:text-gray-700 hover:bg-slate-100 dark:hover:bg-gray-50 hover:border-slate-300 dark:hover:border-gray-300 transition-all duration-300 font-bold text-[16px] flex items-center justify-center gap-4 shadow-sm rounded-xl group relative overflow-hidden active:scale-[0.98]"
                                onClick={() => signIn('azure-ad', { callbackUrl: '/' })}
                            >
                                <div className="relative flex items-center gap-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 23 23">
                                        <path fill="#f35325" d="M1 1h10v10H1z" />
                                        <path fill="#81bc06" d="M12 1h10v10H12z" />
                                        <path fill="#05a6f0" d="M1 12h10v10H1z" />
                                        <path fill="#ffba08" d="M12 12h10v10H12z" />
                                    </svg>
                                    <span>Sign in with Microsoft</span>
                                </div>
                            </Button>

                            <div className="flex items-center justify-center pt-4">
                                <button
                                    onClick={() => setShowAdminLogin(true)}
                                    className="group flex items-center gap-2 text-sm font-semibold text-slate-400 dark:text-slate-400 hover:text-[#ed1c24] dark:hover:text-[#ed1c24] transition-all duration-300"
                                >
                                    <ShieldAlert className="w-4 h-4 transition-transform group-hover:rotate-12" />
                                    <span className="border-b border-transparent group-hover:border-[#ed1c24]">Admin Access</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleAdminLogin} className="w-full space-y-5 animate-in fade-in zoom-in-95 duration-300">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                                        <Mail className="w-3 h-3" />
                                        Admin Email
                                    </label>
                                    <div className="relative">
                                        <Input
                                            type="email"
                                            value={adminEmail}
                                            onChange={(e) => setAdminEmail(e.target.value)}
                                            className="h-12 border-slate-200 dark:border-gray-200 bg-slate-50/50 dark:bg-gray-50/50 focus:bg-white dark:focus:bg-white focus:ring-2 focus:ring-[#ed1c24]/10 rounded-xl transition-all pl-4 text-[#022943] dark:text-gray-900 font-medium"
                                            placeholder="admin@seddon.co.uk"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                                        <Lock className="w-3 h-3" />
                                        Secure Token
                                    </label>
                                    <div className="relative">
                                        <Input
                                            type="password"
                                            value={adminPassword}
                                            onChange={(e) => setAdminPassword(e.target.value)}
                                            className="h-12 border-slate-200 dark:border-gray-200 bg-slate-50/50 dark:bg-gray-50/50 focus:bg-white dark:focus:bg-white focus:ring-2 focus:ring-[#ed1c24]/10 rounded-xl transition-all pl-4 text-[#022943] dark:text-gray-900 font-medium"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-bold flex items-center gap-2 animate-bounce-short">
                                    <ShieldAlert className="w-4 h-4" />
                                    {error}
                                </div>
                            )}

                            <div className="pt-2 flex flex-col gap-4">
                                <Button
                                    type="submit"
                                    className="w-full h-12 bg-[#022943] hover:bg-[#033a5f] text-white font-bold rounded-xl shadow-lg shadow-[#022943]/20 transition-all active:scale-[0.98]"
                                >
                                    Verify Credentials
                                </Button>
                                <button
                                    type="button"
                                    onClick={() => { setShowAdminLogin(false); setError(""); }}
                                    className="flex items-center justify-center gap-1 text-sm font-semibold text-slate-400 dark:text-slate-400 hover:text-[#022943] dark:hover:text-slate-200 transition-colors py-2"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Back to Single Sign-On
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Bottom Color Stripe - Seddon Corporate Colors */}
                <div className="h-2.5 w-full flex mt-6">
                    <div className="flex-1 bg-[#30b996]"></div> {/* Turquoise */}
                    <div className="flex-1 bg-[#e8bf1e]"></div> {/* Yellow */}
                    <div className="flex-1 bg-[#804097]"></div> {/* Purple */}
                    <div className="flex-1 bg-[#4ebec7]"></div> {/* Sky Blue */}
                    <div className="flex-1 bg-[#ce167c]"></div> {/* Magenta */}
                    <div className="flex-1 bg-[#f58720]"></div> {/* Orange */}
                </div>
            </div>

            {/* Footer */}
            <div className="mt-12 text-center relative z-10">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-[0.3em] opacity-60">
                    Seddon Project Workspace &bull; Seddon IT Department
                </p>
            </div>
        </div>
    );
}
