import { Inject } from 'services/core';
import { EApiPermissions, IApiContext, Module, apiEvent, apiMethod } from './module';
import { TwitchService, UserService } from 'app-services';
import { Subject } from 'rxjs';

interface IChatMessage {
  username: string;
  message: string;
}

export class TwitchModule extends Module {
  moduleName = 'Twitch';
  permissions: EApiPermissions[] = [];

  // This module allows use of our local twitch credentials, so only
  // allow streamlabs internal apps to access it.
  requiresHighlyPrivileged = true;

  @Inject() twitchService: TwitchService;
  @Inject() userService: UserService;

  @apiMethod()
  hasSendChatScope() {
    return this.twitchService.state.hasChatWritePermission;
  }

  @apiMethod()
  async sendChatMessage(ctx: IApiContext, msg: string) {
    await this.twitchService.sendChatMessage(msg);
  }

  @apiMethod()
  requestNewScopes() {
    this.userService.startAuth('twitch', 'external', false, true);
  }

  @apiMethod()
  subscribeToChat() {
    const TWITCH_IRC_URL = "wss://irc-ws.chat.twitch.tv";
    const BOT_USERNAME = "StreamCoach"; // Replace with your bot's username
    const OAUTH_TOKEN = `oauth:${this.userService.state.auth.platforms.twitch.token}`; // Replace with your Twitch OAuth token (format: oauth:token)
    const CHANNEL = "AvaActually"; // Replace with the channel you want to join
    
    const connectToTwitchChat = () => {
      const ws = new WebSocket(TWITCH_IRC_URL);
    
      ws.onopen = () => {
        console.log("Connected to Twitch IRC");
    
        // Authenticate
        ws.send(`PASS ${OAUTH_TOKEN}`);
        ws.send(`NICK ${BOT_USERNAME}`);
    
        // Join the channel
        ws.send(`JOIN #${CHANNEL}`);
      };
    
      ws.onmessage = (event) => {
        const message = event.data as string;
    
        // Ping-Pong to keep the connection alive
        if (message.startsWith("PING")) {
          ws.send("PONG :tmi.twitch.tv");
          return;
        }
    
        // Parse chat messages
        const chatMessageRegex = /:(?<username>\w+)!\w+@\w+\.tmi\.twitch\.tv PRIVMSG #\w+ :(?<message>.+)/;
        const match = message.match(chatMessageRegex);
    
        if (match && match.groups) {
          const { username, message: chatMessage } = match.groups;
          console.log(`[${username}]: ${chatMessage}`);

          this.onChat.next({ username, message: chatMessage });
        }
      };
    
      ws.onclose = () => {
        console.log("Disconnected from Twitch IRC");
      };
    
      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    };
    
    // Run the function to connect
    connectToTwitchChat();
    
  }

  @apiEvent()
  onChat = new Subject<IChatMessage>();
}