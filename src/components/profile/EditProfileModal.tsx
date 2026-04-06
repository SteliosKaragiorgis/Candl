import { useState } from 'react';
import type { User } from '../../types';


function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!on)}
      style={{
        width: 44, height: 24, borderRadius: 12, flexShrink: 0,
        background: on ? 'var(--blue)' : 'var(--border2)',
        position: 'relative', cursor: 'pointer',
        transition: 'background 0.2s',
      }}
    >
      <div style={{
        position: 'absolute', top: 3,
        left: on ? 23 : 3,
        width: 18, height: 18, borderRadius: '50%',
        background: '#e8e8e8',
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </div>
  );
}

export default function EditProfileModal({
  user,
  onClose,
}: {
  user: User;
  onClose: () => void;
}) {
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio);
  const [location, setLocation] = useState('New York, US');
  const [website, setWebsite] = useState('https://');
  const [tags, setTags] = useState(user.mostActive.split(' · '));
  const [tagInput, setTagInput] = useState('');
  const [experience, setExperience] = useState('Learning');
  const [privacyPublic, setPrivacyPublic] = useState(true);
  const [showSectors, setShowSectors] = useState(true);
  const [allowMessages, setAllowMessages] = useState(false);


  function removeTag(tag: string) {
    setTags(prev => prev.filter(t => t !== tag));
  }

  function addTag(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && tagInput.trim()) {
      setTags(prev => [...prev, tagInput.trim()]);
      setTagInput('');
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '10px 12px',
    fontSize: 13, color: 'var(--text)',
    fontFamily: 'Inter, sans-serif', outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12, color: 'var(--text-2)', marginBottom: 6, display: 'block',
  };

  const sectionStyle: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 14, overflow: 'hidden', marginBottom: 12,
  };

  const sectionHeaderStyle: React.CSSProperties = {
    fontSize: 9, fontWeight: 700, letterSpacing: 2, color: 'var(--text4)',
    textTransform: 'uppercase', padding: '12px 18px',
    borderBottom: '1px solid var(--border)',
  };

  const sectionBodyStyle: React.CSSProperties = {
    padding: '18px',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      overflowY: 'auto', padding: '24px 16px',
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%', maxWidth: 680,
        background: 'var(--bg)',
        borderRadius: 16,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg)',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' }}>
            Edit profile
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{
              padding: '7px 16px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'transparent', fontSize: 12, fontWeight: 700,
              color: 'var(--text)', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            }}>
              Cancel
            </button>
            <button onClick={onClose} style={{
              padding: '7px 16px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'var(--surface)', fontSize: 12, fontWeight: 700,
              color: 'var(--text)', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            }}>
              Save changes
            </button>
          </div>
        </div>

        <div style={{ padding: '16px 16px 32px' }}>

          {/* PHOTO */}
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle}>Photo</div>
            <div style={{ ...sectionBodyStyle, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
                background: `linear-gradient(135deg, ${user.avatarGradient[0]}, ${user.avatarGradient[1]})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 22, fontWeight: 800,
              }}>
                {user.initials}
              </div>
              <div>
                <button style={{
                  padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)',
                  background: 'var(--bg)', fontSize: 12, fontWeight: 600,
                  color: 'var(--text)', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  marginBottom: 6,
                }}>
                  Upload photo
                </button>
                <div style={{ fontSize: 11, color: 'var(--text4)' }}>JPG or PNG, max 2MB</div>
              </div>
            </div>
          </div>

          {/* BASIC INFO */}
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle}>Basic Info</div>
            <div style={sectionBodyStyle}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Display name</label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value.slice(0, 40))}
                    style={inputStyle}
                  />
                  <div style={{ fontSize: 10, color: 'var(--text4)', textAlign: 'right', marginTop: 3 }}>
                    {name.length}/40
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Username</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                      fontSize: 13, color: 'var(--text4)', fontFamily: 'Inter, sans-serif',
                    }}>@</span>
                    <input
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      style={{ ...inputStyle, paddingLeft: 24 }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Bio</label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value.slice(0, 160))}
                  rows={4}
                  style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }}
                />
                <div style={{ fontSize: 10, color: 'var(--text4)', textAlign: 'right', marginTop: 3 }}>
                  {bio.length}/160
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Location</label>
                  <input value={location} onChange={e => setLocation(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Website</label>
                  <input value={website} onChange={e => setWebsite(e.target.value)} style={inputStyle} />
                </div>
              </div>
            </div>
          </div>

          {/* INTERESTS & TAGS */}
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle}>Interests &amp; Tags</div>
            <div style={sectionBodyStyle}>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Tags</label>
                <div style={{
                  display: 'flex', flexWrap: 'wrap', gap: 7, alignItems: 'center',
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '8px 10px', minHeight: 44,
                }}>
                  {tags.map(tag => (
                    <span key={tag} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      fontSize: 12, fontWeight: 500, color: 'var(--text)',
                      border: '1px solid var(--border)', borderRadius: 20,
                      padding: '3px 10px',
                    }}>
                      {tag}
                      <span
                        onClick={() => removeTag(tag)}
                        style={{
                          width: 16, height: 16, borderRadius: '50%',
                          background: 'var(--border2)', display: 'inline-flex',
                          alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', fontSize: 10, color: 'var(--text4)',
                          lineHeight: 1,
                        }}
                      >×</span>
                    </span>
                  ))}
                  <input
                    placeholder="Add tag..."
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={addTag}
                    style={{
                      border: 'none', outline: 'none', background: 'transparent',
                      fontSize: 13, color: 'var(--text)', fontFamily: 'Inter, sans-serif',
                      minWidth: 80,
                    }}
                  />
                </div>
                <div style={{ fontSize: 10, color: 'var(--text4)', marginTop: 5 }}>Press Enter to add a tag</div>
              </div>

              <div>
                <label style={labelStyle}>Experience level</label>
                <select
                  value={experience}
                  onChange={e => setExperience(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  {['Learning', 'Beginner', 'Intermediate', 'Advanced', 'Professional'].map(v => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* PRIVACY */}
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle}>Privacy</div>
            <div style={{ padding: '4px 0' }}>
              {[
                { label: 'Public profile', sub: 'Anyone can view your profile and posts', val: privacyPublic, set: setPrivacyPublic },
                { label: 'Show sector exposure', sub: 'Display your sector breakdown on your profile', val: showSectors, set: setShowSectors },
                { label: 'Allow messages', sub: 'Let other users send you direct messages', val: allowMessages, set: setAllowMessages },
              ].map(({ label, sub, val, set }, i, arr) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 18px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border2)' : 'none',
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text4)' }}>{sub}</div>
                  </div>
                  <Toggle on={val} onChange={set} />
                </div>
              ))}
            </div>
          </div>

          {/* ACCOUNT (danger zone) */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--red-border)',
            borderRadius: 14, overflow: 'hidden',
          }}>
            <div style={{ ...sectionHeaderStyle, color: 'var(--red)', borderBottomColor: 'var(--red-border)' }}>
              Account
            </div>
            <div style={{
              padding: '16px 18px', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', gap: 12,
            }}>
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
                Permanently delete your account and all data
              </span>
              <button style={{
                padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)',
                background: 'var(--bg)', fontSize: 12, fontWeight: 700,
                color: 'var(--text)', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                flexShrink: 0,
              }}>
                Delete account
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
