import { useState } from 'react'
import { post } from '../../api/client'
import type { ScanResultDto } from '../../api/types'
import { Badge, Button } from '../../components/ui'
import { useToast } from '../../components/Toasts'
import { IconCheckCircle, IconQr, IconShield } from '../../components/Icons'

type Step = 'scan' | 'verifying' | 'success' | 'failed'

export default function Scanner() {
  const { toast } = useToast()
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [step, setStep] = useState<Step>('scan')
  const [result, setResult] = useState<ScanResultDto | null>(null)

  const scan = async () => {
    const trimmedToken = token.trim()
    if (!trimmedToken) {
      toast("Enter the 8-digit attendance token from your teacher's screen", 'error')
      return
    }

    if (!/^\d{8}$/.test(trimmedToken)) {
      toast("The attendance token must be exactly 8 digits", 'error')
      return
    }

    setBusy(true)
    setStep('verifying')

    try {
      const res = await post<ScanResultDto>('/api/student/attendance/scan', { qrToken: trimmedToken })
      setResult(res)
      if (res.success) {
        setStep('success')
        toast('Attendance recorded successfully!', 'success')
        setToken('')
      } else {
        setStep('failed')
        toast(res.message || 'Verification failed', 'error')
      }
    } catch (err) {
      setStep('failed')
      toast(err instanceof Error ? err.message : 'Scan failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  const resetScanner = () => {
    setStep('scan')
    setResult(null)
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div className="page-head" style={{ justifyContent: 'center', textAlign: 'center' }}>
        <div>
          <h1 className="page-title">Classroom Attendance Scanner</h1>
          <div className="page-subtitle" style={{ justifyContent: 'center' }}>
            Verify the active 8-digit attendance code displayed by your faculty
          </div>
        </div>
      </div>

      <div className="card card-pad" style={{ padding: 32 }}>
        {step === 'scan' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                width: 240,
                height: 240,
                borderRadius: 24,
                border: '2px dashed var(--primary)',
                background: 'var(--surface-2)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                marginBottom: 24,
              }}
            >
              <IconQr style={{ width: 80, height: 80, color: 'var(--primary)', marginBottom: 12 }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>QR Scanner Active</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Ready for 8-digit code</div>
              <div
                className="scanner-line"
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  height: 3,
                  background: 'var(--primary)',
                  boxShadow: '0 0 8px var(--primary)',
                  animation: 'scan-anim 2s infinite ease-in-out',
                }}
              />
            </div>

            <div style={{ width: '100%', maxWidth: 400, marginBottom: 24 }}>
              <div className="field">
                <label htmlFor="token-input" style={{ textAlign: 'center', width: '100%', marginBottom: 8, fontWeight: 650 }}>
                  Enter 8-Digit Attendance Code
                </label>
                <input
                  id="token-input"
                  type="text"
                  maxLength={8}
                  pattern="\d*"
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 12345678"
                  style={{
                    textAlign: 'center',
                    fontSize: 22,
                    fontWeight: 700,
                    letterSpacing: '0.15em',
                    padding: '14px',
                    borderRadius: 12,
                    border: '2px solid var(--border)',
                  }}
                />
              </div>
            </div>

            <Button variant="primary" size="lg" style={{ width: '100%', maxWidth: 400 }} onClick={scan} loading={busy}>
              Verify Attendance Code
            </Button>
          </div>
        )}

        {step === 'verifying' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0' }}>
            <span className="spinner" style={{ width: 48, height: 48, marginBottom: 20 }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Verifying Attendance Code</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>
              Checking code validity against session...
            </p>
          </div>
        )}

        {step === 'success' && result && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0', textAlign: 'center' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--success-light)',
                color: 'var(--success)',
                display: 'grid',
                placeItems: 'center',
                marginBottom: 16,
              }}
            >
              <IconCheckCircle style={{ width: 36, height: 36 }} />
            </div>

            <Badge tone="success" style={{ fontSize: 14, padding: '6px 16px', marginBottom: 12 }}>
              Marked Present
            </Badge>

            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{result.message}</h2>

            {result.record && (
              <div
                className="card card-pad"
                style={{
                  width: '100%',
                  maxWidth: 380,
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  margin: '20px 0',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 15 }}>{result.record.studentName}</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                  Reg. No: <strong>{result.record.registerNumber}</strong>
                </div>
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>Status:</span>
                  <Badge tone="success">PRESENT</Badge>
                </div>
              </div>
            )}

            <Button variant="primary" onClick={resetScanner} style={{ marginTop: 10 }}>
              Scan Another Class
            </Button>
          </div>
        )}

        {step === 'failed' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0', textAlign: 'center' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--danger-light)',
                color: 'var(--danger)',
                display: 'grid',
                placeItems: 'center',
                marginBottom: 16,
              }}
            >
              <IconShield style={{ width: 36, height: 36 }} />
            </div>

            <Badge tone="danger" style={{ fontSize: 14, padding: '6px 16px', marginBottom: 12 }}>
              Verification Failed
            </Badge>

            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              {result?.message || 'Attendance code could not be verified.'}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', maxWidth: 400, marginBottom: 24 }}>
              Ensure your faculty has an active attendance session and that your token code is correct.
            </p>

            <Button variant="primary" onClick={resetScanner}>
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
