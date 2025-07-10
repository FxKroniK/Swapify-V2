import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewChecked,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../services/auth-service/auth.service';
import { UserService } from '../../../services/user-service/user.service';
import { WebsocketService } from '../../../services/websocket-service/websocket.service';
import { ProductService } from '../../../services/product-service/product.service';
import { TransactionService } from '../../../services/transaction-service/transaction.service';
import { NegotiationService } from '../../../services/negotiation-service/negotiation.service';
import { ToastrService } from 'ngx-toastr';
import { Subscription, filter } from 'rxjs';
import { UserDto } from '../../../models/user.model';

interface User {
  id: number;
  nickname: string;
  profilePictureUrl?: string;
  credits?: number;
}

interface Conversation {
  id: number;
  productId: string;
  buyerId: number;
  sellerId: number;
  messages: Message[];
}

interface ConversationSummary {
  id: number;
  productId: string;
  productTitle: string;
  otherUser: User;
  lastMessage: Message | null;
  unreadCount: number;
}

interface Message {
  id: number | string;
  conversationId: number;
  senderId: number;
  text: string;
  time: string;
  type: string;
  productId?: string;
  creditsOffered?: number;
  isSystem: boolean;
  isLocal?: boolean;
}

interface Transaction {
  id: number;
  buyerId: number;
  sellerId: number;
  status: string;
  buyerAccepted: boolean;
  sellerAccepted: boolean;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  newMessage = '';
  currentUser: User | null = null;
  conversation: Conversation | null = null;
  conversations: ConversationSummary[] = [];
  selectedConversationId: number | null = null;
  users: User[] = [];
  messages: Message[] = [];
  selectedChat = {
    name: '',
    description: '',
    avatar: 'assets/placeholder.svg',
    participants: 2,
  };
  proposalForm: FormGroup;
  showProposalForm = false;
  showResponseForm = false;
  respondingToMessage: Message | null = null;
  userProducts: any[] = [];
  transactions: { [key: number]: Transaction } = {};
  isAccepting: { [key: number]: boolean } = {};
  isRejecting: { [key: number]: boolean } = {};
  private wsSubscription: Subscription | null = null;
  private wsNotificationSubscription: Subscription | null = null;
  private routerSubscription: Subscription | null = null;
  private isWebSocketConnected = false;
  private subscribedConversationId: number | null = null;
  private pendingSystemMessages: Set<number> = new Set(); // Para controlar mensajes del sistema pendientes

  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private negotiationService: NegotiationService,
    private authService: AuthService,
    private userService: UserService,
    private websocketService: WebsocketService,
    private productService: ProductService,
    private transactionService: TransactionService,
    private toastr: ToastrService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.proposalForm = this.fb.group({
      productId: [''],
      creditsOffered: [0, [Validators.min(0)]],
      content: ['Propuesta de trueque', Validators.required],
    });
  }

ngOnInit() {
  this.websocketService.connect().subscribe({
    next: (connected) => {
      if (connected) {
        this.isWebSocketConnected = true;
        console.log('[DEBUG] WebSocket conectado, estableciendo suscripciones iniciales');
        if (this.currentUser) {
          this.subscribeToUserNotifications(this.currentUser.id);
        }
      } else {
        this.toastr.error('No se pudo conectar al WebSocket');
      }
    },
    error: (error) => {
      this.toastr.error('Error al conectar al WebSocket: ' + error.message);
    },
  });

  this.authService.user$.subscribe({
    next: (user: UserDto | null) => {
      this.currentUser = user
        ? {
            id: user.id,
            nickname: user.nickname,
            profilePictureUrl: user.profilePictureUrl || 'assets/placeholder.svg',
            credits: user.credits,
          }
        : null;
      if (user) {
        console.log(`[DEBUG] Usuario cargado: ${user.id}, estableciendo notificaciones`);
        this.loadUserProducts();
        // Asegurar que las notificaciones estén activas para este usuario
        if (this.isWebSocketConnected) {
          this.subscribeToUserNotifications(user.id);
        }
        this.loadUserConversations();
      }
    },
    error: (error) => {
      this.toastr.error('Error al cargar el usuario: ' + error.message);
      this.router.navigate(['/login']);
    },
  });

  // ...existing router subscription code...
  this.routerSubscription = this.router.events
    .pipe(filter((event) => event instanceof NavigationEnd))
    .subscribe(() => {
      let conversationId: number | undefined;

      const stateId = history.state?.conversationId;
      if (stateId) {
        conversationId = stateId;
      } else {
        const paramId = this.route.snapshot.paramMap.get('id');
        if (paramId) {
          conversationId = +paramId;
        }
      }

      if (!conversationId) {
        this.toastr.error('No se proporcionó un ID de conversación válido');
        this.router.navigate(['/chats']);
        return;
      }

      this.selectConversation(conversationId);
    });

  let initialId: number | undefined;
  const stateId = history.state?.conversationId;
  if (stateId) {
    initialId = stateId;
  } else {
    const paramId = this.route.snapshot.paramMap.get('id');
    if (paramId) {
      initialId = +paramId;
    }
  }

  if (initialId) {
    this.selectConversation(initialId);
  } else {
    this.toastr.error('No se proporcionó un ID de conversación inicial');
    this.router.navigate(['/chats']);
  }
}

  loadUserProducts() {
    const token = localStorage.getItem('token');
    if (!this.currentUser || !token) return;

    this.productService.getProductsByOwner(this.currentUser.id, token).subscribe({
      next: (products) => {
        this.userProducts = products;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.toastr.error('Error al cargar los productos: ' + error.message);
      },
    });
  }

  loadUserConversations() {
    if (!this.currentUser) return;

    this.negotiationService.getUserConversations().subscribe({
      next: (conversations: any[]) => {
        this.conversations = conversations.map((conv) => {
          const otherUserId = this.currentUser!.id === conv.buyerId ? conv.sellerId : conv.buyerId;
          const lastMessage = conv.messages.length > 0 ? {
            id: conv.messages[0].id,
            conversationId: conv.messages[0].conversationId,
            senderId: conv.messages[0].senderId,
            text: conv.messages[0].content,
            time: new Date(conv.messages[0].timestamp).toLocaleTimeString(),
            type: conv.messages[0].type,
            productId: conv.messages[0].productId,
            creditsOffered: conv.messages[0].creditsOffered,
            isSystem: conv.messages[0].type === 'SYSTEM',
            isLocal: false,
          } : null;

          return {
            id: conv.id,
            productId: conv.productId,
            productTitle: `Producto ${conv.productId}`,
            otherUser: {
              id: otherUserId,
              nickname: `Usuario ${otherUserId}`,
              profilePictureUrl: 'assets/placeholder.svg',
              credits: 0,
            },
            lastMessage,
            unreadCount: 0,
          };
        });

        this.enrichConversations();
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.toastr.error('Error al cargar las conversaciones: ' + error.message);
      },
    });
  }

  enrichConversations() {
    const token = localStorage.getItem('token');
    if (!token) return;

    this.conversations.forEach((conv) => {
      this.userService.getUserById(conv.otherUser.id, token).subscribe({
        next: (user: any) => {
          conv.otherUser = {
            id: user.id,
            nickname: user.nickname,
            profilePictureUrl: user.profilePictureUrl || 'assets/placeholder.svg',
            credits: user.credits || 0,
          };
          this.cdr.detectChanges();
        },
        error: () => {
          conv.otherUser.nickname = `Usuario ${conv.otherUser.id}`;
        },
      });

      this.productService.getProductById(conv.productId, token).subscribe({
        next: (product: any) => {
          conv.productTitle = product.title || `Producto ${conv.productId}`;
          this.cdr.detectChanges();
        },
        error: () => {
          conv.productTitle = `Producto ${conv.productId}`;
        },
      });
    });
  }

  selectConversation(conversationId: number) {
    if (this.selectedConversationId === conversationId) {
      return;
    }

    this.selectedConversationId = conversationId;
    this.loadConversation(conversationId);
    this.subscribeToMessages(conversationId);
    
    // Asegurar que las notificaciones de usuario estén activas
    if (this.currentUser) {
      this.subscribeToUserNotifications(this.currentUser.id);
    }
    
    this.router.navigate(['/chat', conversationId], { replaceUrl: true });
  }

  goToProfile() {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
      this.wsSubscription = null;
    }
    if (this.wsNotificationSubscription) {
      this.wsNotificationSubscription.unsubscribe();
      this.wsNotificationSubscription = null;
    }
    this.isWebSocketConnected = false;
    this.subscribedConversationId = null;
    this.router.navigate(['/profile']);
  }

  loadConversation(conversationId: number) {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    // Limpiar mensajes pendientes al cambiar de conversación
    
    this.users = [];
    this.negotiationService.getNegotiation(conversationId).subscribe({
      next: (conversation: any) => {
        this.conversation = {
          id: conversation.id,
          productId: conversation.productId,
          buyerId: conversation.buyerId,
          sellerId: conversation.sellerId,
          messages: conversation.messages.map((msg: any) => ({
            id: msg.id,
            conversationId: msg.conversationId,
            senderId: msg.senderId,
            text: msg.content,
            time: new Date(msg.timestamp).toLocaleTimeString(),
            type: msg.type,
            productId: msg.productId,
            creditsOffered: msg.creditsOffered,
            isSystem: msg.type === 'SYSTEM',
            isLocal: false,
          })),
        };

        this.productService.getProductById(conversation.productId, token).subscribe({
          next: (product: any) => {
            this.selectedChat = {
              name: `Negociación por ${product.title || 'Producto ' + conversation.productId}`,
              description: 'Chat entre comprador y vendedor',
              avatar: 'assets/placeholder.svg',
              participants: 2,
            };
            this.cdr.detectChanges();
          },
          error: () => {
            this.selectedChat = {
              name: `Negociación por Producto ${conversation.productId}`,
              description: 'Chat entre comprador y vendedor',
              avatar: 'assets/placeholder.svg',
              participants: 2,
            };
            this.cdr.detectChanges();
          },
        });

        this.userService.getUserById(conversation.buyerId, token).subscribe({
          next: (buyer: any) => {
            this.users.push({
              id: buyer.id,
              nickname: buyer.nickname,
              profilePictureUrl: buyer.profilePictureUrl || 'assets/placeholder.svg',
              credits: buyer.credits || 0,
            });
            this.cdr.detectChanges();
          },
          error: () =>
            this.users.push({
              id: conversation.buyerId,
              nickname: `Comprador ${conversation.buyerId}`,
              profilePictureUrl: 'assets/placeholder.svg',
              credits: 0,
            }),
        });

        this.userService.getUserById(conversation.sellerId, token).subscribe({
          next: (seller: any) => {
            this.users.push({
              id: seller.id,
              nickname: seller.nickname,
              profilePictureUrl: seller.profilePictureUrl || 'assets/placeholder.svg',
              credits: seller.credits || 0,
            });
            this.cdr.detectChanges();
          },
          error: () =>
            this.users.push({
              id: conversation.sellerId,
              nickname: `Vendedor ${conversation.sellerId}`,
              profilePictureUrl: 'assets/placeholder.svg',
              credits: 0,
            }),
        });

        this.messages = [...this.conversation.messages];
        this.loadTransactionsFromMessages();
        this.scrollToBottom();
        this.cdr.detectChanges();

        this.updateConversationSummary(conversationId);
      },
      error: () => {
        this.toastr.error('Error al cargar la conversación');
        this.router.navigate(['/chats']);
      },
    });
  }

  updateConversationSummary(conversationId: number) {
    const convSummary = this.conversations.find((c) => c.id === conversationId);
    if (convSummary && this.conversation) {
      convSummary.lastMessage = this.conversation.messages.length > 0
        ? this.conversation.messages[this.conversation.messages.length - 1]
        : null;
      convSummary.unreadCount = 0;
      this.cdr.detectChanges();
    }
  }

  subscribeToMessages(conversationId: number) {
    if (this.subscribedConversationId === conversationId && this.wsSubscription) {
      return;
    }

    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }

    this.subscribedConversationId = conversationId;

    if (!this.isWebSocketConnected) {
      this.websocketService.connect().subscribe({
        next: (connected) => {
          if (connected) {
            this.isWebSocketConnected = true;
            this.subscribeToConversation(conversationId);
          } else {
            this.toastr.error('No se pudo conectar al WebSocket');
          }
        },
        error: (error) => {
          this.toastr.error('Error al conectar al WebSocket: ' + error.message);
        },
      });
    } else {
      this.subscribeToConversation(conversationId);
    }
  }

  private subscribeToConversation(conversationId: number) {
    this.wsSubscription = this.websocketService
      .subscribeToConversation(conversationId)
      .subscribe({
        next: (message: any) => {
          console.log('[DEBUG] Mensaje recibido por WebSocket de conversación:', message);
          
          if (!message || !message.id) return;
          
          let content = message.content || 'Mensaje sin contenido';
          
          // Verificar duplicados por ID
          const isDuplicate = this.messages.some((msg) => msg.id === message.id);
          if (isDuplicate) {
            console.log(`[DEBUG] Mensaje duplicado por ID detectado: ${message.id}`);
            return;
          }
          
          // ✅ VERIFICACIÓN ADICIONAL - Si es un mensaje del sistema, verificar por contenido también
          if (message.type === 'SYSTEM') {
            const duplicateByContent = this.messages.some((msg) => 
              msg.isSystem && 
              msg.text === content &&
              Math.abs(new Date().getTime() - new Date(msg.time).getTime()) < 5000 // Dentro de 5 segundos
            );
            
            if (duplicateByContent) {
              console.log(`[DEBUG] Mensaje del sistema duplicado por contenido detectado: "${content}"`);
              return;
            }
          }

          // Reemplazar mensaje temporal si existe
          const tempMessageIndex = this.messages.findIndex(
            (msg) => msg.isLocal && msg.text === content && msg.senderId === message.senderId
          );
          if (tempMessageIndex !== -1) {
            this.messages.splice(tempMessageIndex, 1);
          }

          const newMessage: Message = {
            id: message.id,
            conversationId: message.conversationId || conversationId,
            senderId: message.senderId || 0,
            text: content,
            time: message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString(),
            type: message.type || 'TEXT',
            productId: message.productId || undefined,
            creditsOffered: message.creditsOffered || 0,
            isSystem: message.type === 'SYSTEM',
            isLocal: false,
          };

          this.messages.push(newMessage);
          this.messages = [...this.messages];

          // Si es un mensaje del sistema relacionado con transacciones, cargar el estado
          if (newMessage.isSystem && (content.includes('creada con ID:') || 
                                     content.includes('Transacción creada') ||
                                     content.includes('ha pasado a estado') ||
                                     content.includes('Esperando confirmación') ||
                                     content.includes('¡Transacción completada'))) {
            console.log(`[DEBUG] Mensaje del sistema detectado: "${content}"`);
            
            const transactionId = this.getTransactionId(content);
            if (transactionId) {
              this.loadTransactionState(transactionId);
              
              // ✅ FORZAR ACTUALIZACIÓN AGRESIVA para mensajes del sistema
              this.forceUIUpdate(`mensaje del sistema transacción ${transactionId}`);
              
            } else {
              // Para mensajes amigables sin ID, buscar transacciones activas de la conversación
              this.loadActiveTransactionsForConversation();
              
              // ✅ FORZAR ACTUALIZACIÓN para mensajes amigables
              this.forceUIUpdate('mensaje del sistema sin ID');
            }
            
            // Si es un mensaje de completado, marcar cualquier pendiente como resuelto
            if (content.includes('¡Transacción completada') || content.includes('completada exitosamente')) {
              console.log(`[DEBUG] Mensaje de completado recibido por WebSocket, limpiando pendientes`);
              // Limpiar todos los pendientes ya que el mensaje llegó por WebSocket
              this.pendingSystemMessages.clear();
              
              // ✅ ACTUALIZACIÓN ESPECIAL para mensajes de completado
              this.forceUIUpdate('transacción completada por WebSocket');
              
              // ✅ ACTUALIZACIÓN ADICIONAL después de un delay para asegurar procesamiento - Optimizado
              setTimeout(() => {
                this.loadActiveTransactionsForConversation();
                this.forceUIUpdate('transacción completada - actualización tardía');
              }, 50);
            }
          }

          const convSummary = this.conversations.find((c) => c.id === conversationId);
          if (convSummary) {
            convSummary.lastMessage = newMessage;
            if (this.selectedConversationId !== conversationId) {
              convSummary.unreadCount += 1;
            }
          }

          this.scrollToBottom();
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.toastr.error('Error en la conexión WebSocket: ' + error.message);
          this.isWebSocketConnected = false;
          this.subscribedConversationId = null;
        },
      });
  }

  subscribeToUserNotifications(userId: number) {
    if (this.wsNotificationSubscription) {
      this.wsNotificationSubscription.unsubscribe();
    }

    if (!this.isWebSocketConnected) {
      this.websocketService.connect().subscribe({
        next: (connected) => {
          if (connected) {
            this.isWebSocketConnected = true;
            this.subscribeToNotifications(userId);
          } else {
            this.toastr.error('No se pudo conectar al WebSocket para notificaciones');
          }
        },
        error: (error) => {
          this.toastr.error('Error al conectar al WebSocket para notificaciones: ' + error.message);
        },
      });
    } else {
      this.subscribeToNotifications(userId);
    }
  }

  private subscribeToNotifications(userId: number) {
    // ✅ DEBUGGING - Verificar estado antes de suscribirse
    this.debugWebSocketState(userId);
    
    this.wsNotificationSubscription = this.websocketService
      .subscribeToUserNotifications(userId)
      .subscribe({
        next: (notification: any) => {
          console.log('[DEBUG] Notificación de usuario recibida:', notification);
          
          // ✅ MANEJAR NOTIFICACIÓN DE TRANSACCIÓN COMPLETADA ESPECÍFICAMENTE
          if (notification.type === 'TRANSACTION_COMPLETED') {
            console.log('🎉 [DEBUG] TRANSACTION_COMPLETED recibida:', notification);
            this.handleTransactionCompletedNotification(notification);
            return;
          }
          
          // Solo procesar notificaciones de transacción para actualizar el estado
          if (notification.transactionId) {
            // ✅ SIEMPRE actualizar el estado de la transacción INMEDIATAMENTE
            this.loadTransactionState(notification.transactionId);
            
            // ✅ FORZAR ACTUALIZACIÓN AGRESIVA cuando llega cualquier notificación de transacción
            this.forceUIUpdate(`notificación de transacción ${notification.transactionId}`);
            
            // Si es confirmación de mensaje del sistema enviado, marcar como recibido
            if (notification.type === 'SYSTEM_MESSAGE_SENT') {
              console.log(`[DEBUG] Confirmación de mensaje del sistema recibida para transacción ${notification.transactionId}`);
              this.pendingSystemMessages.delete(notification.transactionId);
              return; // No procesar más, solo era confirmación
            }
            
            // ✅ PROCESAR NOTIFICACIONES DE CAMBIO DE ESTADO para actualizar UI inmediatamente
            if (notification.message && 
                (notification.message.includes('completada') || 
                 notification.message.includes('COMPLETED') || 
                 notification.message.includes('ha pasado a estado COMPLETED') ||
                 notification.message.includes('¡Transacción completada') ||
                 notification.message.includes('aceptado') ||
                 notification.message.includes('ACCEPTED') ||
                 notification.message.includes('PENDING')) ||
                notification.type === 'TRANSACTION_UPDATE') {
              
              console.log(`[DEBUG] Notificación de cambio de estado detectada:`, notification);
              
              // ✅ ACTUALIZACIÓN INMEDIATA para el usuario que NO hizo la acción
              this.loadTransactionState(notification.transactionId);
              this.forceUIUpdate(`cambio de estado transacción ${notification.transactionId}`);
              
              // ✅ ACTUALIZACIÓN ADICIONAL para asegurar que se procese (reducido a 50ms)
              setTimeout(() => {
                this.loadTransactionState(notification.transactionId);
                this.forceUIUpdate(`cambio de estado transacción ${notification.transactionId} - seguimiento`);
              }, 50);
              
              // ✅ RECARGAR CONVERSACIÓN si es una transacción completada
              if (notification.message.includes('completada') || 
                  notification.message.includes('COMPLETED') || 
                  notification.message.includes('¡Transacción completada')) {
                
                setTimeout(() => {
                  this.loadUserConversations();
                  if (notification.conversationId === this.selectedConversationId) {
                    this.loadConversation(notification.conversationId);
                  }
                }, 1000);
              }
            }
          }
        },
        error: (error) => {
          this.toastr.error('Error en la conexión WebSocket: ' + error.message);
          setTimeout(() => this.subscribeToNotifications(userId), 5000);
        },
      });
  }

  /**
   * Maneja las notificaciones de transacción completada
   * Espera confirmación del backend de que el mensaje fue enviado al microservicio de chat
   * Si no llega confirmación, agrega el mensaje manualmente
   */
  private handleCompletedTransactionNotification(transactionId: number) {
    // Solo procesar si estamos en una conversación activa
    if (!this.selectedConversationId) {
      console.log(`[DEBUG] No hay conversación activa, ignorando notificación de transacción ${transactionId}`);
      return;
    }

    // Verificar si ya existe un mensaje de sistema para esta transacción
    const systemMessageExists = this.messages.some(msg => 
      msg.isSystem && 
      (msg.text.includes('¡Transacción completada') ||
       msg.text.includes('completada exitosamente') ||
       msg.text.includes('ha pasado a estado COMPLETED'))
    );

    if (systemMessageExists) {
      console.log(`[DEBUG] Ya existe mensaje del sistema para transacción ${transactionId}, no agregando fallback`);
      return;
    }

    // Verificar si ya está marcado como pendiente (evitar duplicados)
    if (this.pendingSystemMessages.has(transactionId)) {
      console.log(`[DEBUG] Transacción ${transactionId} ya está marcada como pendiente`);
      return;
    }

    // Marcar como pendiente
    this.pendingSystemMessages.add(transactionId);
    console.log(`[DEBUG] Marcando transacción ${transactionId} como pendiente de confirmación del backend`);

    // Esperar 2 segundos para recibir confirmación del backend (reducido de 3 a 2)
    setTimeout(() => {
      // Si aún está marcado como pendiente, no llegó confirmación del backend
      if (this.pendingSystemMessages.has(transactionId)) {
        console.log(`[DEBUG] No se recibió confirmación del backend para transacción ${transactionId}, agregando mensaje manualmente`);
        this.addMissingSystemMessage(transactionId);
        this.pendingSystemMessages.delete(transactionId);
      }
    }, 2000);
  }

  /**
   * Agrega un mensaje del sistema cuando el backend no confirma el envío al microservicio de chat
   */
  private addMissingSystemMessage(transactionId: number) {
    const transaction = this.transactions[transactionId];
    if (!transaction || transaction.status !== 'COMPLETED') {
      return;
    }

    // Verificar que no existe ya un mensaje del sistema para esta transacción
    const systemMessageExists = this.messages.some(msg => 
      msg.isSystem && 
      (msg.text.includes('transacción') || 
       msg.text.includes('Transacción') ||
       msg.text.includes('¡Transacción completada') ||
       msg.text.includes('completada exitosamente')) &&
      (msg.text.includes('completada') || 
       msg.text.includes('COMPLETED') || 
       msg.text.includes('ha pasado a estado COMPLETED') ||
       msg.text.includes('exitosamente'))
    );

    if (systemMessageExists) {
      console.log(`[DEBUG] Mensaje del sistema para transacción ${transactionId} ya existe, no agregando`);
      return;
    }

    // Crear el mensaje del sistema con formato amigable
    const systemMessage: Message = {
      id: `fallback-${transactionId}-${Date.now()}`,
      conversationId: this.selectedConversationId!,
      senderId: 0, // ID del sistema
      text: `¡Transacción completada exitosamente!`,
      time: new Date().toLocaleTimeString(),
      type: 'SYSTEM',
      isSystem: true,
      isLocal: false,
    };

    this.messages.push(systemMessage);
    this.messages = [...this.messages];
    this.cdr.detectChanges();
    this.scrollToBottom();
    
    console.log(`[DEBUG] Mensaje del sistema fallback agregado para transacción ${transactionId}`);
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.conversation || !this.currentUser) return;

    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      conversationId: this.conversation.id,
      senderId: this.currentUser.id,
      text: this.newMessage,
      time: new Date().toLocaleTimeString(),
      type: 'TEXT',
      isSystem: false,
      isLocal: true,
    };

    this.messages.push(tempMessage);
    this.scrollToBottom();
    const messageToSend = this.newMessage;
    this.newMessage = '';

    const sendButton = document.querySelector('.btn-send') as HTMLButtonElement;
    if (sendButton) {
      sendButton.disabled = true;
    }

    this.negotiationService
      .sendMessage(this.conversation.id, messageToSend, 'TEXT')
      .subscribe({
        next: (response) => {
          if (sendButton) {
            sendButton.disabled = false;
          }
          this.cdr.detectChanges();
        },
        error: () => {
          this.messages = this.messages.filter((msg) => msg.id !== tempId);
          this.newMessage = messageToSend;
          this.toastr.error('Error al enviar el mensaje');
          if (sendButton) {
            sendButton.disabled = false;
          }
          this.cdr.detectChanges();
        },
      });
  }

  openProposalForm() {
    this.showProposalForm = true;
    this.showResponseForm = false;
    this.respondingToMessage = null;
    this.proposalForm.reset({ productId: '', creditsOffered: 0, content: 'Propuesta de trueque' });
  }

  openResponseForm(message: Message) {
    if (message.type !== 'PROPOSAL') {
      this.toastr.error('Solo puedes responder a una propuesta');
      return;
    }
    this.showResponseForm = true;
    this.showProposalForm = false;
    this.respondingToMessage = message;
    this.proposalForm.reset({ productId: '', creditsOffered: 0, content: 'Respuesta a propuesta' });
  }

  submitProposal() {
    if (this.proposalForm.invalid || !this.conversation || !this.currentUser) {
      this.toastr.error('Formulario inválido');
      return;
    }

    const formValue = this.proposalForm.value;
    const productId = formValue.productId || undefined;
    const creditsOffered = formValue.creditsOffered || 0;
    const type = this.showResponseForm ? 'PROPOSAL_RESPONSE' : 'PROPOSAL';

    if (productId && !this.userProducts.some((p) => p.id === productId)) {
      this.toastr.error('El producto seleccionado no es válido');
      return;
    }

    this.negotiationService
      .sendMessage(this.conversation.id, formValue.content, type, productId, creditsOffered)
      .subscribe({
        next: (message) => {
          const newMessage: Message = {
            id: message.id,
            conversationId: this.conversation!.id,
            senderId: this.currentUser!.id,
            text: message.content,
            time: new Date(message.timestamp).toLocaleTimeString(),
            type: message.type,
            productId: message.productId,
            creditsOffered: message.creditsOffered,
            isSystem: message.type === 'SYSTEM',
            isLocal: false,
          };

          const messageExists = this.messages.some(
            (msg) => msg.id === newMessage.id
          );

          if (!messageExists) {
            this.messages.push(newMessage);
            this.messages = [...this.messages];

            const convSummary = this.conversations.find((c) => c.id === this.conversation!.id);
            if (convSummary) {
              convSummary.lastMessage = newMessage;
              this.cdr.detectChanges();
            }
          }

          this.showProposalForm = false;
          this.showResponseForm = false;
          this.respondingToMessage = null;
          this.proposalForm.reset();
          this.scrollToBottom();
          this.toastr.success(type === 'PROPOSAL' ? 'Propuesta enviada' : 'Respuesta enviada');
          this.cdr.detectChanges();

          if (type === 'PROPOSAL_RESPONSE') {
            this.negotiationService.createTransaction(this.conversation!.id).subscribe({
              next: (transaction) => {
                this.toastr.success('Transacción creada');
                this.loadTransactionState(transaction.id);
                this.transactions[transaction.id] = { ...transaction, status: 'PENDING', buyerAccepted: false, sellerAccepted: false };
                this.cdr.detectChanges();
              },
              error: (error) => {
                this.toastr.error('Error al crear la transacción: ' + error.message);
              },
            });
          }
        },
        error: (error) => {
          this.toastr.error(`Error al enviar ${type === 'PROPOSAL' ? 'la propuesta' : 'la respuesta'}: ${error.message}`);
        },
      });
  }

  loadTransactionsFromMessages() {
    const processedTransactionIds = new Set<number>();
    this.messages.forEach((message) => {
      if (message.isSystem) {
        const transactionId = this.getTransactionId(message.text);
        if (transactionId && !processedTransactionIds.has(transactionId)) {
          processedTransactionIds.add(transactionId);
          this.loadTransactionState(transactionId);
        }
      }
    });
  }

  loadTransactionState(transactionId: number) {
    this.transactionService.getTransaction(transactionId).subscribe({
      next: (transaction) => {
        console.log(`[DEBUG] Estado de transacción ${transactionId} actualizado:`, transaction);
        
        // ✅ DEBUGGING COMPLETO del estado
        this.debugTransactionState(transactionId, 'antes de actualizar');
        
        // ✅ ACTUALIZACIÓN AGRESIVA del estado local
        const oldTransaction = this.transactions[transactionId];
        this.transactions[transactionId] = { ...transaction };
        this.transactions = { ...this.transactions };
        
        // ✅ DEBUGGING COMPLETO del estado después de actualizar
        this.debugTransactionState(transactionId, 'después de actualizar');
        
        // ✅ DETECTAR CAMBIOS DE ESTADO para actualizaciones específicas
        const statusChanged = !oldTransaction || oldTransaction.status !== transaction.status;
        const acceptanceChanged = !oldTransaction || 
          oldTransaction.buyerAccepted !== transaction.buyerAccepted ||
          oldTransaction.sellerAccepted !== transaction.sellerAccepted;
        
        // ✅ DETECTAR SI ES UN CAMBIO CRÍTICO (completado o nuevo estado de aceptación)
        const criticalChange = statusChanged && transaction.status === 'COMPLETED' ||
                              acceptanceChanged && (transaction.buyerAccepted || transaction.sellerAccepted);
        
        if (statusChanged || acceptanceChanged) {
          console.log(`[DEBUG] Estado significativo cambió para transacción ${transactionId}:`, {
            oldStatus: oldTransaction?.status,
            newStatus: transaction.status,
            oldBuyerAccepted: oldTransaction?.buyerAccepted,
            newBuyerAccepted: transaction.buyerAccepted,
            oldSellerAccepted: oldTransaction?.sellerAccepted,
            newSellerAccepted: transaction.sellerAccepted,
            statusChanged,
            acceptanceChanged,
            criticalChange
          });
          
          if (criticalChange) {
            // ✅ ACTUALIZACIÓN ULTRA-AGRESIVA para cambios críticos
            console.log(`[DEBUG] Cambio crítico detectado para transacción ${transactionId}, aplicando actualización ultra-agresiva`);
            
            this.cdr.detectChanges();
            this.cdr.markForCheck();
            
            setTimeout(() => {
              this.cdr.detectChanges();
            }, 10);
            
            setTimeout(() => {
              this.cdr.detectChanges();
            }, 50);
            
            setTimeout(() => {
              this.cdr.detectChanges();
            }, 100);
            
            setTimeout(() => {
              this.cdr.detectChanges();
            }, 200);
            
            setTimeout(() => {
              this.cdr.detectChanges();
            }, 500);
            
          } else {
            // ✅ MÚLTIPLES ACTUALIZACIONES FORZADAS cuando hay cambios importantes
            this.cdr.detectChanges();
            
            setTimeout(() => {
              this.cdr.detectChanges();
            }, 50);
            
            setTimeout(() => {
              this.cdr.detectChanges();
            }, 150);
          }
        } else {
          // ✅ ACTUALIZACIÓN SIMPLE para cambios menores
          this.cdr.detectChanges();
        }
        
        // ✅ ACTUALIZACIÓN ESPECIAL si la transacción se completó
        if (transaction.status === 'COMPLETED') {
          console.log(`[DEBUG] Transacción ${transactionId} completada, forzando actualización de UI agresiva`);
          
          // Actualizar zona de cambio de Angular - Optimizado
          setTimeout(() => {
            this.cdr.markForCheck();
            this.cdr.detectChanges();
          }, 20);
          
          setTimeout(() => {
            this.cdr.detectChanges();
          }, 100);
        }
      },
      error: (error) => {
        console.error('Error al cargar estado de transacción:', error);
      }
    });
  }

  /**
   * Carga todas las transacciones activas para la conversación actual
   * Útil cuando recibimos mensajes del sistema sin ID de transacción
   */
  loadActiveTransactionsForConversation() {
    if (!this.selectedConversationId) {
      return;
    }

    console.log(`[DEBUG] Cargando transacciones activas para conversación ${this.selectedConversationId}`);

    // Buscar transacciones por conversación (si el servicio lo soporta)
    // O como alternativa, refrescar las transacciones ya conocidas
    const knownTransactionIds = Object.keys(this.transactions).map(id => parseInt(id, 10));
    
    if (knownTransactionIds.length > 0) {
      console.log(`[DEBUG] Refrescando ${knownTransactionIds.length} transacciones conocidas:`, knownTransactionIds);
      
      // Refrescar las transacciones conocidas
      knownTransactionIds.forEach(transactionId => {
        this.loadTransactionState(transactionId);
      });
      
      // ✅ FORZAR ACTUALIZACIÓN después de cargar todas las transacciones - Optimizado
      setTimeout(() => {
        this.forceUIUpdate('todas las transacciones refrescadas');
      }, 100);
      
    } else {
      console.log(`[DEBUG] No hay transacciones conocidas para la conversación ${this.selectedConversationId}`);
    }
  }

  acceptTransaction(transactionId: number) {
    if (!this.conversation || !this.currentUser) return;

    // ✅ INICIAR MONITOREO del flujo de notificaciones
    this.monitorNotificationFlow(transactionId);

    this.isAccepting[transactionId] = true;
    this.cdr.detectChanges();
    
    this.negotiationService.confirmTransaction(this.conversation.id, transactionId, true).subscribe({
      next: (transaction) => {
        console.log(`[DEBUG] Transacción ${transactionId} aceptada, nuevo estado:`, transaction);
        
        // ✅ MONITOREO POST-ACEPTACIÓN
        console.log(`📡 [MONITOR] Post-aceptación para transacción ${transactionId}:`);
        console.log(`  - Nuevo estado: ${transaction.status}`);
        console.log(`  - Comprador aceptó: ${transaction.buyerAccepted}`);
        console.log(`  - Vendedor aceptó: ${transaction.sellerAccepted}`);
        console.log(`  - ¿Debería completarse?: ${transaction.buyerAccepted && transaction.sellerAccepted}`);
        
        // ✅ ACTUALIZACIÓN INMEDIATA - Actualizar el estado local PRIMERO
        this.transactions[transactionId] = { ...transaction };
        this.transactions = { ...this.transactions };
        
        // ✅ FORZAR ACTUALIZACIÓN AGRESIVA inmediatamente
        this.forceUIUpdate(`transacción ${transactionId} aceptada`);
        
        // ✅ Si se completó, agregar mensaje del sistema inmediatamente para feedback visual
        if (transaction.status === 'COMPLETED') {
          console.log(`🎉 [MONITOR] ¡Transacción ${transactionId} SE COMPLETÓ!`);
          this.toastr.success(`¡Transacción completada exitosamente!`);
          
          // Agregar mensaje del sistema inmediatamente como feedback visual
          const immediateSystemMessage: Message = {
            id: `immediate-${transactionId}-${Date.now()}`,
            conversationId: this.selectedConversationId!,
            senderId: 0, // ID del sistema
            text: `¡Transacción completada exitosamente!`,
            time: new Date().toLocaleTimeString(),
            type: 'SYSTEM',
            isSystem: true,
            isLocal: false,
          };
          
          // Verificar que no existe ya un mensaje similar
          const messageExists = this.messages.some(msg => 
            msg.isSystem && 
            (msg.text.includes('¡Transacción completada') || 
             msg.text.includes('completada exitosamente'))
          );
          
          if (!messageExists) {
            this.messages.push(immediateSystemMessage);
            this.messages = [...this.messages];
            this.scrollToBottom();
          }
          
          // ✅ ACTUALIZACIÓN ULTRA-AGRESIVA para transacciones completadas
          this.forceUIUpdate(`transacción ${transactionId} completada`);
          
        } else {
          console.log(`📡 [MONITOR] Transacción ${transactionId} aceptada pero NO completada`);
          this.toastr.success('Transacción aceptada');
          
          // ✅ INICIAR POLLING para verificar si la transacción se completa
          this.startTransactionPolling(transactionId);
          
          // Para estados no completados, usar actualización normal
          this.forceUIUpdate(`transacción ${transactionId} aceptada (no completada)`);
        }
        
        this.isAccepting[transactionId] = false;
        
        // ✅ ACTUALIZACIÓN FINAL
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.toastr.error('Error al aceptar la transacción: ' + error.message);
        this.isAccepting[transactionId] = false;
        this.cdr.detectChanges();
      },
    });
  }

  rejectTransaction(transactionId: number) {
    if (!this.conversation || !this.currentUser) return;

    this.isRejecting[transactionId] = true;
    this.cdr.detectChanges();
    
    this.negotiationService.confirmTransaction(this.conversation.id, transactionId, false).subscribe({
      next: (transaction) => {
        console.log(`[DEBUG] Transacción ${transactionId} rechazada, nuevo estado:`, transaction);
        
        // ✅ ACTUALIZACIÓN INMEDIATA del estado local
        this.transactions[transactionId] = { ...transaction };
        this.transactions = { ...this.transactions };
        
        // ✅ FORZAR ACTUALIZACIÓN AGRESIVA
        this.forceUIUpdate(`transacción ${transactionId} rechazada`);
        
        // Cargar estado actualizado del servidor
        this.loadTransactionState(transactionId);
        
        this.toastr.success('Transacción rechazada');
        this.isRejecting[transactionId] = false;
      },
      error: (error) => {
        this.toastr.error('Error al rechazar la transacción: ' + error.message);
        this.isRejecting[transactionId] = false;
        this.cdr.detectChanges();
      },
    });
  }

  showTransactionDetails(transactionId: number) {
    const transaction = this.transactions[transactionId];
    if (!transaction) {
      this.toastr.error('No se encontraron detalles de la transacción');
      return;
    }

    const proposalMessage = this.messages.filter((m) => m.type === 'PROPOSAL').slice(-1)[0];
    const responseMessage = this.messages.filter((m) => m.type === 'PROPOSAL_RESPONSE').slice(-1)[0];

    if (!proposalMessage || !responseMessage) {
      this.toastr.error('No se encontraron detalles de la transacción');
      return;
    }

    const details = `
      Detalles de la Transacción ID: ${transactionId}
      Propuesta:
      - Producto: ${this.getProductTitle(proposalMessage.productId) || 'Ninguno'}
      - Créditos: ${proposalMessage.creditsOffered || 0}
      Respuesta:
      - Producto: ${this.getProductTitle(responseMessage.productId) || 'Ninguno'}
      - Créditos: ${responseMessage.creditsOffered || 0}
      Estado: ${transaction.status}
      Comprador ha aceptado: ${transaction.buyerAccepted ? 'Sí' : 'No'}
      Vendedor ha aceptado: ${transaction.sellerAccepted ? 'Sí' : 'No'}
    `;
    this.toastr.info(details, 'Detalles de la Transacción', { timeOut: 10000 });
  }

  hasAccepted(transactionId: number): boolean {
    const transaction = this.transactions[transactionId];
    if (!transaction || !this.currentUser) {
      return false;
    }

    const isBuyer = this.currentUser.id === transaction.buyerId;
    return isBuyer ? transaction.buyerAccepted : transaction.sellerAccepted;
  }

  getTransactionId(messageText: string): number {
    if (!messageText || typeof messageText !== 'string') {
      return 0;
    }
    
    // Patrones para buscar ID de transacción (incluyendo el formato del backend)
    const patterns = [
      /Transacción ID: (\d+) ha pasado a estado/i,  // Formato del backend
      /transacción ID: (\d+)/i,
      /ID: (\d+)/i,
      /transacción (\d+)/i,
      /transaccion (\d+)/i,
      /transaction (\d+)/i,
      /creada con ID: (\d+)/i,
      /completada con ID: (\d+)/i
    ];
    
    for (const pattern of patterns) {
      const match = messageText.match(pattern);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
    
    // Para mensajes amigables sin ID (como "¡Transacción completada exitosamente!"), 
    // devolver 0 para que la lógica superior use métodos alternativos
    return 0;
  }

  isCurrentUser(senderId: number): boolean {
    return this.currentUser?.id === senderId;
  }

  getMessageSender(senderId: number): User | undefined {
    return this.users.find((user) => user.id === senderId);
  }

  getProductTitle(productId?: string): string {
    if (!productId) return '';
    const product = this.userProducts.find((p) => p.id === productId);
    return product ? product.title : `Producto ${productId}`;
  }

  scrollToBottom(): void {
    try {
      this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  ngOnDestroy() {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
    if (this.wsNotificationSubscription) {
      this.wsNotificationSubscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    this.websocketService.disconnect();
    this.isWebSocketConnected = false;
    this.subscribedConversationId = null;
  }

  /**
   * Fuerza múltiples actualizaciones de la UI para asegurar que los cambios se reflejen
   * Útil para cambios críticos como completar transacciones
   */
  private forceUIUpdate(reason: string = 'general') {
    console.log(`[DEBUG] Forzando actualización UI por: ${reason}`);
    
    // Actualización inmediata
    this.cdr.detectChanges();
    
    // Marcado para verificación
    this.cdr.markForCheck();
    
    // Actualizaciones escalonadas - Optimizadas para mayor velocidad
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 5);
    
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 20);
    
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 50);
    
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 100);
  }

  consoleLog(transaction: Transaction): boolean {
    return true;
  }

  private handleTransactionCompletedNotification(notification: any): void {
    console.log('✅ Transacción completada - Actualizando UI agresivamente');
    
    // ✅ ACTUALIZACIÓN INMEDIATA Y AGRESIVA
    this.forceUIUpdate('notificación de transacción completada');
    
    // ✅ RECARGAR CONVERSACIÓN ACTUAL si coincide
    if (notification.conversationId && 
        this.selectedConversationId === notification.conversationId) {
      console.log(`🔄 Recargando conversación actual ${notification.conversationId} por transacción completada`);
      this.loadConversation(notification.conversationId);
    }
    
    // ✅ RECARGAR LISTA DE CONVERSACIONES para actualizar estados
    this.loadUserConversations();
    
    // ✅ RECARGAR TRANSACCIONES ACTIVAS
    this.loadActiveTransactionsForConversation();
    
    // ✅ ACTUALIZACIONES ESCALONADAS para garantizar que se procese todo - Optimizadas
    setTimeout(() => {
      this.forceUIUpdate('transacción completada - actualización 100ms');
      this.loadActiveTransactionsForConversation();
    }, 100);
    
    setTimeout(() => {
      this.forceUIUpdate('transacción completada - actualización 300ms');
      if (notification.conversationId === this.selectedConversationId) {
        this.loadConversation(notification.conversationId);
      }
    }, 300);
    
    // ✅ MOSTRAR TOAST de confirmación
    this.toastr.success('¡Transacción completada exitosamente!', 'Intercambio Completado', {
      timeOut: 5000,
      progressBar: true
    });
  }

  // ✅ MÉTODO PARA DEBUGGING - Verificar estado de WebSocket y suscripciones
  private debugWebSocketState(userId: number) {
    console.log('🔍 [DEBUG] Estado del WebSocket:');
    console.log('  - Conectado:', this.websocketService.getConnectionStatus());
    console.log('  - Suscripciones activas:', this.websocketService.getActiveSubscriptions());
    console.log('  - Usuario ID:', userId);
    console.log('  - Ruta esperada:', `/user/${userId}/queue/notifications`);
  }

  // ✅ MÉTODO PARA DEBUGGING COMPLETO - Verificar estado de transacciones
  private debugTransactionState(transactionId: number, context: string) {
    const transaction = this.transactions[transactionId];
    console.log(`🔍 [DEBUG] Estado de transacción ${transactionId} (${context}):`);
    console.log('  - Estado:', transaction?.status);
    console.log('  - Comprador aceptó:', transaction?.buyerAccepted);
    console.log('  - Vendedor aceptó:', transaction?.sellerAccepted);
    console.log('  - Usuario actual:', this.currentUser?.id);
    console.log('  - Es comprador:', transaction?.buyerId === this.currentUser?.id);
    console.log('  - Es vendedor:', transaction?.sellerId === this.currentUser?.id);
    console.log('  - WebSocket conectado:', this.websocketService.getConnectionStatus());
    console.log('  - Suscripciones activas:', this.websocketService.getActiveSubscriptions());
  }

  // ✅ MÉTODO PARA MONITOREAR NOTIFICACIONES EN TIEMPO REAL
  private monitorNotificationFlow(transactionId: number) {
    console.log(`📡 [MONITOR] Iniciando monitoreo para transacción ${transactionId}`);
    
    // Verificar estado WebSocket
    console.log(`📡 [MONITOR] WebSocket conectado: ${this.websocketService.getConnectionStatus()}`);
    console.log(`📡 [MONITOR] Suscripciones activas: ${this.websocketService.getActiveSubscriptions()}`);
    
    // Verificar suscripciones del usuario
    if (this.currentUser) {
      const expectedNotificationRoute = `/user/${this.currentUser.id}/queue/notifications`;
      const isSubscribed = this.websocketService.getActiveSubscriptions().includes(expectedNotificationRoute);
      
      console.log(`📡 [MONITOR] Usuario ${this.currentUser.id} suscrito a notificaciones: ${isSubscribed}`);
      console.log(`📡 [MONITOR] Ruta esperada: ${expectedNotificationRoute}`);
      
      if (!isSubscribed) {
        console.error(`❌ [MONITOR] Usuario NO está suscrito a notificaciones! Reintentando suscripción...`);
        this.subscribeToUserNotifications(this.currentUser.id);
      }
    }
    
    // Verificar estado de la transacción
    const transaction = this.transactions[transactionId];
    if (transaction) {
      console.log(`📡 [MONITOR] Estado actual de transacción ${transactionId}:`);
      console.log(`  - Status: ${transaction.status}`);
      console.log(`  - Comprador aceptó: ${transaction.buyerAccepted}`);
      console.log(`  - Vendedor aceptó: ${transaction.sellerAccepted}`);
      console.log(`  - ¿Debería estar completada?: ${transaction.buyerAccepted && transaction.sellerAccepted}`);
      
      if (transaction.buyerAccepted && transaction.sellerAccepted && transaction.status !== 'COMPLETED') {
        console.warn(`⚠️ [MONITOR] INCONSISTENCIA: Ambos aceptaron pero estado no es COMPLETED`);
      }
    }
  }

  // ✅ MÉTODO TEMPORAL PARA VERIFICAR ACTUALIZACIONES - Solo para debugging
  private startTransactionPolling(transactionId: number) {
    console.log(`⏱️ [POLLING] Iniciando polling para transacción ${transactionId}`);
    
    const pollInterval = setInterval(() => {
      this.transactionService.getTransaction(transactionId).subscribe({
        next: (transaction) => {
          const currentTransaction = this.transactions[transactionId];
          
          // Solo loggar si hay cambios
          if (!currentTransaction || 
              currentTransaction.status !== transaction.status ||
              currentTransaction.buyerAccepted !== transaction.buyerAccepted ||
              currentTransaction.sellerAccepted !== transaction.sellerAccepted) {
            
            console.log(`⏱️ [POLLING] Estado actualizado para transacción ${transactionId}:`, {
              status: transaction.status,
              buyerAccepted: transaction.buyerAccepted,
              sellerAccepted: transaction.sellerAccepted,
              previousStatus: currentTransaction?.status,
              previousBuyerAccepted: currentTransaction?.buyerAccepted,
              previousSellerAccepted: currentTransaction?.sellerAccepted
            });
            
            // Actualizar estado local
            this.transactions[transactionId] = { ...transaction };
            this.transactions = { ...this.transactions };
            this.cdr.detectChanges();
          }
          
          // Detener el polling si la transacción está completada
          if (transaction.status === 'COMPLETED') {
            console.log(`⏱️ [POLLING] Transacción ${transactionId} completada, deteniendo polling`);
            clearInterval(pollInterval);
          }
        },
        error: (error) => {
          console.error(`❌ [POLLING] Error al obtener transacción ${transactionId}:`, error);
          clearInterval(pollInterval);
        }
      });
    }, 2000); // Polling cada 2 segundos
    
    // Detener el polling después de 2 minutos
    setTimeout(() => {
      clearInterval(pollInterval);
      console.log(`⏱️ [POLLING] Timeout: Deteniendo polling para transacción ${transactionId}`);
    }, 120000);
  }

  /**
   * Formatea el texto del mensaje del sistema para ocultar el ID de transacción
   * Solo para presentación visual, no afecta la lógica interna
   */
  formatSystemMessageText(messageText: string): string {
    if (!messageText) return messageText;
    
    // Solo ocultar el ID en mensajes de "Transacción creada"
    if (messageText.includes('creada con ID:')) {
      return messageText.replace(/Transacción creada con ID: \d+/, 'Transacción creada');
    }
    
    return messageText;
  }

}