import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_NAME } from '../data/demo';

const TICKERS_ROW1 = [
  { sym: '$NVDA', change: '+4.2%', price: '892.40' },
  { sym: '$AAPL', change: '+1.1%', price: '189.30' },
  { sym: '$TSLA', change: '-2.3%', price: '172.10' },
  { sym: '$MSFT', change: '+0.8%', price: '415.20' },
  { sym: '$QQQ',  change: '+1.4%', price: '444.80' },
  { sym: '$SPY',  change: '+0.6%', price: '521.30' },
  { sym: '$XLE',  change: '-0.9%', price: '91.40'  },
  { sym: '$AMZN', change: '+2.1%', price: '182.60' },
  { sym: '$GOOG', change: '+1.7%', price: '165.80' },
  { sym: '$META', change: '+3.2%', price: '492.10' },
];

const TICKERS_ROW2 = [
  { sym: '$JPM',   change: '+0.5%', price: '198.20' },
  { sym: '$GS',    change: '-0.4%', price: '441.70' },
  { sym: '$BRK.B', change: '+1.2%', price: '367.40' },
  { sym: '$AMD',   change: '+3.8%', price: '164.90' },
  { sym: '$COIN',  change: '-5.1%', price: '181.30' },
  { sym: '$PLTR',  change: '+2.6%', price: '24.80'  },
  { sym: '$NFLX',  change: '+1.9%', price: '628.50' },
  { sym: '$DIS',   change: '-0.7%', price: '113.20' },
];

const TICKERS_ROW3 = [
  { sym: '$UBER', change: '+1.3%', price: '71.20'  },
  { sym: '$SNAP', change: '-3.2%', price: '11.40'  },
  { sym: '$SHOP', change: '+2.4%', price: '74.80'  },
  { sym: '$SQ',   change: '-1.8%', price: '62.30'  },
  { sym: '$PYPL', change: '+0.9%', price: '63.90'  },
  { sym: '$RBLX', change: '+4.1%', price: '38.70'  },
  { sym: '$SPOT', change: '+2.0%', price: '291.40' },
  { sym: '$V',    change: '+0.4%', price: '274.80' },
];

const TICKERS_ROW4 = [
  { sym: '$WMT',  change: '+0.3%', price: '68.90'  },
  { sym: '$BA',   change: '-1.5%', price: '193.40' },
  { sym: '$F',    change: '+2.2%', price: '12.80'  },
  { sym: '$GM',   change: '+1.0%', price: '47.60'  },
  { sym: '$INTC', change: '-2.7%', price: '31.20'  },
  { sym: '$T',    change: '+0.6%', price: '17.40'  },
  { sym: '$VZ',   change: '-0.3%', price: '40.10'  },
  { sym: '$PFE',  change: '+1.1%', price: '28.60'  },
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
      background: '#0a1f10',
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
        .tf-ticker-l {
          display: flex;
          width: max-content;
          animation: ticker-fwd 40s linear infinite;
        }
        .tf-ticker-r {
          display: flex;
          width: max-content;
          animation: ticker-rev 55s linear infinite;
        }
        .tf-field input {
          width: 100%;
          padding: 10px 13px;
          border-radius: 6px;
          border: 0.5px solid rgba(255,255,255,0.08);
          background: rgba(0,0,0,0.3);
          backdrop-filter: blur(4px);
          font-size: 14px;
          color: #c8c8c8;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: border-color 0.15s;
          box-sizing: border-box;
        }
        .tf-field input::placeholder { color: #2e2e2e; }
        .tf-field input:focus { border-color: rgba(34,197,94,0.4); }
        .tf-cta {
          width: 100%;
          padding: 12px;
          border-radius: 6px;
          background: #22c55e;
          color: #000;
          font-size: 14px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          letter-spacing: 0.01em;
          transition: background 0.15s;
          box-shadow: 0 4px 18px rgba(34,197,94,0.25);
        }
        .tf-cta:hover { background: #1ea34a; }
        .tf-oauth {
          width: 100%;
          padding: 10px;
          border-radius: 6px;
          border: 0.5px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          font-size: 13px;
          color: #888;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          transition: border-color 0.15s;
        }
        .tf-oauth:hover { border-color: rgba(255,255,255,0.2); }
      `}</style>

      {/* Radial green glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 45%, rgba(34,197,94,0.15) 0%, transparent 65%)',
      }} />

      {/* Animated ticker bands */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-around',
        pointerEvents: 'none',
      }}>
        {[
          { data: TICKERS_ROW1, cls: 'tf-ticker-l' },
          { data: TICKERS_ROW2, cls: 'tf-ticker-r' },
          { data: TICKERS_ROW3, cls: 'tf-ticker-l' },
          { data: TICKERS_ROW4, cls: 'tf-ticker-r' },
        ].map(({ data, cls }, ri) => (
          <div key={ri} style={{ borderTop: '1px solid rgba(34,197,94,0.04)', borderBottom: '1px solid rgba(34,197,94,0.04)', padding: '8px 0', overflow: 'hidden' }}>
            <div className={cls}>
              {[...data, ...data].map(({ sym, change, price }, i) => (
                <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 20px', borderRight: '1px solid rgba(34,197,94,0.05)', flexShrink: 0 }}>
                  <span style={{ fontFamily: "'Courier New', monospace", fontSize: 12, fontWeight: 600, color: 'rgba(34,197,94,0.25)' }}>{sym}</span>
                  <span style={{ fontFamily: "'Courier New', monospace", fontSize: 12, color: 'rgba(34,197,94,0.25)' }}>{change}</span>
                  <span style={{ fontFamily: "'Courier New', monospace", fontSize: 11, color: 'rgba(34,197,94,0.25)' }}>{price}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Auth card */}
      <div style={{
        position: 'relative', zIndex: 2,
        width: '100%', maxWidth: 400,
        margin: '0 16px',
        background: 'rgba(10,20,13,0.8)',
        border: '0.5px solid rgba(34,197,94,0.1)',
        borderTop: '1px solid rgba(34,197,94,0.3)',
        borderRadius: 12,
        padding: 28,
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        display: 'flex', flexDirection: 'column', gap: 20,
        boxShadow: '0 0 80px rgba(34,197,94,0.07)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: 'linear-gradient(135deg, #16a34a, #22c55e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 14px rgba(34,197,94,0.4)',
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
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: 3 }}>
          {(['signin', 'signup'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '8px', border: 'none', cursor: 'pointer',
                borderRadius: 4,
                fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600,
                background: tab === t ? '#22c55e' : 'transparent',
                color: tab === t ? '#000' : '#555',
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
              <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.4)' }}>Email</label>
              <input type="email" placeholder="you@example.com" required />
            </div>
            <div className="tf-field" style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.4)' }}>Password</label>
              <input type="password" placeholder="••••••••" required />
              <a style={{ fontSize: 12, color: '#22c55e', textAlign: 'right', cursor: 'pointer', marginTop: 2 }}>Forgot password?</a>
            </div>
            <button type="submit" className="tf-cta">Sign in</button>
            <Divider />
            <GoogleButton label="Continue with Google" />
          </form>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="tf-field" style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.4)' }}>Full name</label>
              <input type="text" placeholder="Jamie D." required />
            </div>
            <div className="tf-field" style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.4)' }}>Email</label>
              <input type="email" placeholder="you@example.com" required />
            </div>
            <div className="tf-field" style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.4)' }}>Password</label>
              <input type="password" placeholder="Min. 8 characters" required />
            </div>
            <button type="submit" className="tf-cta">Create account</button>
            <Divider />
            <GoogleButton label="Sign up with Google" />
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center', lineHeight: 1.5 }}>
              By signing up you agree to our{' '}
              <a href="#" style={{ color: 'rgba(255,255,255,0.45)' }}>Terms</a>{' '}and{' '}
              <a href="#" style={{ color: 'rgba(255,255,255,0.45)' }}>Privacy Policy</a>
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
      <div style={{ flex: 1, height: '0.5px', background: 'rgba(255,255,255,0.07)' }} />
      <span style={{ fontSize: 12, color: '#2e2e2e' }}>or</span>
      <div style={{ flex: 1, height: '0.5px', background: 'rgba(255,255,255,0.07)' }} />
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
