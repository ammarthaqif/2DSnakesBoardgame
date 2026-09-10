import { joinRoom } from '@trystero-p2p/nostr';
import { GameRoom, GamePlayer, MathDifficulty } from '../types';
import { LocalGameEngine } from './localGameEngine';

// Fastest global public Nostr relays for WebRTC peer discovery
const NOSTR_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.primal.net',
  'wss://nostr.mom',
  'wss://relay.snort.social',
];

export function sanitizeP2PRoomId(rawCode: string): string {
  const clean = (rawCode || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  return `snake_arena_${clean.toLowerCase()}`;
}

export class P2PGameEngine {
  private p2pRoom: any = null;
  private localEngine: LocalGameEngine | null = null;
  private onUpdate: (room: GameRoom) => void;
  private onStatusMessage?: (message: string, type: 'info' | 'success' | 'error') => void;
  private broadcastChannel: BroadcastChannel | null = null;

  private currentRoom: GameRoom | null = null;
  private isHost: boolean = false;
  private currentRoomId: string = '';
  private localPlayerId: string = '';
  private connectedPeerIds: Set<string> = new Set();

  // Trystero Actions
  private syncAction: any = null;
  private joinReqAction: any = null;
  private gameAction: any = null;

  private joinRetryInterval: any = null;
  private localProfile: { id: string; username: string; skinId: string; mathDifficulty?: MathDifficulty } | null = null;

  constructor(
    onUpdate: (room: GameRoom) => void,
    onStatusMessage?: (message: string, type: 'info' | 'success' | 'error') => void
  ) {
    this.onUpdate = onUpdate;
    this.onStatusMessage = onStatusMessage;

    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel('snake_game_arena_channel');
        this.broadcastChannel.onmessage = (event) => {
          const data = event.data;
          if (!data) return;

          // Local multi-tab: Join request received by Host tab
          if (data.type === 'JOIN_REQUEST' && this.isHost && this.currentRoom) {
            if (data.roomId === this.currentRoomId && data.player) {
              this.handleGuestJoinRequest(data.player, 'local_bc');
            }
          }

          // Local multi-tab: Room state update received by Guest tab
          if (data.type === 'ROOM_UPDATE' && data.room) {
            if (this.currentRoomId && data.room.id === this.currentRoomId) {
              if (!this.isHost) {
                this.currentRoom = data.room;
                this.onUpdate(data.room);
              }
            }
          }

          // Local multi-tab: Game action received by Host tab
          if (data.type === 'GAME_ACTION' && this.isHost && this.localEngine) {
            if (data.roomId === this.currentRoomId) {
              this.processGameAction(data.action);
            }
          }
        };
      }
    } catch {
      // BroadcastChannel unavailable
    }
  }

  public getRoom(): GameRoom | null {
    return this.isHost && this.localEngine ? this.localEngine.getRoom() : this.currentRoom;
  }

  public getIsHost(): boolean {
    return this.isHost;
  }

  public getConnectedPeersCount(): number {
    return this.connectedPeerIds.size;
  }

  /**
   * Host creates a new room with given parameters and starts WebRTC P2P listener
   */
  public createRoom(
    roomName: string,
    timerDuration: 5 | 10 | 15,
    isPrivate: boolean,
    isTournament: boolean,
    playerProfile: { id: string; username: string; skinId: string; mathDifficulty?: MathDifficulty },
    maxPlayers: number = 4,
    customCode?: string
  ): GameRoom {
    this.cleanup();
    this.isHost = true;
    this.localPlayerId = playerProfile.id;
    this.localProfile = playerProfile;

    // 1. Authoritative local engine on Host
    this.localEngine = new LocalGameEngine((updatedRoom) => {
      this.currentRoom = updatedRoom;
      this.onUpdate(updatedRoom);
      this.broadcastRoom(updatedRoom);
    });

    const room = this.localEngine.createRoom(
      roomName,
      timerDuration,
      isPrivate,
      isTournament,
      playerProfile,
      maxPlayers,
      customCode
    );

    // Guarantee host player attributes
    if (room.players[0]) {
      room.players[0].id = playerProfile.id;
      room.players[0].isHost = true;
    }

    this.currentRoom = room;
    this.currentRoomId = room.id;

    // 2. Connect WebRTC P2P Room
    this.initP2PRoom(room.id, true, playerProfile);

    this.onStatusMessage?.(`Private Room ${room.id} created! Ready for friends.`, 'success');
    return room;
  }

  /**
   * Quick Match: Host creates room with bot immediately
   */
  public quickMatch(
    playerProfile: { id: string; username: string; skinId: string; mathDifficulty?: MathDifficulty },
    isTournament: boolean = false
  ): GameRoom {
    this.cleanup();
    this.isHost = true;
    this.localPlayerId = playerProfile.id;
    this.localProfile = playerProfile;

    this.localEngine = new LocalGameEngine((updatedRoom) => {
      this.currentRoom = updatedRoom;
      this.onUpdate(updatedRoom);
      this.broadcastRoom(updatedRoom);
    });

    const room = this.localEngine.quickMatch(playerProfile, isTournament);
    if (room.players[0]) {
      room.players[0].id = playerProfile.id;
      room.players[0].isHost = true;
    }

    this.currentRoom = room;
    this.currentRoomId = room.id;
    return room;
  }

  /**
   * Guest joins an existing room by code/link across WebRTC
   */
  public joinRoom(
    roomId: string,
    playerProfile: { id: string; username: string; skinId: string; mathDifficulty?: MathDifficulty }
  ): void {
    this.cleanup();
    this.isHost = false;
    this.localPlayerId = playerProfile.id;
    this.localProfile = playerProfile;
    this.currentRoomId = roomId;

    this.onStatusMessage?.(`Connecting to Room ${roomId} via WebRTC...`, 'info');

    // Initialize WebRTC P2P room as Guest
    this.initP2PRoom(roomId, false, playerProfile);

    // Also notify local BroadcastChannel for instant same-browser tab connection
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'JOIN_REQUEST',
        roomId,
        player: {
          id: playerProfile.id,
          username: playerProfile.username,
          skinId: playerProfile.skinId,
          mathDifficulty: playerProfile.mathDifficulty || 'medium',
        },
      });
    }

    // Try joining immediately and retry every 2 seconds until joined
    let attempts = 0;
    this.joinRetryInterval = setInterval(() => {
      attempts += 1;
      const isAlreadyInRoom = this.currentRoom?.players.some((p) => p.id === playerProfile.id);

      if (isAlreadyInRoom) {
        if (this.joinRetryInterval) {
          clearInterval(this.joinRetryInterval);
          this.joinRetryInterval = null;
        }
        return;
      }

      this.sendJoinRequest(playerProfile);

      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({
          type: 'JOIN_REQUEST',
          roomId,
          player: {
            id: playerProfile.id,
            username: playerProfile.username,
            skinId: playerProfile.skinId,
            mathDifficulty: playerProfile.mathDifficulty || 'medium',
          },
        });
      }

      if (attempts >= 12 && !this.currentRoom) {
        // If room not found after ~24s, notify user
        this.onStatusMessage?.(
          `Still waiting for host of Room ${roomId}. Make sure the host has the room open!`,
          'info'
        );
      }
    }, 2000);
  }

  private initP2PRoom(
    roomId: string,
    isHost: boolean,
    playerProfile: { id: string; username: string; skinId: string; mathDifficulty?: MathDifficulty }
  ) {
    const p2pNamespace = sanitizeP2PRoomId(roomId);

    try {
      this.p2pRoom = joinRoom(
        {
          appId: 'snake_math_boardgame_arena_2026',
          relayConfig: {
            urls: NOSTR_RELAYS,
          },
        },
        p2pNamespace
      );

      // Create Actions
      this.syncAction = this.p2pRoom.makeAction('sync');
      this.joinReqAction = this.p2pRoom.makeAction('join_request');
      this.gameAction = this.p2pRoom.makeAction('game_action');

      // Handlers for HOST
      if (isHost) {
        this.p2pRoom.onPeerJoin((peerId: string) => {
          this.connectedPeerIds.add(peerId);
          this.onStatusMessage?.(`Player connected via P2P!`, 'success');
          // Send current room state to new peer
          if (this.currentRoom) {
            this.syncAction.send(this.currentRoom, { target: peerId });
          }
        });

        this.p2pRoom.onPeerLeave((peerId: string) => {
          this.connectedPeerIds.delete(peerId);
        });

        // Listen for Join Requests
        this.joinReqAction.onMessage = (data: any, { peerId }: { peerId: string }) => {
          if (data?.type === 'JOIN_REQUEST' && data.player) {
            this.handleGuestJoinRequest(data.player, peerId);
          }
        };

        // Listen for Guest Game Actions
        this.gameAction.onMessage = (data: any) => {
          if (!data || !this.localEngine) return;
          this.processGameAction(data);
        };
      } else {
        // Handlers for GUEST
        this.p2pRoom.onPeerJoin((peerId: string) => {
          this.connectedPeerIds.add(peerId);
          // Send join request to peer (host)
          this.sendJoinRequest(playerProfile, peerId);
        });

        this.p2pRoom.onPeerLeave((peerId: string) => {
          this.connectedPeerIds.delete(peerId);
          // If host left, check if we should become the host
          this.handleHostMigration();
        });

        // Receive Room State Sync from Host
        this.syncAction.onMessage = (roomData: GameRoom) => {
          if (roomData && roomData.id === this.currentRoomId) {
            this.currentRoom = roomData;
            this.onUpdate(roomData);

            // Check if our player has been added
            const isInList = roomData.players.some((p) => p.id === playerProfile.id);
            if (!isInList) {
              // Re-send join request if we are not yet in the player list
              this.sendJoinRequest(playerProfile);
            } else {
              if (this.joinRetryInterval) {
                clearInterval(this.joinRetryInterval);
                this.joinRetryInterval = null;
              }
              this.onStatusMessage?.(`Joined Room ${roomData.id}!`, 'success');
            }
          }
        };

        // Send initial broadcast join request
        this.sendJoinRequest(playerProfile);
      }
    } catch (err: any) {
      console.warn('P2P initialization warning:', err?.message);
    }
  }

  private sendJoinRequest(
    playerProfile: { id: string; username: string; skinId: string; mathDifficulty?: MathDifficulty },
    targetPeerId?: string
  ) {
    if (!this.joinReqAction) return;
    const payload = {
      type: 'JOIN_REQUEST',
      roomId: this.currentRoomId,
      player: {
        id: playerProfile.id,
        username: playerProfile.username,
        skinId: playerProfile.skinId,
        mathDifficulty: playerProfile.mathDifficulty || 'medium',
      },
    };

    try {
      if (targetPeerId) {
        this.joinReqAction.send(payload, { target: targetPeerId });
      } else {
        this.joinReqAction.send(payload);
      }
    } catch {
      // transient connection state
    }
  }

  private handleGuestJoinRequest(
    guestProfile: { id: string; username: string; skinId: string; mathDifficulty?: MathDifficulty },
    peerId: string
  ) {
    if (!this.localEngine) return;

    const current = this.localEngine.getRoom();
    if (!current) return;

    const existingPlayer = current.players.find((p) => p.id === guestProfile.id);
    if (existingPlayer) {
      // Re-send current state to rejoining peer
      this.syncAction?.send(current, { target: peerId });
      return;
    }

    if (current.players.length >= current.maxPlayers) {
      return;
    }

    const newPlayer: GamePlayer = {
      id: guestProfile.id,
      username: guestProfile.username || 'GuestPlayer',
      skinId: guestProfile.skinId || 'coral_striker',
      position: 1,
      mathStreak: 0,
      isBot: false,
      score: 0,
      consecutiveExtraTurns: 0,
      avatarIndex: current.players.length,
      isHost: false,
      isReady: true,
      mathDifficulty: guestProfile.mathDifficulty || 'medium',
      turnsWithoutMoving: 0,
    };

    const added = this.localEngine.addExternalPlayer(newPlayer);
    if (added) {
      const updated = this.localEngine.getRoom();
      if (updated) {
        this.currentRoom = updated;
        this.onUpdate(updated);
        this.broadcastRoom(updated);
      }
    }
  }

  private processGameAction(data: any) {
    if (!this.localEngine) return;
    if (data.type === 'ROLL_DICE') {
      this.localEngine.rollDice();
    } else if (data.type === 'ANSWER_CHALLENGE') {
      this.localEngine.submitMathAnswer(data.answer);
    } else if (data.type === 'START_GAME') {
      this.localEngine.startGame();
    } else if (data.type === 'ADD_BOT') {
      this.localEngine.addBot(data.difficulty);
    } else if (data.type === 'RESTART_GAME') {
      this.localEngine.restartGame();
    }
  }

  private handleHostMigration() {
    if (this.isHost || !this.currentRoom || !this.localProfile) return;
    // If the host is gone, check if this player is the next active human
    const humans = this.currentRoom.players.filter((p) => !p.isBot);
    if (humans.length > 0 && humans[0].id === this.localPlayerId) {
      // Take over as Host
      this.isHost = true;
      this.onStatusMessage?.('Host disconnected. You are now the match host!', 'info');
      this.localEngine = new LocalGameEngine((updatedRoom) => {
        this.currentRoom = updatedRoom;
        this.onUpdate(updatedRoom);
        this.broadcastRoom(updatedRoom);
      });
      // Reconnect P2P room as host
      this.initP2PRoom(this.currentRoomId, true, this.localProfile);
    }
  }

  private broadcastRoom(room: GameRoom) {
    if (this.syncAction) {
      try {
        this.syncAction.send(room);
      } catch {}
    }
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ type: 'ROOM_UPDATE', room });
      } catch {}
    }
  }

  public startGame() {
    if (this.isHost && this.localEngine) {
      this.localEngine.startGame();
    } else {
      const payload = { type: 'START_GAME', roomId: this.currentRoomId };
      this.gameAction?.send(payload);
      this.broadcastChannel?.postMessage({ type: 'GAME_ACTION', roomId: this.currentRoomId, action: payload });
    }
  }

  public addBot(difficulty?: MathDifficulty) {
    if (this.isHost && this.localEngine) {
      this.localEngine.addBot(difficulty);
    } else {
      const payload = { type: 'ADD_BOT', roomId: this.currentRoomId, difficulty };
      this.gameAction?.send(payload);
      this.broadcastChannel?.postMessage({ type: 'GAME_ACTION', roomId: this.currentRoomId, action: payload });
    }
  }

  public rollDice() {
    if (this.isHost && this.localEngine) {
      this.localEngine.rollDice();
    } else {
      const payload = { type: 'ROLL_DICE', roomId: this.currentRoomId, playerId: this.localPlayerId };
      this.gameAction?.send(payload);
      this.broadcastChannel?.postMessage({ type: 'GAME_ACTION', roomId: this.currentRoomId, action: payload });
    }
  }

  public submitMathAnswer(answer: number) {
    if (this.isHost && this.localEngine) {
      this.localEngine.submitMathAnswer(answer);
    } else {
      const payload = { type: 'ANSWER_CHALLENGE', roomId: this.currentRoomId, playerId: this.localPlayerId, answer };
      this.gameAction?.send(payload);
      this.broadcastChannel?.postMessage({ type: 'GAME_ACTION', roomId: this.currentRoomId, action: payload });
    }
  }

  public handleTimeout() {
    if (this.isHost && this.localEngine) {
      this.localEngine.handleTimeout();
    }
  }

  public restartGame() {
    if (this.isHost && this.localEngine) {
      this.localEngine.restartGame();
    } else {
      const payload = { type: 'RESTART_GAME', roomId: this.currentRoomId };
      this.gameAction?.send(payload);
      this.broadcastChannel?.postMessage({ type: 'GAME_ACTION', roomId: this.currentRoomId, action: payload });
    }
  }

  public leaveRoom() {
    this.cleanup();
  }

  public cleanup() {
    if (this.joinRetryInterval) {
      clearInterval(this.joinRetryInterval);
      this.joinRetryInterval = null;
    }
    if (this.p2pRoom) {
      try {
        this.p2pRoom.leave();
      } catch {}
      this.p2pRoom = null;
    }
    if (this.localEngine) {
      this.localEngine = null;
    }
    this.currentRoom = null;
    this.currentRoomId = '';
    this.isHost = false;
    this.connectedPeerIds.clear();
  }
}
