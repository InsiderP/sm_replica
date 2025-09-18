'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/lib/api';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [userName, setUserName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [signupToken, setSignupToken] = useState<string | null>(null);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function startSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }
      // Client-side validation
      if (!gender) {
        throw new Error('Please select gender');
      }
      if (!phone.startsWith('+91') || phone.length !== 13) {
        throw new Error('Phone must be Indian +91XXXXXXXXXX');
      }

      const { data } = await api.post('/auth/start-signup', {
        email,
        phone,
        password,
        firstName,
        lastName,
        gender,
        userName,
        // NOTE: Backend expects avatarUrl string; file upload will be handled after account creation
        avatarUrl: avatarUrl || undefined,
        is_public: isPublic,
      });
      const token = data?.data?.signupToken || data?.signupToken;
      if (!token) throw new Error('Missing signupToken');
      setSignupToken(token);
      setSuccess('OTP sent to your phone. Please verify.');
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!signupToken) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const { data } = await api.post('/auth/verify-otp', {
        otp: otp.join(''),
        signupToken,
      });
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(index: number, value: string) {
    if (value.length > 1) return; // Only allow single digit
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  }

  return (
    <div className="min-h-[calc(100vh-57px)] flex items-center justify-center bg-gradient-to-br from-[#ffedd5] via-[#fae8ff] to-[#e0f2fe]">
      <div className="w-full max-w-2xl mx-auto p-0 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/40 backdrop-blur shadow-xl overflow-hidden">
        <div className="px-6 pt-6 pb-3 border-b border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/30">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-extrabold">Create your account</h1>
            {!signupToken ? (
              <span className="text-xs px-2 py-1 rounded-full bg-black/80 text-white">Step 1 of 2</span>
            ) : (
              <span className="text-xs px-2 py-1 rounded-full bg-black/80 text-white">Step 2 of 2</span>
            )}
          </div>
          <p className="opacity-80 mt-1">Join Kick it Lowkey and start connecting</p>
        </div>

        <div className="p-6">
          {!signupToken ? (
            <form onSubmit={startSignup} className="grid gap-6">
              <div>
                <label className="block text-sm font-medium mb-2 opacity-80">Avatar</label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-full overflow-hidden border border-black/10 dark:border-white/10 bg-black/5 flex items-center justify-center hover:ring-2 hover:ring-black/20 transition"
                    aria-label="Choose avatar"
                  >
                    {avatarFile ? (
                      <img src={URL.createObjectURL(avatarFile)} alt="avatar" className="w-full h-full object-cover" />
                    ) : avatarUrl ? (
                      <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm opacity-60">Choose</span>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    className="hidden"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-xs opacity-70">Click the circle to upload your picture.</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm opacity-80 mb-1">First name</label>
                  <input className="w-full border border-black/20 dark:border-white/20 rounded px-3 py-2" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm opacity-80 mb-1">Last name</label>
                  <input className="w-full border border-black/20 dark:border-white/20 rounded px-3 py-2" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm opacity-80 mb-1">Username</label>
                  <input className="w-full border border-black/20 dark:border-white/20 rounded px-3 py-2" placeholder="username" value={userName} onChange={(e) => setUserName(e.target.value)} required />
                  <p className="text-xs opacity-70 mt-1">Use letters, numbers, and underscores only.</p>
                </div>
                <div>
                  <label className="block text-sm opacity-80 mb-1">Gender</label>
                  <select
                    className="w-full border border-black/20 dark:border-white/20 rounded px-3 py-2"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      Select gender
                    </option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm opacity-80 mb-1">Email</label>
                <input className="w-full border border-black/20 dark:border-white/20 rounded px-3 py-2" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm opacity-80 mb-1">Phone (India)</label>
                <input className="w-full border border-black/20 dark:border-white/20 rounded px-3 py-2" placeholder="+91XXXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                <p className="text-xs opacity-70 mt-1">Must start with +91 and have 10 digits after.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm opacity-80 mb-1">Password</label>
                  <input className="w-full border border-black/20 dark:border-white/20 rounded px-3 py-2" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm opacity-80 mb-1">Confirm Password</label>
                  <input className="w-full border border-black/20 dark:border-white/20 rounded px-3 py-2" placeholder="Confirm Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm opacity-80">
                <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} /> Public account
              </label>

              <button className="w-full bg-black text-white dark:bg-white dark:text-black rounded px-4 py-3 disabled:opacity-60 hover:opacity-90 transition font-semibold" type="submit" disabled={loading}>
                {loading ? 'Sending OTP...' : 'Start Signup'}
              </button>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              {success && <p className="text-green-600 text-sm">{success}</p>}
            </form>
          ) : (
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-black/20 dark:border-white/20 bg-gradient-to-br from-blue-100 to-purple-100 mx-auto mb-4 flex items-center justify-center">
                  {avatarFile ? (
                    <img src={URL.createObjectURL(avatarFile)} alt="avatar" className="w-full h-full object-cover" />
                  ) : avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-black/20 flex items-center justify-center">
                      <span className="text-2xl">👤</span>
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-semibold mb-2">Verify your phone number</h2>
                <p className="opacity-80 text-sm">We sent a 6-digit code to <span className="font-medium">{phone}</span></p>
              </div>

              <form onSubmit={verifyOtp} className="grid gap-6">
                <div className="flex justify-center gap-3">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-12 text-center text-lg font-semibold border border-black/20 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500"
                    />
                  ))}
                </div>

                <button 
                  className="w-full bg-black text-white dark:bg-white dark:text-black rounded-lg px-4 py-3 disabled:opacity-60 hover:opacity-90 transition font-semibold" 
                  type="submit" 
                  disabled={loading || otp.some(digit => !digit)}
                >
                  {loading ? 'Verifying...' : 'Verify & Create Account'}
                </button>

                {error && (
                  <div className="text-center">
                    <p className="text-red-600 text-sm bg-red-50 dark:bg-red-900/20 rounded-lg p-3">{error}</p>
                  </div>
                )}
                
                {success && (
                  <div className="text-center">
                    <div className="text-green-600 text-sm bg-green-50 dark:bg-green-900/20 rounded-lg p-3 flex items-center justify-center gap-2">
                      <span>✅</span>
                      <span>{success}</span>
                    </div>
                  </div>
                )}

                <div className="text-center">
                  <p className="text-xs opacity-70">
                    Didn't receive the code? 
                    <button 
                      type="button" 
                      className="underline ml-1 hover:opacity-80"
                      onClick={() => {
                        setSignupToken(null);
                        setOtp(['', '', '', '', '', '']);
                        setError(null);
                        setSuccess(null);
                      }}
                    >
                      Try again
                    </button>
                  </p>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


