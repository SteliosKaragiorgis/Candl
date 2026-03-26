import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_NAME } from '../data/demo';

const TICKERS_ROW1 = [
  { sym: '$NVDA', change: '+4.2%', price: '892.40', up: true },
  { sym: '$AAPL', change: '+1.1%', price: '189.30', up: true },
  { sym: '$TSLA', change: '-2.3%', price: '172.10', up: false },
  { sym: '$MSFT', change: '+0.8%', price: '415.20', up: true },
  { sym: '$QQQ',  change: '+1.4%', price: '444.80', up: true },
  { sym: '$SPY',  change: '+0.6%', price: '521.30', up: true },
  { sym: '$XLE',  change: '-0.9%', price: '91.40',  up: false },
  { sym: '$AMZN', change: '+2.1%', price: '182.60', up: true },
  { sym: '$GOOG', change: '+1.7%', price: '165.80', up: true },
  { sym: '$META', change: '+3.2%', price: '492.10', up: true },
];

const TICKERS_ROW2 = [
  { sym: '$JPM',   change: '+0.5%', price: '198.20', up: true },
  { sym: '$GS',    change: '-0.4%', price: '441.70', up: false },
  { sym: '$BRK.B', change: '+1.2%', price: '367.40', up: true },
  { sym: '$AMD',   change: '+3.8%', price: '164.90', up: true },
  { sym: '$COIN',  change: '-5.1%', price: '181.30', up: false },
  { sym: '$PLTR',  change: '+2.6%', price: '24.80',  up: true },
  { sym: '$NFLX',  change: '+1.9%', price: '628.50', up: true },
  { sym: '$DIS',   change: '-0.7%', price: '113.20', up: false },
];

const TICKERS_ROW3 = [
  { sym: '$UBER', change: '+1.3%', price: '71.20',  up: true },
  { sym: '$SNAP', change: '-3.2%', price: '11.40',  up: false },
  { sym: '$SHOP', change: '+2.4%', price: '74.80',  up: true },
  { sym: '$SQ',   change: '-1.8%', price: '62.30',  up: false },
  { sym: '$PYPL', change: '+0.9%', price: '63.90',  up: true },
  { sym: '$RBLX', change: '+4.1%', price: '38.70',  up: true },
  { sym: '$SPOT', change: '+2.0%', price: '291.40', up: true },
  { sym: '$V',    change: '+0.4%', price: '274.80', up: true },
];

type Tab = 'signin' | 'signup';

export default function SignInPage() {
  const [tab, setTab] = useState<Tab>('signin');
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate('/');
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#070b14',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes ticker-fwd {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes ticker-rev {
          0%   { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .tf-ticker-fwd {
          display: flex;
          width: max-content;
          animation: ticker-fwd 30s linear infinite;
        }
        .tf-ticker-rev {
          display: flex;
          width: max-content;
          animation: ticker-rev 24s linear infinite;
        }
        .tf-ticker-fwd2 {
          display: flex;
          width: max-content;
          animation: ticker-fwd 36s linear infinite;
        }
        .tf-field input {
          width: 100%;
          padding: 10px 13px;
          border-radius: 9px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          font-size: 14px;
          color: #fff;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: border-color 0.15s;
        }
        .tf-field input::placeholder { color: rgba(255,255,255,0.22); }
        .tf-field input:focus { border-color: rgba(0,71,255,0.7); }
        .tf-cta {
          width: 100%;
          padding: 12px;
          border-radius: 10px;
          background: linear-gradient(135deg, #0047FF, #2563eb);
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          letter-spacing: 0.01em;
          transition: opacity 0.15s;
          box-shadow: 0 4px 18px rgba(0,71,255,0.35);
        }
        .tf-cta:hover { opacity: 0.88; }
        .tf-oauth {
          width: 100%;
          padding: 10px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          font-size: 13px;
          color: rgba(255,255,255,0.85);
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          transition: background 0.15s;
        }
        .tf-oauth:hover { background: rgba(255,255,255,0.09); }
      `}</style>

      {/* Radial blue glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 45%, rgba(0,71,255,0.14) 0%, transparent 65%)',
      }} />

      {/* Animated ticker bands */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-around',
        opacity: 0.14, pointerEvents: 'none',
      }}>
        {/* Row 1 — forward */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '8px 0', overflow: 'hidden' }}>
          <div className="tf-ticker-fwd">
            {[...TICKERS_ROW1, ...TICKERS_ROW1].map(({ sym, change, price, up }, i) => (
              <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 20px', borderRight: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600, color: '#fff' }}>{sym}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: up ? '#4ade80' : '#f87171' }}>{up ? '▲' : '▼'} {change}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{price}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Row 2 — reverse */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '8px 0', overflow: 'hidden' }}>
          <div className="tf-ticker-rev">
            {[...TICKERS_ROW2, ...TICKERS_ROW2].map(({ sym, change, price, up }, i) => (
              <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 20px', borderRight: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600, color: '#fff' }}>{sym}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: up ? '#4ade80' : '#f87171' }}>{up ? '▲' : '▼'} {change}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{price}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Row 3 — forward (slower) */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '8px 0', overflow: 'hidden' }}>
          <div className="tf-ticker-fwd2">
            {[...TICKERS_ROW3, ...TICKERS_ROW3].map(({ sym, change, price, up }, i) => (
              <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 20px', borderRight: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600, color: '#fff' }}>{sym}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: up ? '#4ade80' : '#f87171' }}>{up ? '▲' : '▼'} {change}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{price}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Auth card */}
      <div style={{
        position: 'relative', zIndex: 2,
        width: '100%', maxWidth: 400,
        margin: '0 16px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 18,
        padding: '32px 28px',
        backdropFilter: 'blur(2px)',
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: 'linear-gradient(135deg, #2563EB, #0EA5E9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 14px rgba(37,99,235,0.45)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <line x1="5"  y1="2"  x2="5"  y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
              <rect x="3"   y="7"   width="4" height="10" rx="1" fill="white" opacity="0.5"/>
              <line x1="12" y1="1"  x2="12" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <rect x="10"  y="5"   width="4" height="12" rx="1" fill="white"/>
              <line x1="19" y1="3"  x2="19" y2="21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <rect x="17"  y="7"   width="4" height="9"  rx="1" fill="white" opacity="0.85"/>
            </svg>
          </div>
          <span style={{ fontFamily: "'Trebuchet MS', sans-serif", fontWeight: 700, fontSize: 22, color: '#fff', letterSpacing: '-0.5px' }}>
            {APP_NAME}
          </span>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, overflow: 'hidden',
        }}>
          {(['signin', 'signup'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '9px', border: 'none', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600,
                background: tab === t ? '#0047FF' : 'transparent',
                color: tab === t ? '#fff' : 'rgba(255,255,255,0.45)',
                transition: 'all 0.15s',
              }}
            >
              {t === 'signin' ? 'Sign in' : 'Sign up'}
            </button>
          ))}
        </div>

        {/* Forms */}
        {tab === 'signin' ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="tf-field" style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.55)' }}>Email</label>
              <input type="email" placeholder="you@example.com" required />
            </div>
            <div className="tf-field" style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.55)' }}>Password</label>
              <input type="password" placeholder="••••••••" required />
              <a style={{ fontSize: 12, color: '#60a5fa', textAlign: 'right', cursor: 'pointer', marginTop: 2 }}>Forgot password?</a>
            </div>
            <button type="submit" className="tf-cta">Sign in</button>
            <Divider />
            <GoogleButton label="Continue with Google" />
          </form>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="tf-field" style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.55)' }}>Full name</label>
              <input type="text" placeholder="Jamie D." required />
            </div>
            <div className="tf-field" style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.55)' }}>Email</label>
              <input type="email" placeholder="you@example.com" required />
            </div>
            <div className="tf-field" style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.55)' }}>Password</label>
              <input type="password" placeholder="Min. 8 characters" required />
            </div>
            <button type="submit" className="tf-cta">Create account</button>
            <Divider />
            <GoogleButton label="Sign up with Google" />
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', textAlign: 'center', lineHeight: 1.5 }}>
              By signing up you agree to our{' '}
              <a href="#" style={{ color: 'rgba(255,255,255,0.5)' }}>Terms</a>{' '}and{' '}
              <a href="#" style={{ color: 'rgba(255,255,255,0.5)' }}>Privacy Policy</a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)' }}>or</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
    </div>
  );
}

function GoogleButton({ label }: { label: string }) {
  const navigate = useNavigate();

  return (
    <button type="button" className="tf-oauth" onClick={() => navigate('/')}>
      <svg width="16" height="16" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      {label}
    </button>
  );
}
