'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/login', data);
      if (response.data.success) {
        login(response.data.data.token, response.data.data.user);
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err) {
      const errorResponse = err as { response?: { data?: { message?: string } } };
      setError(errorResponse.response?.data?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 dark:bg-slate-950 overflow-hidden font-sans">

      {/* LEFT — Hero Section (hidden on mobile, 55% on desktop) */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-16 overflow-hidden border-r border-white/5">

        {/* Background image: High-end luxury real estate villa */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-10000 hover:scale-105"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop')",
          }}
        />

        {/* Deep dark premium overlay with subtle gold hue */}
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/85 to-[#D4AF37]/15" />

        {/* Sophisticated noise texture for premium tactile feel */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Top logo */}
        <div className="relative z-10 flex items-center gap-4">
          <img
            src="/logo.png"
            alt="Ashvayana Developers Logo"
            className="h-20 w-auto object-contain filter drop-shadow-[0_2px_15px_rgba(212,175,55,0.2)]"
          />
          <span className="font-cinzel text-3xl font-semibold tracking-[2px] bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#AA7C11] bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(212,175,55,0.25)]">
            Ashvayana Developers
          </span>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-6 my-auto max-w-xl">
          {/* Decorative gold line */}
          <div className="flex items-center gap-4">
            <div className="h-[1px] w-16 bg-gradient-to-r from-[#D4AF37] to-transparent" />
            <span className="text-[#D4AF37] text-xs font-semibold tracking-[5px] uppercase">
              Exclusive Workspace
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl font-light text-white leading-[1.15] tracking-wide font-serif">
              Luxury Real Estate<br />Management Platform
            </h1>
            <p className="text-slate-400 text-lg font-light leading-relaxed max-w-md">
              An elite digital ecosystem designed for corporate executives, sales partners, and managing directors.
            </p>
          </div>
        </div>

        {/* Bottom footer for left side */}
        <div className="relative z-10">
          <p className="text-white/40 text-xs tracking-wider uppercase font-medium">
            &copy; {new Date().getFullYear()} Ashvayana. All rights reserved.
          </p>
        </div>

        {/* Decorative gold glow */}
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#D4AF37]/5 blur-[150px] pointer-events-none" />
      </div>

      {/* RIGHT — Login Card (45% on desktop, full width on mobile) */}
      <div className="flex-1 lg:w-[45%] flex items-center justify-center p-6 md:p-16 relative bg-[#040814]">

        {/* Luxury backdrop grid glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#040814] to-[#010206] pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-[#D4AF37]/5 blur-[120px] pointer-events-none" />

        <div className="w-full max-w-lg relative z-10">

          {/* Mobile logo (visible only on mobile/tablet) */}
          <div className="flex lg:hidden items-center justify-center gap-4 mb-12">
            <img
              src="/logo.png"
              alt="Ashvayana Developers Logo"
              className="h-20 w-auto object-contain filter drop-shadow-[0_2px_15px_rgba(212,175,55,0.2)]"
            />
            <span className="font-cinzel text-3xl font-semibold tracking-[2px] bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#AA7C11] bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(212,175,55,0.25)]">
              Ashvayana Developers
            </span>
          </div>

          {/* Elegant Glassmorphism card */}
          <div className="rounded-2xl border border-white/5 bg-slate-950/40 backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] p-8 md:p-12 space-y-10 relative overflow-hidden">
            
            {/* Elegant top border accent line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />

            {/* Header */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-[#D4AF37] text-xs font-semibold tracking-[4px] uppercase">Portal Authentication</span>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-[#D4AF37]/20 to-transparent" />
              </div>
              <h2 className="text-3xl font-extralight text-white tracking-wide font-serif">
                Welcome Back
              </h2>
              <p className="text-slate-400 text-sm font-light leading-relaxed">
                Provide your executive credentials to access the administrative control center.
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 text-center font-light">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

              {/* Email field */}
              <div className="space-y-2 group">
                <label className="text-[10px] font-semibold tracking-[2px] text-slate-400 uppercase block font-sans">
                  Corporate Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none group-focus-within:text-[#D4AF37] transition-colors duration-300" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@ashvayana.com"
                    {...register('email')}
                    className={`
                      w-full h-14 rounded-lg pl-12 pr-4
                      bg-black/30 border text-white text-sm tracking-wide font-sans
                      placeholder:text-slate-700
                      outline-none transition-all duration-300
                      focus:bg-black/50 focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/15
                      ${errors.email ? 'border-red-500/50 bg-red-500/5' : 'border-white/5'}
                    `}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-400 pl-1 font-light font-sans">{errors.email.message}</p>
                )}
              </div>

              {/* Password field */}
              <div className="space-y-2 group">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold tracking-[2px] text-slate-400 uppercase block font-sans">
                    Security Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none group-focus-within:text-[#D4AF37] transition-colors duration-300" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    {...register('password')}
                    className={`
                      w-full h-14 rounded-lg pl-12 pr-12
                      bg-black/30 border text-white text-sm tracking-wide font-sans
                      placeholder:text-slate-700
                      outline-none transition-all duration-300
                      focus:bg-black/50 focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/15
                      ${errors.password ? 'border-red-500/50 bg-red-500/5' : 'border-white/5'}
                    `}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#D4AF37] transition-colors duration-300 p-1"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-400 pl-1 font-light font-sans">{errors.password.message}</p>
                )}
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="
                  w-full h-14 rounded-lg font-medium text-xs uppercase tracking-[3px]
                  bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#AA7C11]
                  text-slate-950 hover:brightness-110 active:scale-[0.99]
                  transition-all duration-300
                  shadow-[0_4px_25px_rgba(212,175,55,0.15)] hover:shadow-[0_8px_30px_rgba(212,175,55,0.3)]
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100
                  flex items-center justify-center gap-2 cursor-pointer font-sans
                "
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                    Authenticating...
                  </>
                ) : (
                  'Secure Login'
                )}
              </button>

            </form>

            {/* Footer */}
            <div className="pt-4 text-center border-t border-white/5">
              <p className="text-[10px] text-slate-500 tracking-[1.5px] uppercase font-sans">
                Authorized Personnel Only
              </p>
            </div>

          </div>

          {/* External footer note */}
          <p className="text-center text-[10px] text-slate-600 mt-8 tracking-[1px] uppercase font-sans">
            Protected by multi-layer encryption &bull; Securing Ashvayana Estate Data
          </p>
        </div>
      </div>
    </div>
  );
}
