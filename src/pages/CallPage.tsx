import { useCallback, useEffect, useRef, useState } from 'react'
import AgoraRTC from 'agora-rtc-sdk-ng'
import type { IAgoraRTCClient, IMicrophoneAudioTrack, IRemoteAudioTrack } from 'agora-rtc-sdk-ng'
import { Phone, PhoneOff, Mic, MicOff, Headphones, PhoneIncoming, Volume2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'
import { apiFetch } from '../services/api'
import { Toast } from '../components/ui/Toast'
import { Panel } from '../components/ui/Panel'
import { PageHeader } from '../components/ui/PageHeader'

const AGORA_APP_ID = (import.meta.env.VITE_AGORA_APP_ID as string | undefined) ?? ''

interface CallSession {
  id: string
  channelName: string
  customerId: string
  customerName: string
  status: 'RINGING' | 'ACTIVE' | 'ENDED'
  startedAt: string
}

interface CallPayload {
  callId: string
  channelName: string
  token: string | null
  customerName: string
}

// ── Detect mode from URL ──────────────────────────────────────────────────────
function getCallPayload(): CallPayload | null {
  const raw = new URLSearchParams(window.location.search).get('data')
  if (!raw) return null
  try { return JSON.parse(atob(raw)) as CallPayload } catch { return null }
}

// ─────────────────────────────────────────────────────────────────────────────
// Mode A — Active call tab (opened by acceptCall)
// ─────────────────────────────────────────────────────────────────────────────
function ActiveCallTab({ payload, token: authToken }: { payload: CallPayload; token: string }) {
  const { toast, notify } = useToast()
  const clientRef   = useRef<IAgoraRTCClient | null>(null)
  const localTrack  = useRef<IMicrophoneAudioTrack | null>(null)
  const remoteTrack = useRef<IRemoteAudioTrack | null>(null)
  const startedAt   = useRef(Date.now())
  const tickRef     = useRef<ReturnType<typeof setInterval> | null>(null)

  const [elapsed,         setElapsed]         = useState(0)
  const [muted,           setMuted]           = useState(false)
  const [remoteConnected, setRemoteConnected] = useState(false)
  const [audioBlocked,    setAudioBlocked]    = useState(false)
  const [ended,           setEnded]           = useState(false)

  const enableAudio = () => {
    remoteTrack.current?.setVolume(100)
    remoteTrack.current?.play()
    setAudioBlocked(false)
  }

  const endCall = useCallback(async () => {
    clearInterval(tickRef.current!)
    AgoraRTC.onAutoplayFailed = undefined as any
    try { remoteTrack.current?.stop() }                              catch {}
    try { localTrack.current?.stop(); localTrack.current?.close() } catch {}
    try { await clientRef.current?.leave() }                         catch {}
    remoteTrack.current = null
    localTrack.current  = null
    clientRef.current   = null
    try { await apiFetch(`/calls/${payload.callId}/end`, authToken, { method: 'POST' }) } catch {}
    setEnded(true)
  }, [authToken, payload.callId])

  // Join on mount
  useEffect(() => {
    if (!AGORA_APP_ID) { notify('error', 'VITE_AGORA_APP_ID not set'); return }

    const join = async () => {
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
      clientRef.current = client

      AgoraRTC.onAutoplayFailed = () => setAudioBlocked(true)

      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType)
        if (mediaType === 'audio' && user.audioTrack) {
          remoteTrack.current = user.audioTrack
          user.audioTrack.setVolume(100)
          try { user.audioTrack.play(); setRemoteConnected(true); setAudioBlocked(false) }
          catch { setRemoteConnected(true); setAudioBlocked(true) }
        }
      })
      client.on('user-unpublished', (_u, mediaType) => {
        if (mediaType === 'audio') { remoteTrack.current = null; setRemoteConnected(false) }
      })
      client.on('user-left', () => { void endCall() })

      await client.join(AGORA_APP_ID, payload.channelName, payload.token, 1)

      const track = await AgoraRTC.createMicrophoneAudioTrack()
      localTrack.current = track
      await client.publish([track])

      // Timer
      startedAt.current = Date.now()
      tickRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startedAt.current) / 1000))
      }, 1000)
    }

    void join().catch(err => notify('error', err instanceof Error ? err.message : 'Failed to join'))

    return () => {
      clearInterval(tickRef.current!)
      AgoraRTC.onAutoplayFailed = undefined as any
      try { localTrack.current?.stop(); localTrack.current?.close() } catch {}
      try { clientRef.current?.leave() } catch {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleMute = () => {
    const next = !muted
    localTrack.current?.setEnabled(!next)
    setMuted(next)
  }

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    return `${m}:${(s % 60).toString().padStart(2, '0')}`
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f4f6f9', gap: 24, padding: 40 }}>
      <Toast toast={toast} />

      {ended ? (
        <>
          <PhoneOff size={56} color="#9ca3af" />
          <p style={{ fontSize: 20, fontWeight: 600, color: '#374151', margin: 0 }}>Call ended</p>
          <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>You can close this tab.</p>
        </>
      ) : (
        <>
          <div style={{ width: 96, height: 96, borderRadius: 48, background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(22,163,74,0.3)' }}>
            <Headphones size={40} color="#fff" />
          </div>

          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 22, color: '#0d1b2a' }}>{payload.customerName}</p>
            <p style={{ margin: '8px 0 0', fontSize: 36, fontWeight: 700, letterSpacing: 3, color: '#16a34a', fontVariantNumeric: 'tabular-nums' }}>
              {fmtTime(elapsed)}
            </p>
          </div>

          <p style={{ fontSize: 12, color: remoteConnected ? '#16a34a' : '#9ca3af', margin: 0 }}>
            {remoteConnected ? '● Customer audio received' : '◌ Waiting for customer audio…'}
          </p>

          {audioBlocked && (
            <button onClick={enableAudio} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
              <Volume2 size={16} /> Click to Enable Audio
            </button>
          )}

          <div style={{ display: 'flex', gap: 16 }}>
            <button
              onClick={toggleMute}
              style={{ ...ctrlBtn, background: muted ? '#6b7280' : '#fff', color: muted ? '#fff' : '#374151', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
            >
              {muted ? <MicOff size={22} /> : <Mic size={22} />}
              <span style={{ fontSize: 11, marginTop: 4 }}>{muted ? 'Unmute' : 'Mute'}</span>
            </button>

            <button
              onClick={() => void endCall()}
              style={{ ...ctrlBtn, background: '#dc2626', color: '#fff' }}
            >
              <PhoneOff size={22} />
              <span style={{ fontSize: 11, marginTop: 4 }}>End</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}

const ctrlBtn: React.CSSProperties = {
  border: 'none', cursor: 'pointer',
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  width: 88, height: 88, borderRadius: 20, gap: 4, fontWeight: 500,
}

// ─────────────────────────────────────────────────────────────────────────────
// Mode B — Dispatcher tab (normal SPA page, polls for calls)
// ─────────────────────────────────────────────────────────────────────────────
function DispatcherTab({ token }: { token: string }) {
  const { toast, notify } = useToast()
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [calls, setCalls] = useState<CallSession[]>([])

  const fetchCalls = useCallback(async () => {
    try {
      const { calls: list } = await apiFetch<{ calls: CallSession[] }>('/calls/active', token)
      setCalls(list)
    } catch {}
  }, [token])

  useEffect(() => {
    void fetchCalls()
    pollRef.current = setInterval(() => void fetchCalls(), 3000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [fetchCalls])

  const acceptCall = useCallback(async (call: CallSession) => {
    if (!AGORA_APP_ID) { notify('error', 'VITE_AGORA_APP_ID not set'); return }
    try {
      const { channelName, token: agoraToken } = await apiFetch<{
        ok: boolean; channelName: string; token: string | null
      }>(`/calls/${call.id}/accept`, token, { method: 'POST' })

      const payload: CallPayload = {
        callId: call.id,
        channelName,
        token: agoraToken,
        customerName: call.customerName,
      }
      const encoded = btoa(JSON.stringify(payload))
      window.open(`/calls?data=${encoded}`, '_blank', 'noopener,noreferrer')
      // Remove this call from the list so it doesn't show as ringing
      setCalls(prev => prev.filter(c => c.id !== call.id))
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed to accept')
    }
  }, [token, notify])

  const rejectCall = useCallback(async (callId: string) => {
    try { await apiFetch(`/calls/${callId}/end`, token, { method: 'POST' }) } catch {}
    setCalls(prev => prev.filter(c => c.id !== callId))
  }, [token])

  const ringing = calls.filter(c => c.status === 'RINGING')

  return (
    <div>
      <Toast toast={toast} />
      <PageHeader title="Support Calls" icon={<Phone size={20} />} />

      <div style={{ maxWidth: 480 }}>
        <Panel title="Incoming Calls">
          {ringing.length === 0 ? (
            <div style={{ color: '#6b7280', fontSize: 14, textAlign: 'center', padding: '32px 0' }}>
              <Headphones size={36} style={{ marginBottom: 12, color: '#d1d5db' }} />
              <p style={{ margin: 0 }}>No active calls — waiting for customers</p>
            </div>
          ) : ringing.map(call => (
            <div key={call.id} style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={avatarStyle}><PhoneIncoming size={20} color="#16a34a" /></div>
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>{call.customerName}</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Calling…</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onClick={() => void acceptCall(call)}
                >
                  <Phone size={14} /> Accept
                </button>
                <button
                  className="btn btn-danger"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onClick={() => void rejectCall(call.id)}
                >
                  <PhoneOff size={14} /> Reject
                </button>
              </div>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: '#f0fdf4', borderRadius: 12, padding: '14px 16px', border: '1px solid #bbf7d0', marginBottom: 10,
}
const avatarStyle: React.CSSProperties = {
  width: 44, height: 44, borderRadius: 22, background: '#dcfce7',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
}

// ─────────────────────────────────────────────────────────────────────────────
// Root — picks mode based on URL
// ─────────────────────────────────────────────────────────────────────────────
export default function CallPage() {
  const { token } = useAuth()
  const payload = getCallPayload()

  if (payload) return <ActiveCallTab payload={payload} token={token} />
  return <DispatcherTab token={token} />
}
