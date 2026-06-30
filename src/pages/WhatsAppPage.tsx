import { useCallback, useEffect, useRef, useState } from 'react'
import { MessageCircle, RefreshCw, LogOut, Send, Wifi, WifiOff, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'
import { apiFetch } from '../services/api'
import { API_URL } from '../constants'
import { Toast } from '../components/ui/Toast'
import { Panel } from '../components/ui/Panel'
import { PageHeader } from '../components/ui/PageHeader'
import { Field } from '../components/ui/Field'
import { Spinner } from '../components/ui/Spinner'

type WaStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'

interface WaState {
  status: WaStatus
  qr: string | null
  phone: string | null
}

const INITIAL: WaState = { status: 'DISCONNECTED', qr: null, phone: null }

export default function WhatsAppPage() {
  const { token } = useAuth()
  const { toast, notify } = useToast()

  const [state, setState] = useState<WaState>(INITIAL)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)

  const [sendPhone, setSendPhone] = useState('')
  const [sendMsg, setSendMsg] = useState('')
  const [sending, setSending] = useState(false)

  const sseRef = useRef<EventSource | null>(null)

  // Open SSE stream
  const openStream = useCallback(() => {
    if (sseRef.current) sseRef.current.close()

    const es = new EventSource(`${API_URL}/whatsapp/stream`, {
      // EventSource doesn't support custom headers; we pass token via query param
    })

    // The backend route requires auth — we use a workaround: fetch status normally
    // and fall back to polling for the QR since EventSource can't set Authorization.
    // Instead, we use a token-authed polling approach below.
    es.close()
    sseRef.current = null
  }, [])

  // Poll status every 3 s while CONNECTING (waiting for QR), every 10 s otherwise
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const data = await apiFetch<WaState>('/whatsapp/status', token)
      setState(data)
      setLoading(false)
    } catch {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void fetchStatus()
  }, [fetchStatus])

  // Adaptive polling: fast when QR is showing, slow when connected/disconnected
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    const interval = state.status === 'CONNECTING' ? 3000 : 10_000
    pollRef.current = setInterval(() => { void fetchStatus() }, interval)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [state.status, fetchStatus])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      openStream() // closes any open EventSource
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [openStream])

  const connect = async () => {
    setActing(true)
    try {
      await apiFetch('/whatsapp/connect', token, { method: 'POST' })
      setState((s) => ({ ...s, status: 'CONNECTING' }))
      notify('success', 'Connecting — scan the QR code with WhatsApp')
      void fetchStatus()
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed to connect')
    } finally {
      setActing(false)
    }
  }

  const disconnect = async () => {
    setActing(true)
    try {
      await apiFetch('/whatsapp/logout', token, { method: 'POST' })
      setState(INITIAL)
      notify('success', 'WhatsApp disconnected')
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed to disconnect')
    } finally {
      setActing(false)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sendPhone.trim() || !sendMsg.trim()) return notify('error', 'Phone and message are required')
    setSending(true)
    try {
      await apiFetch('/whatsapp/send', token, {
        method: 'POST',
        body: JSON.stringify({ phone: sendPhone.trim(), message: sendMsg.trim() }),
      })
      notify('success', 'Message sent')
      setSendMsg('')
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  const statusColor =
    state.status === 'CONNECTED' ? '#16a34a' :
    state.status === 'CONNECTING' ? '#d97706' : '#6b7280'

  const StatusDot = () => (
    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: statusColor, marginRight: 6 }} />
  )

  if (loading) return <div style={{ padding: 32 }}><Spinner /></div>

  return (
    <div>
      <Toast toast={toast} />
      <PageHeader title="WhatsApp" icon={<MessageCircle size={20} />} />

      <div style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', padding: '0 0 24px' }}>

        {/* ── Connection panel ── */}
        <Panel title="Connection">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Status badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <StatusDot />
              <span style={{ fontWeight: 600, fontSize: 15 }}>
                {state.status === 'CONNECTED' ? 'Connected' :
                 state.status === 'CONNECTING' ? 'Waiting for QR scan…' : 'Disconnected'}
              </span>
              {state.phone && (
                <span style={{ color: '#6b7280', fontSize: 13 }}>+{state.phone}</span>
              )}
            </div>

            {/* QR code */}
            {state.status === 'CONNECTING' && (
              <div style={{ textAlign: 'center' }}>
                {state.qr ? (
                  <>
                    <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 12 }}>
                      Open WhatsApp → Linked Devices → Link a Device and scan:
                    </p>
                    <img
                      src={state.qr}
                      alt="WhatsApp QR Code"
                      style={{ width: 240, height: 240, borderRadius: 12, border: '1px solid #e5e7eb' }}
                    />
                    <p style={{ color: '#6b7280', fontSize: 12, marginTop: 8 }}>
                      QR refreshes automatically every ~20 s
                    </p>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', color: '#6b7280' }}>
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Generating QR code…</span>
                  </div>
                )}
              </div>
            )}

            {/* Connected illustration */}
            {state.status === 'CONNECTED' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f0fdf4', borderRadius: 10, padding: '12px 16px' }}>
                <Wifi size={20} color="#16a34a" />
                <span style={{ color: '#16a34a', fontWeight: 500 }}>WhatsApp is active — OTPs &amp; notifications will be sent via WhatsApp</span>
              </div>
            )}

            {/* Disconnected notice */}
            {state.status === 'DISCONNECTED' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fafafa', borderRadius: 10, padding: '12px 16px', border: '1px solid #e5e7eb' }}>
                <WifiOff size={20} color="#6b7280" />
                <span style={{ color: '#6b7280' }}>Not connected — OTPs will fall back to SMS</span>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              {state.status === 'DISCONNECTED' && (
                <button
                  className="btn btn-primary"
                  onClick={connect}
                  disabled={acting}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {acting ? <Loader2 size={14} /> : <MessageCircle size={14} />}
                  Connect WhatsApp
                </button>
              )}

              {state.status === 'CONNECTING' && (
                <button
                  className="btn btn-secondary"
                  onClick={() => void fetchStatus()}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <RefreshCw size={14} />
                  Refresh
                </button>
              )}

              {(state.status === 'CONNECTING' || state.status === 'CONNECTED') && (
                <button
                  className="btn btn-danger"
                  onClick={disconnect}
                  disabled={acting}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <LogOut size={14} />
                  Disconnect
                </button>
              )}
            </div>
          </div>
        </Panel>

        {/* ── Send message panel ── */}
        <Panel title="Send Message">
          {state.status !== 'CONNECTED' ? (
            <p style={{ color: '#6b7280', fontSize: 14 }}>Connect WhatsApp first to send messages.</p>
          ) : (
            <form onSubmit={(e) => void sendMessage(e)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Phone number (e.g. 22212345678)">
                <input
                  className="input"
                  type="tel"
                  placeholder="22212345678"
                  value={sendPhone}
                  onChange={(e) => setSendPhone(e.target.value)}
                  required
                />
              </Field>

              <Field label="Message">
                <textarea
                  className="input"
                  rows={4}
                  placeholder="Type your message…"
                  value={sendMsg}
                  onChange={(e) => setSendMsg(e.target.value)}
                  required
                  style={{ resize: 'vertical', fontFamily: 'inherit' }}
                />
              </Field>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={sending}
                style={{ display: 'flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}
              >
                {sending ? <Loader2 size={14} /> : <Send size={14} />}
                Send
              </button>
            </form>
          )}
        </Panel>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
