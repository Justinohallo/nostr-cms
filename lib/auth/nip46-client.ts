'use client';

import { Event, verifyEvent } from 'nostr-tools';

/**
 * NIP-46 client for browser-side connection management
 * This handles the connection to the user's Nostr app
 */
export class Nip46Client {
  private relay: string;
  private appSecret: string;
  private appPublicKey: string;
  private remotePublicKey: string | null = null;
  private connected: boolean = false;
  private messageHandlers: Map<string, (response: any) => void> = new Map();

  constructor(relay: string, appSecret: string, appPublicKey: string) {
    this.relay = relay;
    this.appSecret = appSecret;
    this.appPublicKey = appPublicKey;
  }

  /**
   * Generate connection URI for user to scan
   */
  getConnectionURI(): string {
    return `nostrconnect://${this.appPublicKey}?relay=${encodeURIComponent(this.relay)}&metadata=${encodeURIComponent(JSON.stringify({ name: 'Nostr CMS' }))}`;
  }

  /**
   * Connect to remote signer
   * This should be called after user scans QR code
   */
  async connect(remotePublicKey: string): Promise<void> {
    this.remotePublicKey = remotePublicKey;
    // In a real implementation, you'd establish a WebSocket connection here
    // For now, we'll use a simpler approach where the user's app signs events
    this.connected = true;
  }

  /**
   * Request signature for an event
   * This sends a request to the user's Nostr app to sign the event
   */
  async signEvent(eventTemplate: {
    kind: number;
    created_at: number;
    tags: string[][];
    content: string;
  }): Promise<Event> {
    if (!this.connected || !this.remotePublicKey) {
      throw new Error('Not connected to remote signer');
    }

    // In a real NIP-46 implementation, this would:
    // 1. Send a "sign_event" request via WebSocket
    // 2. Wait for the remote signer to respond
    // 3. Return the signed event
    
    // For now, we'll use a simpler approach:
    // The client will use window.nostr if available (NIP-07 fallback)
    // or prompt the user to sign via their app
    
    if (typeof window !== 'undefined' && (window as any).nostr) {
      // NIP-07 fallback - use browser extension
      const signedEvent = await (window as any).nostr.signEvent(eventTemplate);
      if (verifyEvent(signedEvent)) {
        return signedEvent;
      }
      throw new Error('Invalid signature from NIP-07');
    }

    // For NIP-46, we'd need to implement the full protocol
    // This is a simplified version - in production, you'd use a library
    // like @nostr-connect/connect or implement the full WebSocket protocol
    throw new Error('NIP-46 signing not fully implemented. Please use a NIP-07 browser extension.');
  }

  isConnected(): boolean {
    return this.connected;
  }
}

