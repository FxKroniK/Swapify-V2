import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { Observable, Subject, of } from 'rxjs';
import { delay, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private client!: Client;
  private messageSubject = new Subject<any>(); // Para mensajes de conversación
  private notificationSubject = new Subject<any>(); // Para notificaciones de usuario
  private connectionSubject = new Subject<boolean>();
  private isConnected = false;

  constructor() {
    this.initializeClient();
  }

  private initializeClient(): void {
    try {
      this.client = new Client({
        brokerURL: 'ws://localhost:8085/websocket',
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      this.client.onConnect = () => {
        console.log('WebSocket connected successfully');
        this.isConnected = true;
        this.connectionSubject.next(true);
      };

      this.client.onStompError = (frame) => {
        console.error('WebSocket error:', frame);
        this.isConnected = false;
        this.connectionSubject.next(false);
      };

      this.client.onDisconnect = () => {
        console.log('WebSocket disconnected, attempting to reconnect...');
        this.isConnected = false;
        this.connectionSubject.next(false);
      };
    } catch (error) {
      console.error('Error initializing WebSocket client:', error);
    }
  }

  connect(): Observable<boolean> {
    try {
      if (this.isConnected) {
        console.log('WebSocket already connected');
        return of(true);
      }
      if (!this.client.active) {
        console.log('Activating WebSocket client');
        this.client.activate();
      }
      return this.connectionSubject.asObservable();
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      return of(false);
    }
  }

  disconnect(): void {
    try {
      if (this.client.active) {
        console.log('Deactivating WebSocket client');
        this.client.deactivate();
        this.isConnected = false;
      }
    } catch (error) {
      console.error('Error disconnecting from WebSocket:', error);
    }
  }

  subscribeToConversation(conversationId: number): Observable<any> {
    if (!this.isConnected) {
      console.warn(`Cannot subscribe to /topic/conversations/${conversationId}: WebSocket not connected`);
      return this.connect().pipe(
        delay(1000),
        switchMap((connected) => {
          if (connected) {
            return this.subscribeToTopic(conversationId);
          } else {
            throw new Error('Failed to connect to WebSocket');
          }
        })
      );
    }
    return this.subscribeToTopic(conversationId);
  }

  private subscribeToTopic(conversationId: number): Observable<any> {
    try {
      console.log(`Subscribing to /topic/conversations/${conversationId}`);
      this.client.subscribe(`/topic/conversations/${conversationId}`, (message: IMessage) => {
        try {
          console.log('Received WebSocket message:', message.body);
          const parsedMessage = JSON.parse(message.body);
          this.messageSubject.next(parsedMessage);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });
      return this.messageSubject.asObservable();
    } catch (error) {
      console.error('Error subscribing to conversation:', error);
      throw error;
    }
  }

  subscribeToUserNotifications(userId: number): Observable<any> {
    if (!this.isConnected) {
      console.warn(`Cannot subscribe to /user/${userId}/notifications: WebSocket not connected`);
      return this.connect().pipe(
        delay(1000),
        switchMap((connected) => {
          if (connected) {
            return this.subscribeToUserTopic(userId);
          } else {
            throw new Error('Failed to connect to WebSocket');
          }
        })
      );
    }
    return this.subscribeToUserTopic(userId);
  }

  private subscribeToUserTopic(userId: number): Observable<any> {
    try {
      console.log(`Subscribing to /user/${userId}/notifications`);
      this.client.subscribe(`/user/${userId}/notifications`, (message: IMessage) => {
        try {
          console.log('Received WebSocket user notification:', message.body);
          const parsedNotification = JSON.parse(message.body);
          this.notificationSubject.next(parsedNotification);
        } catch (error) {
          console.error('Error parsing WebSocket notification:', error);
        }
      });
      return this.notificationSubject.asObservable();
    } catch (error) {
      console.error('Error subscribing to user notifications:', error);
      throw error;
    }
  }
}