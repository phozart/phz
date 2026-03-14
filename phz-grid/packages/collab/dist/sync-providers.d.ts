/**
 * @phozart/collab — Sync Providers
 *
 * WebSocket and WebRTC sync provider implementations.
 * These connect Yjs documents to remote peers for real-time collaboration.
 */
import type { Unsubscribe } from '@phozart/core';
import type { SyncProvider, ConnectionState, YDoc, WebSocketSyncConfig, WebRTCSyncConfig } from './types.js';
export declare class WebSocketSyncProvider implements SyncProvider {
    readonly name = "websocket";
    private config;
    private ws;
    private connected;
    private reconnectTimer;
    private reconnectAttempts;
    private stateHandlers;
    private doc;
    private sessionId;
    constructor(config: WebSocketSyncConfig);
    connect(doc: YDoc, sessionId: string): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    onConnectionStateChange(handler: (state: ConnectionState) => void): Unsubscribe;
    private handleMessage;
    private attemptReconnect;
    private notifyState;
}
export declare class WebRTCSyncProvider implements SyncProvider {
    readonly name = "webrtc";
    private config;
    private connected;
    private stateHandlers;
    private signalingWs;
    private peers;
    private doc;
    constructor(config: WebRTCSyncConfig);
    connect(doc: YDoc, sessionId: string): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    onConnectionStateChange(handler: (state: ConnectionState) => void): Unsubscribe;
    private handleSignalingMessage;
    private createOffer;
    private handleOffer;
    private handleAnswer;
    private handleCandidate;
    private createPeerConnection;
    private setupDataChannel;
    private notifyState;
}
//# sourceMappingURL=sync-providers.d.ts.map