import { useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { homeForRole, useAuth } from '../auth/AuthContext'
import { Badge, Button, Modal } from '../components/ui'
import { useToast } from '../components/Toasts'
import {
  IconBarChart,
  IconEye,
  IconEyeOff,
  IconLock,
  IconQr,
  IconShield,
  IconSparkles,
  IconUser,
} from '../components/Icons'

const DEMO_USERS = [
  { role: 'Admin', user: 'admin', pass: 'Admin@123', desc: 'System management, staff directory & timetable' },
  { role: 'Attendance Coordinator', user: 'rajasekar', pass: 'Raj@123', desc: 'Section analytics & shortage monitoring' },
  { role: 'Teacher / Faculty', user: 'pavithra', pass: 'Pav@123', desc: 'Classroom QR generator & subject hub' },
  { role: 'Student', user: 'mohan23', pass: 'Student@123', desc: 'QR scanner, Smart Planner & timetable' },
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [demoModalOpen, setDemoModalOpen] = useState(false)

  const from = (location.state as { from?: string } | null)?.from

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) {
      setError('Please enter both username and password.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const user = await login(username.trim(), password)
      toast(`Welcome back, ${user.displayName}!`, 'success')
      navigate(from && !from.startsWith('/login') ? from : homeForRole(user.role), { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Authentication failed. Please check credentials.')
    } finally {
      setSubmitting(false)
    }
  }

  const fillDemo = (role: string, u: string, p: string) => {
    setUsername(u)
    setPassword(p)
    setError('')
    setDemoModalOpen(false)
    toast(`Loaded credentials for ${role}`, 'success')
  }

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault()
    alert('For security reasons, password resets are handled by your Institutional Administrator. Please contact your Department Head or IT Helpdesk.')
  }

  return (
    <div className="login-page">
      {/* Left Panel: Premium Dark Navy Branding Section */}
      <div className="login-brand">
        {/* Technology SVG Background Geometry */}
        <div className="login-brand-bg-pattern" />

        <div className="brand-header">
          <div className="logo-mark">SA</div>
          <div>
            <div className="brand-title">SMART ACADEMIC COMPANION</div>
            <div className="brand-sub">Institutional College ERP Platform</div>
          </div>
        </div>

        <div className="login-brand-content">
          <div style={{ marginBottom: 16 }}>
            <span className="academic-year-badge">
              Academic Year 2026–2027
            </span>
          </div>

          <h1>Smarter attendance.<br />Better academic planning.</h1>
          <p className="tagline">
            An institutional technology platform built for modern higher education — period-wise projector QR tracking, timetable-driven free period detection, and AI study planning.
          </p>

          <div className="login-features">
            <div className="login-feature-item">
              <div className="login-feature-icon">
                <IconQr style={{ width: 16, height: 16 }} />
              </div>
              <div>
                <div style={{ fontWeight: 650, color: '#F8FAFC' }}>Smart QR Attendance</div>
                <div style={{ fontSize: 12.5, color: '#94A3B8' }}>Period-wise classroom projector verification with 3-min token security.</div>
              </div>
            </div>

            <div className="login-feature-item">
              <div className="login-feature-icon">
                <IconSparkles style={{ width: 16, height: 16 }} />
              </div>
              <div>
                <div style={{ fontWeight: 650, color: '#F8FAFC' }}>Personalized Academic Planner</div>
                <div style={{ fontSize: 12.5, color: '#94A3B8' }}>Intelligent study engine that transforms free periods into productive tasks.</div>
              </div>
            </div>

            <div className="login-feature-item">
              <div className="login-feature-icon">
                <IconBarChart style={{ width: 16, height: 16 }} />
              </div>
              <div>
                <div style={{ fontWeight: 650, color: '#F8FAFC' }}>Attendance Analytics</div>
                <div style={{ fontSize: 12.5, color: '#94A3B8' }}>Coordinator insights, section progress tracking & shortage warnings.</div>
              </div>
            </div>
          </div>
        </div>

        <div className="login-brand-footer">
          © 2026 Smart Academic Companion · Institutional Technology Systems
        </div>
      </div>

      {/* Right Panel: Clean Login Section */}
      <div className="login-form-side">
        <div className="login-card-container">
          <div className="login-card-head">
            <h2>Welcome back</h2>
            <p className="sub">Sign in to your college portal</p>
          </div>

          <form onSubmit={submit} noValidate className="login-form">
            {/* Username / Employee ID Input */}
            <div className="field">
              <label htmlFor="username">Username or Employee / Reg ID</label>
              <div className="input-with-icon">
                <IconUser className="input-slot-icon" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username or ID"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Password Input with Visibility Toggle */}
            <div className="field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="password">Password</label>
                <a href="#forgot" onClick={handleForgotPassword} className="forgot-link">
                  Forgot password?
                </a>
              </div>
              <div className="input-with-icon">
                <IconLock className="input-slot-icon" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="checkbox-row" style={{ margin: '8px 0 16px 0' }}>
              <label>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me on this browser
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="login-error-banner">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={submitting}
              style={{ width: '100%', marginTop: 8, padding: '12px 20px', fontSize: 15 }}
            >
              Sign In to Portal →
            </Button>

            {/* Security Footnote */}
            <div className="security-footnote">
              <IconShield style={{ width: 14, height: 14, color: 'var(--muted)' }} />
              <span>Secure access for authorized college users</span>
            </div>
          </form>

          {/* Hidden/Subtle Demo Access Trigger */}
          <div className="demo-access-footer">
            <button
              type="button"
              className="demo-trigger-btn"
              onClick={() => setDemoModalOpen(true)}
            >
              🔑 Need demo access? Load test credentials
            </button>
          </div>
        </div>
      </div>

      {/* Demo Credentials Modal */}
      <Modal
        open={demoModalOpen}
        title="Demo Access Credentials"
        onClose={() => setDemoModalOpen(false)}
        maxWidth={480}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 8px 0' }}>
            Select an account role below to automatically fill credential fields for quick portal evaluation:
          </p>

          {DEMO_USERS.map((d) => (
            <button
              key={d.user}
              type="button"
              className="card card-pad card-hover"
              style={{
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                padding: '14px 16px',
              }}
              onClick={() => fillDemo(d.role, d.user, d.pass)}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{d.role}</span>
                  <Badge tone="primary" style={{ fontSize: 11 }}>{d.user}</Badge>
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                  {d.desc}
                </div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>Select ↗</span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  )
}
