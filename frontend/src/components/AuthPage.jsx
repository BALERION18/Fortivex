import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCw,
  Sparkles
} from 'lucide-react';
import FlowableCanvas from './FlowableCanvas.jsx';
import { loginUser, registerUser } from '../api/client.js';

export default function AuthPage({ onAuthSuccess, onContinueGuest }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [agreedTerms, setAgreedTerms] = useState(true);

  async function handleLogin(e) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!loginIdentifier.trim() || !password) {
      setError('Please provide both email/username and password');
      return;
    }

    setIsLoading(true);
    try {
      const data = await loginUser(loginIdentifier, password);
      setSuccessMsg(`Welcome back, ${data.user.fullName || data.user.username}!`);
      setTimeout(() => {
        if (onAuthSuccess) onAuthSuccess(data.user);
      }, 700);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email.trim() || !username.trim() || !password) {
      setError('Please complete all required fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must contain at least 6 characters');
      return;
    }

    if (!agreedTerms) {
      setError('You must accept the open-source MIT License terms');
      return;
    }

    setIsLoading(true);
    try {
      const data = await registerUser({ fullName, email, username, password });
      setSuccessMsg(`Account created! Welcome to FORTIVEX, ${data.user.username}`);
      setTimeout(() => {
        if (onAuthSuccess) onAuthSuccess(data.user);
      }, 700);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen w-screen overflow-hidden bg-[#1e1e1e] flex items-center justify-center font-sans select-none">
      {/* 1. Interactive, Touchable, Playable Flowable Canvas Background */}
      <FlowableCanvas mode="flow" />

      {/* 2. Precision Box in Between */}
      <div className="relative z-10 w-full max-w-md p-4 sm:p-6 my-8">
        <div className="bg-[#252526]/90 backdrop-blur-xl border border-[#383838] shadow-2xl rounded-xl p-6 sm:p-8 space-y-6">
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-2 rounded-lg bg-[#1e1e1e] border border-[#383838] shadow-inner mb-1">
              <img
                src="/logo.png"
                alt="FORTIVEX Logo"
                className="h-10 w-10 object-contain rounded"
              />
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center justify-center">
              <span>FORTIVEX</span>
            </h1>
            <p className="text-xs text-[#8c8c8c]">
              GitHub Observability & Security Cockpit
            </p>
          </div>

          {/* Tab Switcher: Sign In vs Create Account */}
          <div className="grid grid-cols-2 p-1 bg-[#1e1e1e] rounded-lg border border-[#383838] text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`py-1.5 rounded transition ${
                authMode === 'login'
                  ? 'bg-[#2c2c2c] text-white shadow-sm font-semibold'
                  : 'text-[#8c8c8c] hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`py-1.5 rounded transition ${
                authMode === 'signup'
                  ? 'bg-[#2c2c2c] text-white shadow-sm font-semibold'
                  : 'text-[#8c8c8c] hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="p-3 bg-[#f24822]/10 border border-[#f24822]/40 rounded-lg text-xs text-[#f24822] flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-[#14ae5c]/10 border border-[#14ae5c]/40 rounded-lg text-xs text-emerald-300 flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-[#14ae5c]" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form: Sign In */}
          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-[#d4d4d4] mb-1">
                  Email or Username
                </label>
                <div className="relative flex items-center">
                  <User className="h-3.5 w-3.5 absolute left-3 text-[#0d99ff]" />
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="name@company.com or username"
                    className="w-full pl-9 pr-3 py-2 bg-[#1e1e1e] border border-[#383838] rounded-md text-xs text-white placeholder-[#666666] focus:outline-none focus:border-[#0d99ff] focus:ring-1 focus:ring-[#0d99ff]/40"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-medium text-[#d4d4d4]">
                    Password
                  </label>
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Password recovery is linked to your database credentials or backend admin.');
                    }}
                    className="text-[10px] text-[#0d99ff] hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative flex items-center">
                  <Lock className="h-3.5 w-3.5 absolute left-3 text-[#0d99ff]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-9 py-2 bg-[#1e1e1e] border border-[#383838] rounded-md text-xs text-white placeholder-[#666666] focus:outline-none focus:border-[#0d99ff] focus:ring-1 focus:ring-[#0d99ff]/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-[#8c8c8c] hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#8c8c8c]">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-[#383838] bg-[#1e1e1e] text-[#0d99ff] focus:ring-0"
                  />
                  <span>Remember this device</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-[#0d99ff] hover:bg-[#007be5] text-white font-medium rounded-md text-xs transition flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
              >
                {isLoading ? (
                  <RotateCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Cockpit</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Form: Create Account */}
          {authMode === 'signup' && (
            <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-[#d4d4d4] mb-1">
                  Full Name (Optional)
                </label>
                <div className="relative flex items-center">
                  <User className="h-3.5 w-3.5 absolute left-3 text-[#0d99ff]" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="w-full pl-9 pr-3 py-2 bg-[#1e1e1e] border border-[#383838] rounded-md text-xs text-white placeholder-[#666666] focus:outline-none focus:border-[#0d99ff] focus:ring-1 focus:ring-[#0d99ff]/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-[#d4d4d4] mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="alexdev"
                    className="w-full px-3 py-2 bg-[#1e1e1e] border border-[#383838] rounded-md text-xs text-white placeholder-[#666666] focus:outline-none focus:border-[#0d99ff] focus:ring-1 focus:ring-[#0d99ff]/40"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#d4d4d4] mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@company.com"
                    className="w-full px-3 py-2 bg-[#1e1e1e] border border-[#383838] rounded-md text-xs text-white placeholder-[#666666] focus:outline-none focus:border-[#0d99ff] focus:ring-1 focus:ring-[#0d99ff]/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#d4d4d4] mb-1">
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="h-3.5 w-3.5 absolute left-3 text-[#0d99ff]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-9 pr-9 py-2 bg-[#1e1e1e] border border-[#383838] rounded-md text-xs text-white placeholder-[#666666] focus:outline-none focus:border-[#0d99ff] focus:ring-1 focus:ring-[#0d99ff]/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-[#8c8c8c] hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#d4d4d4] mb-1">
                  Confirm Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="h-3.5 w-3.5 absolute left-3 text-[#0d99ff]" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full pl-9 pr-3 py-2 bg-[#1e1e1e] border border-[#383838] rounded-md text-xs text-white placeholder-[#666666] focus:outline-none focus:border-[#0d99ff] focus:ring-1 focus:ring-[#0d99ff]/40"
                  />
                </div>
              </div>

              <label className="flex items-center space-x-2 cursor-pointer text-[11px] text-[#8c8c8c] pt-1">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="rounded border-[#383838] bg-[#1e1e1e] text-[#0d99ff] focus:ring-0"
                />
                <span>I agree to FORTIVEX open-source MIT License terms</span>
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-[#0d99ff] hover:bg-[#007be5] text-white font-medium rounded-md text-xs transition flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
              >
                {isLoading ? (
                  <RotateCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Create FORTIVEX Account</span>
                    <Sparkles className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Guest / Bypass Button */}
          <div className="pt-2 border-t border-[#383838] flex items-center justify-center text-[11px] text-[#8c8c8c]">
            <button
              type="button"
              onClick={onContinueGuest}
              className="text-[#8c8c8c] hover:text-white transition flex items-center space-x-1"
            >
              <span>Continue as Guest</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
