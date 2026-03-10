/**
 * @phozart/phz-collab — Sync Providers
 *
 * WebSocket and WebRTC sync provider implementations.
 * These connect Yjs documents to remote peers for real-time collaboration.
 */

import type { Unsubscribe } from '@phozart/phz-core';
import type {
  SyncProvider,
  ConnectionState,
  YDoc,
  WebSocketSyncConfig,
  WebRTCSyncConfig,
} from './types.js';

// --- Validation Helpers ---

const VALID_PEER_ID = /^[a-zA-Z0-9_-]{1,128}$/;
const VALID_SIGNALING_TYPES = new Set(['offer', 'answer', 'candidate', 'peer-joined', 'peer-left', 'sync', 'auth-ok', 'error']);

function isValidPeerId(id: unknown): id is string {
  return typeof id === 'string' && VALID_PEER_ID.test(id);
}

function isValidSignalingMessage(msg: unknown): msg is Record<string, unknown> {
  if (typeof msg !== 'object' || msg === null) return false;
  const obj = msg as Record<string, unknown>;
  if (typeof obj['type'] !== 'string') return false;
  if (!VALID_SIGNALING_TYPES.has(obj['type'])) return false;
  return true;
}

function isValidSDP(sdp: unknown): sdp is RTCSessionDescriptionInit {
  if (typeof sdp !== 'object' || sdp === null) return false;
  const obj = sdp as Record<string, unknown>;
  return typeof obj['type'] === 'string' && typeof obj['sdp'] === 'string';
}

function isValidCandidate(candidate: unknown): candidate is RTCIceCandidateInit {
  if (typeof candidate !== 'object' || candidate === null) return false;
  const obj = candidate as Record<string, unknown>;
  return typeof obj['candidate'] === 'string';
}

// --- WebSocket Sync Provider ---

export class WebSocketSyncProvider implements SyncProvider {
  readonly name = 'websocket';
  private config: WebSocketSyncConfig;
  private ws: WebSocket | null = null;
  private connected = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private stateHandlers: Set<(state: ConnectionState) => void> = new Set();
  private doc: YDoc | null = null;
  private sessionId: string | null = null;

  constructor(config: WebSocketSyncConfig) {
    this.config = config;
  }

  async connect(doc: YDoc, sessionId: string): Promise<void> {
    this.doc = doc;
    this.sessionId = sessionId;

    return new Promise((resolve, reject) => {
      try {
        const url = `${this.config.url}/${sessionId}`;

        // Enforce wss:// when auth token is configured
        if (this.config.auth?.token && url.startsWith('ws://')) {
          reject(new Error('@phozart/phz-collab: Auth token requires a secure connection (wss://). Refusing to send credentials over unencrypted ws://.'));
          return;
        }

        this.ws = new WebSocket(url, this.config.protocols);

        this.ws.onopen = () => {
          this.connected = true;
          this.reconnectAttempts = 0;
          this.notifyState('connected');

          // Send auth if configured
          if (this.config.auth?.token) {
            this.ws!.send(JSON.stringify({ type: 'auth', token: this.config.auth.token }));
          }

          resolve();
        };

        this.ws.onclose = () => {
          this.connected = false;
          this.notifyState('disconnected');
          this.attemptReconnect();
        };

        this.ws.onerror = () => {
          if (!this.connected) {
            reject(new Error(`WebSocket connection failed: ${this.config.url}`));
          }
          this.notifyState('error');
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    this.notifyState('disconnected');
  }

  isConnected(): boolean {
    return this.connected;
  }

  onConnectionStateChange(handler: (state: ConnectionState) => void): Unsubscribe {
    this.stateHandlers.add(handler);
    return () => { this.stateHandlers.delete(handler); };
  }

  private handleMessage(data: unknown): void {
    // In a real implementation, this would decode Yjs sync protocol messages
    // and apply them to the local document. For now, this is a stub.
    if (typeof data === 'string') {
      try {
        const msg = JSON.parse(data) as Record<string, unknown>;
        if (msg['type'] === 'sync' && this.doc) {
          // Apply Yjs update from remote
        }
      } catch {
        // Binary data or non-JSON — would be Yjs protocol
      }
    }
  }

  private attemptReconnect(): void {
    const maxAttempts = this.config.maxReconnectAttempts ?? 10;
    if (this.reconnectAttempts >= maxAttempts) return;

    this.reconnectAttempts++;
    this.notifyState('reconnecting');

    const interval = this.config.reconnectInterval ?? 2000;
    this.reconnectTimer = setTimeout(() => {
      if (this.doc && this.sessionId) {
        this.connect(this.doc, this.sessionId).catch(() => {
          // Reconnect failed, will retry
        });
      }
    }, interval * Math.min(this.reconnectAttempts, 5));
  }

  private notifyState(state: ConnectionState): void {
    for (const handler of this.stateHandlers) {
      handler(state);
    }
  }
}

// --- WebRTC Sync Provider ---

export class WebRTCSyncProvider implements SyncProvider {
  readonly name = 'webrtc';
  private config: WebRTCSyncConfig;
  private connected = false;
  private stateHandlers: Set<(state: ConnectionState) => void> = new Set();
  private signalingWs: WebSocket | null = null;
  private peers: Map<string, RTCPeerConnection> = new Map();
  private doc: YDoc | null = null;

  constructor(config: WebRTCSyncConfig) {
    this.config = config;
  }

  async connect(doc: YDoc, sessionId: string): Promise<void> {
    this.doc = doc;
    this.notifyState('connecting');

    return new Promise((resolve, reject) => {
      try {
        const VALID_SESSION_ID = /^[a-zA-Z0-9_-]{1,128}$/;
        if (!VALID_SESSION_ID.test(sessionId)) {
          reject(new Error('@phozart/phz-collab: Invalid session ID format. Only alphanumeric, hyphen, and underscore allowed (max 128 chars).'));
          return;
        }

        // Connect to signaling server
        this.signalingWs = new WebSocket(this.config.signalingServer);

        this.signalingWs.onopen = () => {
          // Join the session room
          this.signalingWs!.send(JSON.stringify({ type: 'join', sessionId }));
          this.connected = true;
          this.notifyState('connected');
          resolve();
        };

        this.signalingWs.onclose = () => {
          this.connected = false;
          this.notifyState('disconnected');
        };

        this.signalingWs.onerror = () => {
          if (!this.connected) {
            reject(new Error(`WebRTC signaling connection failed: ${this.config.signalingServer}`));
          }
          this.notifyState('error');
        };

        this.signalingWs.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data as string);
            if (isValidSignalingMessage(parsed)) {
              this.handleSignalingMessage(parsed);
            }
          } catch {
            // Malformed JSON — ignore
          }
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  async disconnect(): Promise<void> {
    // Close all peer connections
    for (const [, peer] of this.peers) {
      peer.close();
    }
    this.peers.clear();

    if (this.signalingWs) {
      this.signalingWs.close();
      this.signalingWs = null;
    }

    this.connected = false;
    this.notifyState('disconnected');
  }

  isConnected(): boolean {
    return this.connected;
  }

  onConnectionStateChange(handler: (state: ConnectionState) => void): Unsubscribe {
    this.stateHandlers.add(handler);
    return () => { this.stateHandlers.delete(handler); };
  }

  private handleSignalingMessage(msg: Record<string, unknown>): void {
    const type = msg['type'];
    const peerId = msg['peerId'];

    if (!isValidPeerId(peerId) && type !== 'auth-ok' && type !== 'error') {
      return; // Invalid or missing peerId
    }

    if (type === 'offer' && isValidPeerId(peerId) && isValidSDP(msg['sdp'])) {
      this.handleOffer(peerId, msg['sdp']);
    } else if (type === 'answer' && isValidPeerId(peerId) && isValidSDP(msg['sdp'])) {
      this.handleAnswer(peerId, msg['sdp']);
    } else if (type === 'candidate' && isValidPeerId(peerId) && isValidCandidate(msg['candidate'])) {
      this.handleCandidate(peerId, msg['candidate']);
    } else if (type === 'peer-joined' && isValidPeerId(peerId)) {
      this.createOffer(peerId);
    }
  }

  private async createOffer(peerId: string): Promise<void> {
    const pc = this.createPeerConnection(peerId);
    const channel = pc.createDataChannel('yjs-sync');
    this.setupDataChannel(channel);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    this.signalingWs?.send(JSON.stringify({
      type: 'offer',
      peerId,
      sdp: pc.localDescription,
    }));
  }

  private async handleOffer(peerId: string, sdp: RTCSessionDescriptionInit): Promise<void> {
    const pc = this.createPeerConnection(peerId);
    pc.ondatachannel = (event) => {
      this.setupDataChannel(event.channel);
    };

    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    this.signalingWs?.send(JSON.stringify({
      type: 'answer',
      peerId,
      sdp: pc.localDescription,
    }));
  }

  private async handleAnswer(peerId: string, sdp: RTCSessionDescriptionInit): Promise<void> {
    const pc = this.peers.get(peerId);
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    }
  }

  private async handleCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const pc = this.peers.get(peerId);
    if (pc) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  private createPeerConnection(peerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({
      iceServers: this.config.iceServers ?? [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.signalingWs?.send(JSON.stringify({
          type: 'candidate',
          peerId,
          candidate: event.candidate,
        }));
      }
    };

    this.peers.set(peerId, pc);
    return pc;
  }

  private setupDataChannel(channel: RTCDataChannel): void {
    channel.onmessage = (_event) => {
      // In a real implementation, decode Yjs sync messages
      // and apply to the local document
    };

    channel.onopen = () => {
      // Send initial sync state
    };
  }

  private notifyState(state: ConnectionState): void {
    for (const handler of this.stateHandlers) {
      handler(state);
    }
  }
}
