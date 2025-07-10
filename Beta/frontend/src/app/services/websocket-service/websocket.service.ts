import { Injectable } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { Observable, Subject, of } from 'rxjs';
import { delay, switchMap, retryWhen, delayWhen } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private client!: Client;
  private messageSubject = new Subject<any>();
  private notificationSubject = new Subject<any>();
  private connectionSubject = new Subject<boolean>();
  private isConnected = false;
  private activeSubscriptions = new Map<string, StompSubscription>();

  constructor() {
    this.initializeClient();
  }

  private initializeClient(): void {
    this.client = new Client({
      brokerURL: 'ws://localhost:8085/websocket',
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => console.log('[WebSocket Debug]:', str), // Habilitar depuración
    });

    this.client.onConnect = () => {
      console.log('[WebSocket] Conectado exitosamente');
      this.isConnected = true;
      this.connectionSubject.next(true);
    };

    this.client.onStompError = (frame) => {
      console.error('[WebSocket] Error:', frame);
      this.isConnected = false;
      this.connectionSubject.next(false);
    };

    this.client.onDisconnect = () => {
      console.log('[WebSocket] Desconectado, intentando reconectar...');
      this.isConnected = false;
      this.connectionSubject.next(false);
    };

    this.client.onWebSocketClose = () => {
      console.log('[WebSocket] Canal cerrado, intentando reconectar...');
      this.isConnected = false;
      this.connectionSubject.next(false);
    };
  }

  connect(): Observable<boolean> {
    if (this.isConnected) {
      console.log('[WebSocket] Ya conectado');
      return of(true);
    }
    if (!this.client.active) {
      console.log('[WebSocket] Activando cliente...');
      this.client.activate();
    }
    return this.connectionSubject.asObservable().pipe(
      retryWhen(errors =>
        errors.pipe(
          delayWhen(() => of(true).pipe(delay(5000))) // Reintento cada 5 segundos
        )
      )
    );
  }

  disconnect(): void {
    // Cancelar todas las suscripciones activas
    this.activeSubscriptions.forEach((subscription, key) => {
      console.log(`[WebSocket] Cancelando suscripción: ${key}`);
      subscription.unsubscribe();
    });
    this.activeSubscriptions.clear();

    if (this.client.active) {
      this.client.deactivate();
      this.isConnected = false;
    }
  }

  subscribeToConversation(conversationId: number): Observable<any> {
    if (!this.isConnected) {
      console.warn(`[WebSocket] No conectado, intentando reconectar para /topic/conversations/${conversationId}`);
      return this.connect().pipe(
        delay(1000),
        switchMap(() => this.subscribeToTopic(conversationId))
      );
    }
    return this.subscribeToTopic(conversationId);
  }

  private subscribeToTopic(conversationId: number): Observable<any> {
    try {
      const topicKey = `/topic/conversations/${conversationId}`;
      
      // Cancelar suscripción existente si la hay
      if (this.activeSubscriptions.has(topicKey)) {
        console.log(`[WebSocket] Cancelando suscripción existente para ${topicKey}`);
        this.activeSubscriptions.get(topicKey)?.unsubscribe();
      }

      console.log(`[WebSocket] Suscribiendo a ${topicKey}`);
      const subscription = this.client.subscribe(topicKey, (message: IMessage) => {
        try {
          console.log(`[WebSocket] Mensaje recibido en ${topicKey}:`, message.body);
          const parsedMessage = JSON.parse(message.body);
          this.messageSubject.next(parsedMessage);
        } catch (error) {
          console.error('[WebSocket] Error al parsear mensaje:', error);
        }
      });
      
      // Guardar la suscripción activa
      this.activeSubscriptions.set(topicKey, subscription);
      return this.messageSubject.asObservable();
    } catch (error) {
      console.error('[WebSocket] Error al suscribirse:', error);
      throw error;
    }
  }

  subscribeToUserNotifications(userId: number): Observable<any> {
    if (!this.isConnected) {
      console.warn(`[WebSocket] No conectado, intentando reconectar para /user/${userId}/queue/notifications`);
      return this.connect().pipe(
        delay(1000),
        switchMap(() => this.subscribeToUserTopic(userId))
      );
    }
    return this.subscribeToUserTopic(userId);
  }

  // Alias para mantener consistencia con el código existente
  subscribeToNotifications(userId: number): Observable<any> {
    return this.subscribeToUserNotifications(userId);
  }

  private subscribeToUserTopic(userId: number): Observable<any> {
    try {
      // ✅ CORREGIR RUTA - Usar /user/{userId}/queue/notifications para coincidir con el backend
      const topicKey = `/user/${userId}/queue/notifications`;
      
      // Cancelar suscripción existente si la hay
      if (this.activeSubscriptions.has(topicKey)) {
        console.log(`[WebSocket] Cancelando suscripción existente para ${topicKey}`);
        this.activeSubscriptions.get(topicKey)?.unsubscribe();
      }

      console.log(`[WebSocket] Suscribiendo a ${topicKey}`);
      const subscription = this.client.subscribe(topicKey, (message: IMessage) => {
        try {
          console.log(`[WebSocket] Notificación recibida en ${topicKey}:`, message.body);
          const parsedNotification = JSON.parse(message.body);
          this.notificationSubject.next(parsedNotification);
        } catch (error) {
          console.error('[WebSocket] Error al parsear notificación:', error);
        }
      });
      
      // Guardar la suscripción activa
      this.activeSubscriptions.set(topicKey, subscription);
      return this.notificationSubject.asObservable();
    } catch (error) {
      console.error('[WebSocket] Error al suscribirse a notificaciones:', error);
      throw error;
    }
  }

  // Método para debugging - obtener estado de conexión
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Método para debugging - obtener suscripciones activas
  getActiveSubscriptions(): string[] {
    return Array.from(this.activeSubscriptions.keys());
  }
}