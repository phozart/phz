'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Authentication failed');
        return;
      }
      const redirectTo = searchParams.get('from') || '/';
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-root">
      <style>{`
        .login-root {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0a0908;
          overflow: hidden;
          font-family: system-ui, -apple-system, sans-serif;
        }

        /* Animated grid background */
        .login-grid-bg {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(249,115,22,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(249,115,22,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
          animation: gridPulse 8s ease-in-out infinite;
        }

        @keyframes gridPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }

        /* Radial glow behind the card */
        .login-glow {
          position: absolute;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%);
          pointer-events: none;
          animation: glowPulse 4s ease-in-out infinite;
        }

        @keyframes glowPulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 1; }
        }

        /* Horizontal scan line */
        .login-scanline {
          position: absolute;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(249,115,22,0.3), transparent);
          animation: scanMove 6s linear infinite;
          pointer-events: none;
        }

        @keyframes scanMove {
          0% { top: -2px; }
          100% { top: 100%; }
        }

        /* Card */
        .login-card {
          position: relative;
          width: 100%;
          max-width: 380px;
          padding: 2.5rem;
          border-radius: 12px;
          border: 1px solid rgba(249,115,22,0.15);
          background: rgba(28,25,23,0.85);
          backdrop-filter: blur(20px);
          box-shadow:
            0 0 40px rgba(249,115,22,0.06),
            0 0 80px rgba(0,0,0,0.4),
            inset 0 1px 0 rgba(255,255,255,0.03);
          opacity: 0;
          transform: translateY(16px);
          transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .login-card.mounted {
          opacity: 1;
          transform: translateY(0);
        }

        /* Card top accent line */
        .login-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 24px;
          right: 24px;
          height: 1px;
          background: linear-gradient(90deg, transparent, #f97316, transparent);
        }

        .login-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;
        }

        .login-logo-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 14px;
          color: white;
          letter-spacing: -0.5px;
          box-shadow: 0 0 20px rgba(249,115,22,0.3);
        }

        .login-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #fafaf9;
          letter-spacing: -0.02em;
        }

        .login-title span {
          color: #f97316;
        }

        .login-subtitle {
          font-size: 0.8rem;
          color: #78716c;
          margin-bottom: 2rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        /* Input */
        .login-input-wrap {
          position: relative;
        }

        .login-input {
          width: 100%;
          padding: 0.7rem 0.9rem 0.7rem 2.4rem;
          border-radius: 8px;
          border: 1px solid #44403c;
          background: rgba(10,9,8,0.6);
          color: #fafaf9;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }

        .login-input::placeholder {
          color: #57534e;
        }

        .login-input:focus {
          border-color: rgba(249,115,22,0.5);
          box-shadow: 0 0 0 3px rgba(249,115,22,0.08);
        }

        .login-input-icon {
          position: absolute;
          left: 0.8rem;
          top: 50%;
          transform: translateY(-50%);
          color: #57534e;
          font-size: 0.85rem;
          pointer-events: none;
        }

        /* Error */
        .login-error {
          font-size: 0.8rem;
          color: #f87171;
          margin-top: 0.6rem;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Button */
        .login-btn {
          width: 100%;
          margin-top: 1.25rem;
          padding: 0.7rem 1rem;
          border-radius: 8px;
          border: none;
          font-size: 0.875rem;
          font-weight: 600;
          color: white;
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
          letter-spacing: 0.02em;
        }

        .login-btn:hover:not(:disabled) {
          box-shadow: 0 0 24px rgba(249,115,22,0.35);
          transform: translateY(-1px);
        }

        .login-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* Button shimmer effect */
        .login-btn::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
          animation: btnShimmer 3s ease-in-out infinite;
        }

        @keyframes btnShimmer {
          0% { left: -100%; }
          50%, 100% { left: 100%; }
        }

        /* Corner decorations */
        .login-corner {
          position: absolute;
          width: 12px;
          height: 12px;
          border-color: rgba(249,115,22,0.25);
          border-style: solid;
          border-width: 0;
        }
        .login-corner.tl { top: -1px; left: -1px; border-top-width: 1px; border-left-width: 1px; border-radius: 12px 0 0 0; }
        .login-corner.tr { top: -1px; right: -1px; border-top-width: 1px; border-right-width: 1px; border-radius: 0 12px 0 0; }
        .login-corner.bl { bottom: -1px; left: -1px; border-bottom-width: 1px; border-left-width: 1px; border-radius: 0 0 0 12px; }
        .login-corner.br { bottom: -1px; right: -1px; border-bottom-width: 1px; border-right-width: 1px; border-radius: 0 0 12px 0; }

        /* Floating particles */
        .login-particle {
          position: absolute;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          background: rgba(249,115,22,0.4);
          pointer-events: none;
        }

        .login-particle:nth-child(1) { top: 20%; left: 15%; animation: float 7s ease-in-out infinite; }
        .login-particle:nth-child(2) { top: 60%; left: 80%; animation: float 9s ease-in-out infinite 1s; }
        .login-particle:nth-child(3) { top: 80%; left: 25%; animation: float 11s ease-in-out infinite 2s; }
        .login-particle:nth-child(4) { top: 30%; left: 70%; animation: float 8s ease-in-out infinite 3s; }
        .login-particle:nth-child(5) { top: 50%; left: 50%; animation: float 10s ease-in-out infinite 0.5s; }

        @keyframes float {
          0%, 100% { transform: translate(0, 0); opacity: 0.3; }
          25% { transform: translate(20px, -30px); opacity: 0.8; }
          50% { transform: translate(-10px, -60px); opacity: 0.4; }
          75% { transform: translate(30px, -20px); opacity: 0.7; }
        }

        /* Footer text */
        .login-footer {
          margin-top: 1.5rem;
          text-align: center;
          font-size: 0.65rem;
          color: #44403c;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
      `}</style>

      {/* Background effects */}
      <div className="login-grid-bg" />
      <div className="login-glow" />
      <div className="login-scanline" />
      <div className="login-particle" />
      <div className="login-particle" />
      <div className="login-particle" />
      <div className="login-particle" />
      <div className="login-particle" />

      {/* Card */}
      <div className={`login-card ${mounted ? 'mounted' : ''}`}>
        <div className="login-corner tl" />
        <div className="login-corner tr" />
        <div className="login-corner bl" />
        <div className="login-corner br" />

        <div className="login-logo">
          <div className="login-logo-icon">PHZ</div>
          <div className="login-title">
            Report <span>Studio</span>
          </div>
        </div>
        <p className="login-subtitle">Authenticated access required</p>

        <form onSubmit={handleSubmit}>
          <div className="login-input-wrap">
            <span className="login-input-icon">&#9919;</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter access key"
              autoFocus
              className="login-input"
            />
          </div>

          {error && (
            <p className="login-error">
              <span>&#9888;</span> {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="login-btn"
          >
            {loading ? 'Authenticating...' : 'Authenticate'}
          </button>
        </form>

        <p className="login-footer">Secure session &middot; 30-day expiry</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
