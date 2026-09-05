import { GameRoom, GamePlayer, ActionLogEntry } from '../types';
import { SNAKES, LADDERS, RANDOM_BOT_NAMES } from '../data/gameConstants';
import { createDiceRollChallenge, createSnakeBiteChallenge, createBonusThrowChallenge } from './mathChallenge';

export class LocalGameEngine {
  private room: GameRoom | null = null;
  private onUpdate: (room: GameRoom) => void;
  private botTimer: any = null;

  constructor(onUpdate: (room: GameRoom) => void) {
    this.onUpdate = onUpdate;
  }

  public getRoom(): GameRoom | null {
    return this.room;
  }

  private emitUpdate() {
    if (this.room) {
      this.onUpdate({ ...this.room, players: this.room.players.map((p) => ({ ...p })) });
    }
  }

  public quickMatch(playerProfile: { username: string; skinId: string }, isTournament: boolean = false): GameRoom {
    this.clearBotTimer();
    const humanPlayer: GamePlayer = {
      id: 'local_human',
      username: playerProfile.username || 'SpeedViper',
      skinId: playerProfile.skinId || 'emerald_viper',
      position: 1,
      mathStreak: 0,
      isBot: false,
      score: 0,
      consecutiveExtraTurns: 0,
      avatarIndex: 0,
      isHost: true,
      isReady: true,
    };

    const randomBotName = RANDOM_BOT_NAMES[Math.floor(Math.random() * RANDOM_BOT_NAMES.length)];
    const botPlayer: GamePlayer = {
      id: 'local_bot_1',
      username: randomBotName,
      skinId: 'neon_cyber',
      position: 1,
      mathStreak: 0,
      isBot: true,
      score: 0,
      consecutiveExtraTurns: 0,
      avatarIndex: 1,
      isReady: true,
    };

    const newRoom: GameRoom = {
      id: `LOCAL-${Math.floor(1000 + Math.random() * 9000)}`,
      name: isTournament ? 'Tournament Match' : 'Quick Match',
      isPrivate: false,
      isTournament,
      timerDuration: 10,
      maxPlayers: 2,
      players: [humanPlayer, botPlayer],
      status: 'in_progress',
      currentTurnIndex: 0,
      diceValue: 1,
      extraTurnAwarded: false,
      createdAt: Date.now(),
      actionLog: [
        {
          id: `log_${Date.now()}`,
          playerId: humanPlayer.id,
          playerName: humanPlayer.username,
          text: `Match started! ${humanPlayer.username} vs ${botPlayer.username}`,
          type: 'info',
          timestamp: Date.now(),
        },
      ],
      activeChallenge: null,
      winner: null,
    };

    this.room = newRoom;
    this.emitUpdate();
    return newRoom;
  }

  public createRoom(
    roomName: string,
    timerDuration: 5 | 10,
    isPrivate: boolean,
    isTournament: boolean,
    playerProfile: { username: string; skinId: string }
  ): GameRoom {
    this.clearBotTimer();
    const humanPlayer: GamePlayer = {
      id: 'local_human',
      username: playerProfile.username || 'Host',
      skinId: playerProfile.skinId || 'emerald_viper',
      position: 1,
      mathStreak: 0,
      isBot: false,
      score: 0,
      consecutiveExtraTurns: 0,
      avatarIndex: 0,
      isHost: true,
      isReady: true,
    };

    const newRoom: GameRoom = {
      id: `LOCAL-ROOM-${Math.floor(1000 + Math.random() * 9000)}`,
      name: roomName || 'Custom Arena',
      isPrivate,
      isTournament,
      timerDuration,
      maxPlayers: 2,
      players: [humanPlayer],
      status: 'waiting',
      currentTurnIndex: 0,
      diceValue: 1,
      extraTurnAwarded: false,
      createdAt: Date.now(),
      actionLog: [
        {
          id: `log_${Date.now()}`,
          playerId: humanPlayer.id,
          playerName: humanPlayer.username,
          text: `Room created by ${humanPlayer.username}`,
          type: 'info',
          timestamp: Date.now(),
        },
      ],
      activeChallenge: null,
      winner: null,
    };

    this.room = newRoom;
    this.emitUpdate();
    return newRoom;
  }

  public addBot() {
    if (!this.room || this.room.players.length >= this.room.maxPlayers) return;
    const botName = RANDOM_BOT_NAMES[Math.floor(Math.random() * RANDOM_BOT_NAMES.length)];
    const bot: GamePlayer = {
      id: `local_bot_${Date.now()}`,
      username: botName,
      skinId: 'neon_cyber',
      position: 1,
      mathStreak: 0,
      isBot: true,
      score: 0,
      consecutiveExtraTurns: 0,
      avatarIndex: 1,
      isReady: true,
    };
    this.room.players.push(bot);
    this.room.actionLog.unshift({
      id: `log_${Date.now()}`,
      playerId: bot.id,
      playerName: bot.username,
      text: `${bot.username} joined the match`,
      type: 'info',
      timestamp: Date.now(),
    });
    this.emitUpdate();
  }

  public startGame() {
    if (!this.room) return;
    if (this.room.players.length === 1) {
      this.addBot();
    }
    this.room.status = 'in_progress';
    this.room.currentTurnIndex = 0;
    this.room.actionLog.unshift({
      id: `log_${Date.now()}`,
      playerId: 'system',
      playerName: 'System',
      text: `The race to tile 100 begins!`,
      type: 'info',
      timestamp: Date.now(),
    });
    this.emitUpdate();
  }

  public rollDice() {
    if (!this.room || this.room.status !== 'in_progress' || this.room.activeChallenge) return;
    const currentPlayer = this.room.players[this.room.currentTurnIndex];
    if (!currentPlayer) return;

    const dice = Math.floor(Math.random() * 6) + 1;
    this.room.diceValue = dice;
    this.room.actionLog.unshift({
      id: `log_${Date.now()}`,
      playerId: currentPlayer.id,
      playerName: currentPlayer.username,
      text: `🎲 ${currentPlayer.username} rolled a ${dice}! Answer the math challenge to move!`,
      type: 'roll',
      timestamp: Date.now(),
    });

    const challenge = createDiceRollChallenge(
      currentPlayer.id,
      currentPlayer.position,
      dice,
      this.room.timerDuration
    );
    this.room.activeChallenge = challenge;
    this.emitUpdate();
  }

  public submitMathAnswer(answer: number) {
    if (!this.room || !this.room.activeChallenge) return;
    const currentPlayer = this.room.players[this.room.currentTurnIndex];
    if (!currentPlayer) return;

    const challenge = this.room.activeChallenge;
    const isCorrect = answer === challenge.correctAnswer;

    if (challenge.type === 'dice_move') {
      if (isCorrect) {
        currentPlayer.mathStreak += 1;
        const targetTile = Math.min(100, currentPlayer.position + (challenge.rolledValue || 1));
        currentPlayer.position = targetTile;
        this.room.actionLog.unshift({
          id: `log_${Date.now()}`,
          playerId: currentPlayer.id,
          playerName: currentPlayer.username,
          text: `🎯 ${currentPlayer.username} answered correctly! Advanced to tile ${targetTile}.`,
          type: 'math_success',
          timestamp: Date.now(),
        });

        // Check for victory
        if (currentPlayer.position >= 100) {
          currentPlayer.position = 100;
          this.room.status = 'game_over';
          this.room.winner = currentPlayer;
          this.room.activeChallenge = null;
          this.room.actionLog.unshift({
            id: `log_${Date.now()}`,
            playerId: currentPlayer.id,
            playerName: currentPlayer.username,
            text: `👑 VICTORY! ${currentPlayer.username} reached tile 100!`,
            type: 'win',
            timestamp: Date.now(),
          });
          this.emitUpdate();
          return;
        }

        // Check for Ladder
        const ladder = LADDERS.find((l) => l.bottom === targetTile);
        if (ladder) {
          currentPlayer.position = ladder.top;
          this.room.actionLog.unshift({
            id: `log_${Date.now()}`,
            playerId: currentPlayer.id,
            playerName: currentPlayer.username,
            text: `🪜 LADDER CLIMB! ${currentPlayer.username} climbed from ${ladder.bottom} to ${ladder.top}!`,
            type: 'ladder_climb',
            timestamp: Date.now(),
          });
        }

        // Check for Snake
        const snake = SNAKES.find((s) => s.head === targetTile);
        if (snake) {
          currentPlayer.position = snake.tail;
          this.room.actionLog.unshift({
            id: `log_${Date.now()}`,
            playerId: currentPlayer.id,
            playerName: currentPlayer.username,
            text: `🐍 SNAKE BITE! ${currentPlayer.username} slid from ${snake.head} down to ${snake.tail}!`,
            type: 'snake_slide',
            timestamp: Date.now(),
          });

          // Trigger snake bite escape challenge
          this.room.activeChallenge = createSnakeBiteChallenge(
            currentPlayer.id,
            snake.head,
            snake.tail,
            this.room.timerDuration
          );
          this.emitUpdate();
          return;
        }

        this.finishTurn();
      } else {
        // Wrong answer
        currentPlayer.mathStreak = 0;
        this.room.actionLog.unshift({
          id: `log_${Date.now()}`,
          playerId: currentPlayer.id,
          playerName: currentPlayer.username,
          text: `❌ ${currentPlayer.username} answered incorrectly. Token stays on tile ${currentPlayer.position}.`,
          type: 'math_fail',
          timestamp: Date.now(),
        });
        this.finishTurn();
      }
    } else if (challenge.type === 'snake_bite') {
      if (isCorrect) {
        currentPlayer.mathStreak += 1;
        this.room.actionLog.unshift({
          id: `log_${Date.now()}`,
          playerId: currentPlayer.id,
          playerName: currentPlayer.username,
          text: `✨ ${currentPlayer.username} solved the Snake Bite Challenge! Bonus Question unlocked!`,
          type: 'bonus_award',
          timestamp: Date.now(),
        });
        // Offer bonus question for extra throw
        this.room.activeChallenge = createBonusThrowChallenge(currentPlayer.id, 8);
        this.emitUpdate();
        return;
      } else {
        currentPlayer.mathStreak = 0;
        this.room.actionLog.unshift({
          id: `log_${Date.now()}`,
          playerId: currentPlayer.id,
          playerName: currentPlayer.username,
          text: `❌ Snake escape failed. Turn ends.`,
          type: 'math_fail',
          timestamp: Date.now(),
        });
        this.finishTurn();
      }
    } else if (challenge.type === 'bonus_extra_throw') {
      if (isCorrect) {
        currentPlayer.mathStreak += 1;
        this.room.extraTurnAwarded = true;
        this.room.actionLog.unshift({
          id: `log_${Date.now()}`,
          playerId: currentPlayer.id,
          playerName: currentPlayer.username,
          text: `🎉 BONUS SOLVED! ${currentPlayer.username} EARNED AN EXTRA DICE THROW!`,
          type: 'bonus_award',
          timestamp: Date.now(),
        });
        this.room.activeChallenge = null;
        this.emitUpdate();
        if (currentPlayer.isBot && this.room.status === 'in_progress') {
          this.scheduleBotTurn();
        }
        return;
      } else {
        this.room.actionLog.unshift({
          id: `log_${Date.now()}`,
          playerId: currentPlayer.id,
          playerName: currentPlayer.username,
          text: `Bonus question missed. Turn ends.`,
          type: 'math_fail',
          timestamp: Date.now(),
        });
        this.finishTurn();
      }
    }
  }

  public handleTimeout() {
    if (!this.room || !this.room.activeChallenge) return;
    const currentPlayer = this.room.players[this.room.currentTurnIndex];
    if (currentPlayer) {
      currentPlayer.mathStreak = 0;
      this.room.actionLog.unshift({
        id: `log_${Date.now()}`,
        playerId: currentPlayer.id,
        playerName: currentPlayer.username,
        text: `⏳ Time expired for ${currentPlayer.username}!`,
        type: 'math_fail',
        timestamp: Date.now(),
      });
    }
    this.finishTurn();
  }

  private finishTurn() {
    if (!this.room) return;
    this.room.activeChallenge = null;

    if (this.room.extraTurnAwarded) {
      this.room.extraTurnAwarded = false;
      this.emitUpdate();
      const current = this.room.players[this.room.currentTurnIndex];
      if (current && current.isBot && this.room.status === 'in_progress') {
        this.scheduleBotTurn();
      }
      return;
    }

    // Advance turn
    this.room.currentTurnIndex = (this.room.currentTurnIndex + 1) % this.room.players.length;
    const nextPlayer = this.room.players[this.room.currentTurnIndex];
    this.room.actionLog.unshift({
      id: `log_${Date.now()}`,
      playerId: nextPlayer.id,
      playerName: nextPlayer.username,
      text: `Turn passed to ${nextPlayer.username}`,
      type: 'info',
      timestamp: Date.now(),
    });
    this.emitUpdate();

    // Check if next player is a bot
    if (nextPlayer.isBot && this.room.status === 'in_progress') {
      this.scheduleBotTurn();
    }
  }

  private scheduleBotTurn() {
    this.clearBotTimer();
    this.botTimer = setTimeout(() => {
      this.stepBotTurn();
    }, 450);
  }

  private stepBotTurn() {
    this.clearBotTimer();
    if (!this.room || this.room.status !== 'in_progress') return;
    const currentPlayer = this.room.players[this.room.currentTurnIndex];
    if (!currentPlayer || !currentPlayer.isBot) return;

    // Case 1: Bot has an active challenge to answer
    if (this.room.activeChallenge) {
      const chal = this.room.activeChallenge;
      // 85% chance to answer correctly
      const isCorrect = Math.random() < 0.85;
      const answer = isCorrect ? chal.correctAnswer : chal.options[0];

      this.submitMathAnswer(answer);

      // Check if subsequent challenge was generated for the bot (e.g. snake escape or bonus)
      if (this.room && this.room.status === 'in_progress') {
        const nextCurrent = this.room.players[this.room.currentTurnIndex];
        if (nextCurrent && nextCurrent.isBot && this.room.activeChallenge) {
          this.scheduleBotTurn();
        }
      }
      return;
    }

    // Case 2: Bot needs to roll the dice
    this.rollDice();

    // After rolling, dice challenge was created, schedule bot answer
    if (this.room && this.room.activeChallenge) {
      this.scheduleBotTurn();
    }
  }

  public restartGame() {
    if (!this.room) return;
    this.clearBotTimer();
    this.room.status = 'in_progress';
    this.room.winner = null;
    this.room.activeChallenge = null;
    this.room.diceValue = 1;
    this.room.extraTurnAwarded = false;
    this.room.players.forEach((p) => {
      p.position = 1;
      p.mathStreak = 0;
    });
    this.room.currentTurnIndex = 0;
    this.room.actionLog = [
      {
        id: `log_${Date.now()}`,
        playerId: 'system',
        playerName: 'System',
        text: `New match started!`,
        type: 'info',
        timestamp: Date.now(),
      },
    ];
    this.emitUpdate();
  }

  public leaveRoom() {
    this.clearBotTimer();
    this.room = null;
  }

  private clearBotTimer() {
    if (this.botTimer) {
      clearTimeout(this.botTimer);
      this.botTimer = null;
    }
  }
}
