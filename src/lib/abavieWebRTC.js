/* ================================================================
   ABAVIE — WebRTC Audio/Video Calling
   Peer-to-peer call infrastructure (signaling via Supabase)
   ================================================================ */

import { supabase } from './supabase'

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}

export class AbavieCall {
  constructor(conversationId, userId, onStateChange, onStream, onError) {
    this.pc = null
    this.localStream = null
    this.remoteStream = null
    this.channelId = conversationId
    this.userId = userId
    this.role = null // 'caller' | 'callee'
    this.onStateChange = onStateChange || (() => {})
    this.onStream = onStream || (() => {})
    this.onError = onError || (() => {})
    this.sub = null
  }

  async _initPC() {
    this.pc = new RTCPeerConnection(ICE_SERVERS)

    this.pc.onicecandidate = (e) => {
      if (e.candidate) {
        this._sendSignal({ type: 'candidate', candidate: e.candidate.toJSON() })
      }
    }

    this.pc.ontrack = (e) => {
      this.remoteStream = e.streams[0]
      this.onStream('remote', this.remoteStream)
    }

    this.pc.onconnectionstatechange = () => {
      this.onStateChange(this.pc.connectionState)
    }
  }

  async startCall({ audio = true, video = false } = {}) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio, video })
      this.onStream('local', this.localStream)
    } catch (e) {
      this.onError('getUserMedia', e)
      return
    }

    await this._initPC()
    this.role = 'caller'

    this.localStream.getTracks().forEach(t => this.pc.addTrack(t, this.localStream))

    const offer = await this.pc.createOffer()
    await this.pc.setLocalDescription(offer)

    this._sendSignal({ type: 'offer', sdp: offer.sdp })
    this._listenSignals()
  }

  async answerCall(offerSdp, { audio = true, video = false } = {}) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio, video })
      this.onStream('local', this.localStream)
    } catch (e) {
      this.onError('getUserMedia', e)
      return
    }

    await this._initPC()
    this.role = 'callee'

    this.localStream.getTracks().forEach(t => this.pc.addTrack(t, this.localStream))

    await this.pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: offerSdp }))
    const answer = await this.pc.createAnswer()
    await this.pc.setLocalDescription(answer)

    this._sendSignal({ type: 'answer', sdp: answer.sdp })
    this._listenSignals()
  }

  _listenSignals() {
    this.sub = supabase
      .channel(`webrtc-${this.channelId}`)
      .on('broadcast', { event: 'signal' }, ({ payload }) => {
        this._handleSignal(payload)
      })
      .subscribe()
  }

  async _handleSignal(payload) {
    if (!payload || payload.from === this.userId) return

    try {
      if (payload.type === 'offer' && this.role !== 'caller') {
        await this.answerCall(payload.sdp)
      } else if (payload.type === 'answer' && this.role === 'caller') {
        await this.pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: payload.sdp }))
      } else if (payload.type === 'candidate') {
        await this.pc.addIceCandidate(new RTCIceCandidate(payload.candidate))
      } else if (payload.type === 'hangup') {
        this.hangup()
      }
    } catch (e) {
      this.onError('signal', e)
    }
  }

  _sendSignal(data) {
    supabase.channel(`webrtc-${this.channelId}`).send({
      type: 'broadcast',
      event: 'signal',
      payload: { from: this.userId, ...data },
    })
  }

  toggleMute(kind = 'audio') {
    const sender = this.pc?.getSenders().find(s => s.track?.kind === kind)
    if (sender?.track) {
      sender.track.enabled = !sender.track.enabled
      return sender.track.enabled
    }
    return null
  }

  toggleVideo() {
    return this.toggleMute('video')
  }

  hangup() {
    this._sendSignal({ type: 'hangup' })
    this.localStream?.getTracks().forEach(t => t.stop())
    this.remoteStream?.getTracks().forEach(t => t.stop())
    this.pc?.close()
    this.sub?.unsubscribe()
    this.localStream = null
    this.remoteStream = null
    this.pc = null
    this.onStateChange('closed')
  }
}

// Call invitation helper
export async function sendCallInvitation(conversationId, userId, { audio = true, video = false }) {
  return supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: userId,
    type: video ? 'video_call' : 'audio_call',
    content: `Appel ${video ? 'vidéo' : 'audio'} en cours...`,
    metadata: { call_type: video ? 'video' : 'audio', status: 'ringing' },
    created_at: new Date().toISOString(),
    read: false,
  })
}
