/**
 * @phozart/phz-collab — Sync Providers
 *
 * WebSocket and WebRTC sync provider implementations.
 * These connect Yjs documents to remote peers for real-time collaboration.
 */
// --- Validation Helpers ---
const VALID_PEER_ID = /^[a-zA-Z0-9_-]{1,128}$/;
const VALID_SIGNALING_TYPES = new Set(['offer', 'answer', 'candidate', 'peer-joined', 'peer-left', 'sync', 'auth-ok', 'error']);
function isValidPeerId(id) {
    return typeof id === 'string' && VALID_PEER_ID.test(id);
}
function isValidSignalingMessage(msg) {
    if (typeof msg !== 'object' || msg === null)
        return false;
    const obj = msg;
    if (typeof obj['type'] !== 'string')
        return false;
    if (!VALID_SIGNALING_TYPES.has(obj['type']))
        return false;
    return true;
}
function isValidSDP(sdp) {
    if (typeof sdp !== 'object' || sdp === null)
        return false;
    const obj = sdp;
    return typeof obj['type'] === 'string' && typeof obj['sdp'] === 'string';
}
function isValidCandidate(candidate) {
    if (typeof candidate !== 'object' || candidate === null)
        return false;
    const obj = candidate;
    return typeof obj['candidate'] === 'string';
}
// --- WebSocket Sync Provider ---
export class WebSocketSyncProvider {
    name = 'websocket';
    config;
    ws = null;
    connected = false;
    reconnectTimer = null;
    reconnectAttempts = 0;
    stateHandlers = new Set();
    doc = null;
    sessionId = null;
    constructor(config) {
        this.config = config;
    }
    async connect(doc, sessionId) {
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
                        this.ws.send(JSON.stringify({ type: 'auth', token: this.config.auth.token }));
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
            }
            catch (err) {
                reject(err);
            }
        });
    }
    async disconnect() {
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
    isConnected() {
        return this.connected;
    }
    onConnectionStateChange(handler) {
        this.stateHandlers.add(handler);
        return () => { this.stateHandlers.delete(handler); };
    }
    handleMessage(data) {
        // In a real implementation, this would decode Yjs sync protocol messages
        // and apply them to the local document. For now, this is a stub.
        if (typeof data === 'string') {
            try {
                const msg = JSON.parse(data);
                if (msg['type'] === 'sync' && this.doc) {
                    // Apply Yjs update from remote
                }
            }
            catch {
                // Binary data or non-JSON — would be Yjs protocol
            }
        }
    }
    attemptReconnect() {
        const maxAttempts = this.config.maxReconnectAttempts ?? 10;
        if (this.reconnectAttempts >= maxAttempts)
            return;
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
    notifyState(state) {
        for (const handler of this.stateHandlers) {
            handler(state);
        }
    }
}
// --- WebRTC Sync Provider ---
export class WebRTCSyncProvider {
    name = 'webrtc';
    config;
    connected = false;
    stateHandlers = new Set();
    signalingWs = null;
    peers = new Map();
    doc = null;
    constructor(config) {
        this.config = config;
    }
    async connect(doc, sessionId) {
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
                    this.signalingWs.send(JSON.stringify({ type: 'join', sessionId }));
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
                        const parsed = JSON.parse(event.data);
                        if (isValidSignalingMessage(parsed)) {
                            this.handleSignalingMessage(parsed);
                        }
                    }
                    catch {
                        // Malformed JSON — ignore
                    }
                };
            }
            catch (err) {
                reject(err);
            }
        });
    }
    async disconnect() {
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
    isConnected() {
        return this.connected;
    }
    onConnectionStateChange(handler) {
        this.stateHandlers.add(handler);
        return () => { this.stateHandlers.delete(handler); };
    }
    handleSignalingMessage(msg) {
        const type = msg['type'];
        const peerId = msg['peerId'];
        if (!isValidPeerId(peerId) && type !== 'auth-ok' && type !== 'error') {
            return; // Invalid or missing peerId
        }
        if (type === 'offer' && isValidPeerId(peerId) && isValidSDP(msg['sdp'])) {
            this.handleOffer(peerId, msg['sdp']);
        }
        else if (type === 'answer' && isValidPeerId(peerId) && isValidSDP(msg['sdp'])) {
            this.handleAnswer(peerId, msg['sdp']);
        }
        else if (type === 'candidate' && isValidPeerId(peerId) && isValidCandidate(msg['candidate'])) {
            this.handleCandidate(peerId, msg['candidate']);
        }
        else if (type === 'peer-joined' && isValidPeerId(peerId)) {
            this.createOffer(peerId);
        }
    }
    async createOffer(peerId) {
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
    async handleOffer(peerId, sdp) {
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
    async handleAnswer(peerId, sdp) {
        const pc = this.peers.get(peerId);
        if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        }
    }
    async handleCandidate(peerId, candidate) {
        const pc = this.peers.get(peerId);
        if (pc) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
    }
    createPeerConnection(peerId) {
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
    setupDataChannel(channel) {
        channel.onmessage = (_event) => {
            // In a real implementation, decode Yjs sync messages
            // and apply to the local document
        };
        channel.onopen = () => {
            // Send initial sync state
        };
    }
    notifyState(state) {
        for (const handler of this.stateHandlers) {
            handler(state);
        }
    }
}
//# sourceMappingURL=sync-providers.js.map