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
  imports: [CommonModule, FormsModule,  ReactiveFormsModule],
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
  private lastTransactionMessage: { [key: number]: Message } = {};

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
        console.log('Usuario actual cargado:', this.currentUser);
        if (user) {
          this.loadUserProducts();
          this.subscribeToUserNotifications(user.id);
          this.loadUserConversations();
        }
      },
      error: (error) => {
        this.toastr.error('Error al cargar el usuario: ' + error.message);
        this.router.navigate(['/login']);
      },
    });

    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        let conversationId: number | undefined;

        const stateId = history.state?.conversationId;
        if (stateId) {
          conversationId = stateId;
          console.log('conversationId obtenido desde state:', conversationId);
        } else {
          const paramId = this.route.snapshot.paramMap.get('id');
          if (paramId) {
            conversationId = +paramId;
            console.log('conversationId obtenido desde URL:', conversationId);
          }
        }

        if (!conversationId) {
          console.error('No se proporcionó un conversationId válido');
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
      console.log('conversationId inicial desde state:', initialId);
    } else {
      const paramId = this.route.snapshot.paramMap.get('id');
      if (paramId) {
        initialId = +paramId;
        console.log('conversationId inicial desde URL:', initialId);
      }
    }

    if (initialId) {
      this.selectConversation(initialId);
    } else {
      console.error('No se proporcionó un conversationId inicial');
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
        console.log('[loadUserProducts] Productos cargados:', this.userProducts);
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
      console.log('Conversación ya seleccionada:', conversationId);
      return;
    }

    this.selectedConversationId = conversationId;
    this.loadConversation(conversationId);
    this.subscribeToMessages(conversationId);
    this.router.navigate(['/chat', conversationId], { replaceUrl: true });
  }

  goToProfile() {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
      this.wsSubscription = null;
      console.log('[goToProfile] Suscripción al canal WebSocket cancelada');
    }
    if (this.wsNotificationSubscription) {
      this.wsNotificationSubscription.unsubscribe();
      this.wsNotificationSubscription = null;
      console.log('[goToProfile] Suscripción a notificaciones WebSocket cancelada');
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
    // Asegurarse de que no haya múltiples suscripciones al mismo canal
    if (this.subscribedConversationId === conversationId && this.wsSubscription) {
      console.log(`[WebSocket] Ya está suscrito al canal /topic/conversations/${conversationId}`);
      return;
    }

    // Cancelar suscripción previa si existe
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
      console.log(`[WebSocket] Suscripción anterior al canal /topic/conversations/${this.subscribedConversationId} cancelada`);
    }

    this.subscribedConversationId = conversationId;

    if (!this.isWebSocketConnected) {
      console.log('[WebSocket] Intentando conectar al WebSocket...');
      this.websocketService.connect().subscribe({
        next: (connected) => {
          if (connected) {
            this.isWebSocketConnected = true;
            console.log(`[WebSocket] Conectado al WebSocket`);
            this.subscribeToConversation(conversationId);
          } else {
            console.error('[WebSocket] No se pudo conectar al WebSocket');
            this.toastr.error('No se pudo conectar al WebSocket');
            setTimeout(() => this.subscribeToMessages(conversationId), 5000);
          }
        },
        error: (error) => {
          console.error('[WebSocket] Error al conectar:', error);
          this.toastr.error('Error al conectar al WebSocket: ' + error.message);
          setTimeout(() => this.subscribeToMessages(conversationId), 5000);
        },
      });
    } else {
      this.subscribeToConversation(conversationId);
    }
  }

  private subscribeToConversation(conversationId: number) {
    console.log(`[WebSocket] Suscribiendo al canal /topic/conversations/${conversationId}`);
    this.wsSubscription = this.websocketService
      .subscribeToConversation(conversationId)
      .subscribe({
        next: (message: any) => {
          console.log(`[WebSocket] Mensaje recibido en /topic/conversations/${conversationId}:`, message);
          if (!message) {
            console.error('[WebSocket] Mensaje recibido es undefined o null');
            return;
          }
          let content = message.content || 'Mensaje sin contenido';
          const token = localStorage.getItem('token');

          if (message.type === 'SYSTEM' && token) {
            const userIdMatch = content.match(/Usuario (\d+)/i);
            if (userIdMatch) {
              const userId = parseInt(userIdMatch[1], 10);
              this.userService.getUserById(userId, token).subscribe({
                next: (user: any) => {
                  content = content.replace(`Usuario ${userId}`, user.nickname || `Usuario ${userId}`);
                  this.addOrUpdateMessage(message, content, conversationId);
                  this.cdr.detectChanges();
                },
                error: () => {
                  this.addOrUpdateMessage(message, content, conversationId);
                },
              });
              return;
            }
          }

          this.addOrUpdateMessage(message, content, conversationId);
        },
        error: (error) => {
          console.error('[WebSocket] Error en la suscripción:', error);
          this.toastr.error('Error en la conexión WebSocket: ' + error.message);
          this.isWebSocketConnected = false;
          this.subscribedConversationId = null;
          this.subscribeToMessages(conversationId);
        },
      });
  }

  private addOrUpdateMessage(message: any, content: string, conversationId: number) {
    // Verificar que el mensaje tenga un ID válido
    if (!message.id) {
      console.warn('[WebSocket] Mensaje sin ID recibido, omitiendo:', message);
      return;
    }

    // Buscar mensaje temporal que coincida con el contenido y el senderId para reemplazarlo
    const tempMessageIndex = this.messages.findIndex(
      (msg) => msg.isLocal && msg.text === content && msg.senderId === message.senderId
    );
    if (tempMessageIndex !== -1) {
      this.messages.splice(tempMessageIndex, 1); // Eliminar el mensaje temporal
      console.log('[WebSocket] Mensaje temporal reemplazado:', content);
    }

    // Verificar duplicados estrictamente por ID
    const isDuplicate = this.messages.some((msg) => msg.id === message.id);
    if (isDuplicate) {
      console.log('[WebSocket] Mensaje duplicado detectado y omitido:', message);
      return;
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

    console.log('[WebSocket] Nuevo mensaje procesado y añadido:', newMessage);

    if (newMessage.isSystem) {
      const transactionId = this.getTransactionId(content);
      if (transactionId) {
        this.messages.push(newMessage);
        console.log('[WebSocket] Mensaje del sistema añadido:', newMessage);
        this.loadTransactionState(transactionId);
      } else {
        console.log('[WebSocket] Ignorando mensaje del sistema sin transactionId:', content);
        return;
      }
    } else {
      this.messages.push(newMessage);
      console.log('[WebSocket] Mensaje no del sistema añadido:', newMessage);
    }

    this.messages = [...this.messages];
    const convSummary = this.conversations.find((c) => c.id === conversationId);
    if (convSummary) {
      convSummary.lastMessage = newMessage;
      if (this.selectedConversationId !== conversationId) {
        convSummary.unreadCount += 1;
      }
      this.cdr.detectChanges();
    }

    this.scrollToBottom();
    this.cdr.detectChanges();
  }

  private cleanSystemMessage(text: string): string {
    const sentences = text.split('. ').filter((sentence, index, self) => 
      sentence && self.indexOf(sentence) === index
    );
    return sentences.join('. ') + (sentences.length > 0 ? '.' : '');
  }

  subscribeToUserNotifications(userId: number) {
    if (this.wsNotificationSubscription) {
      this.wsNotificationSubscription.unsubscribe();
      console.log(`[WebSocket] Suscripción anterior a notificaciones del usuario ${userId} cancelada`);
    }

    if (!this.isWebSocketConnected) {
      console.log('[WebSocket] Intentando conectar al WebSocket para notificaciones...');
      this.websocketService.connect().subscribe({
        next: (connected) => {
          if (connected) {
            this.isWebSocketConnected = true;
            console.log(`[WebSocket] Conectado al WebSocket para notificaciones`);
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
      console.log('[WebSocket] WebSocket ya está conectado, procediendo a suscribir a notificaciones...');
      this.subscribeToNotifications(userId);
    }
  }

  private subscribeToNotifications(userId: number) {
    console.log(`[WebSocket] Suscribiendo a notificaciones del usuario ${userId}`);
    this.wsNotificationSubscription = this.websocketService
      .subscribeToUserNotifications(userId)
      .subscribe({
        next: (notification: any) => {
          console.log('[WebSocket] Notificación recibida para el usuario:', notification);
          const transactionId = notification.transactionId;
          const newStatus = notification.status;

          if (transactionId) {
            console.log(`[WebSocket] Notificación - Llamando a loadTransactionState para transactionId: ${transactionId}`);
            this.loadTransactionState(transactionId);
            this.toastr.info(`La transacción ${transactionId} ha cambiado a estado: ${newStatus}`);
            this.cdr.detectChanges();
          }
        },
        error: (error) => this.toastr.error('Error al recibir notificaciones WebSocket: ' + error.message),
      });
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
    this.newMessage = ''; // Limpiar el campo inmediatamente

    // Deshabilitar el botón de envío para evitar múltiples envíos
    const sendButton = document.querySelector('.btn-send') as HTMLButtonElement;
    if (sendButton) {
      sendButton.disabled = true;
    }

    this.negotiationService
      .sendMessage(this.conversation.id, messageToSend, 'TEXT')
      .subscribe({
        next: (response) => {
          console.log('[sendMessage] Mensaje enviado al servidor, esperando WebSocket para actualización:', response);
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
            if (newMessage.isSystem) {
              newMessage.text = this.cleanSystemMessage(newMessage.text);
            }
            this.messages.push(newMessage);
            this.messages = [...this.messages];
            console.log('[submitProposal] Mensaje añadido:', newMessage);

            const convSummary = this.conversations.find((c) => c.id === this.conversation!.id);
            if (convSummary) {
              convSummary.lastMessage = newMessage;
              this.cdr.detectChanges();
            }
          } else {
            console.log('[submitProposal] Mensaje duplicado detectado y omitido:', newMessage);
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
                this.toastr.success(`Transacción creada con ID: ${transaction.id}`);
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
    console.log('[loadTransactionsFromMessages] Cargando transacciones desde mensajes...');
    console.log('[loadTransactionsFromMessages] Mensajes actuales:', this.messages);
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
    console.log(`[loadTransactionState] Cargando estado de la transacción ${transactionId}...`);
    this.transactionService.getTransaction(transactionId).subscribe({
      next: (transaction) => {
        console.log(`[loadTransactionState] Transacción ${transactionId} cargada:`, transaction);
        this.transactions[transactionId] = { ...transaction };
        this.transactions = { ...this.transactions };

        if (transaction.status === 'COMPLETED') {
          console.log(`[loadTransactionState] Transacción ${transactionId} completada, actualizando lista de productos...`);
          const proposalMessage = this.messages.find((m) => m.type === 'PROPOSAL' && this.getTransactionId(m.text) === transactionId);
          const responseMessage = this.messages.find((m) => m.type === 'PROPOSAL_RESPONSE' && this.getTransactionId(m.text) === transactionId);

          const tradedProductIds: (string | undefined)[] = [];
          if (proposalMessage?.productId) {
            tradedProductIds.push(proposalMessage.productId);
          }
          if (responseMessage?.productId) {
            tradedProductIds.push(responseMessage.productId);
          }
          console.log('[loadTransactionState] Productos involucrados en la transacción:', tradedProductIds);

          this.userProducts = this.userProducts.filter((product) => !tradedProductIds.includes(product.id));
          console.log('[loadTransactionState] Productos filtrados de userProducts:', this.userProducts);

          this.loadUserProducts();
        }

        setTimeout(() => {
          this.cdr.detectChanges();
          console.log('[loadTransactionState] Detección de cambios forzada con setTimeout');
          console.log(`[loadTransactionState] transaction.status: ${transaction.status}, hasAccepted(${transactionId}): ${this.hasAccepted(transactionId)}`);
          console.log(`[loadTransactionState] Condición para mostrar botones: ${transaction.status === 'PENDING' && !this.hasAccepted(transactionId)}`);
        }, 0);
        console.log('[loadTransactionState] Estado actual de this.transactions:', this.transactions);
      },
      error: (error) => {
        console.error(`[loadTransactionState] Error al cargar la transacción ${transactionId}:`, error);
        this.toastr.error('Error al cargar el estado de la transacción: ' + error.message);
      },
    });
  }

  acceptTransaction(transactionId: number) {
    if (!this.conversation || !this.currentUser) return;

    console.log(`[acceptTransaction] Aceptando transacción ${transactionId}...`);
    this.isAccepting[transactionId] = true;
    this.cdr.detectChanges();
    this.negotiationService.confirmTransaction(this.conversation.id, transactionId, true).subscribe({
      next: (transaction) => {
        console.log(`[acceptTransaction] Transacción ${transactionId} aceptada:`, transaction);
        this.transactions[transactionId] = { ...transaction };
        this.transactions = { ...this.transactions };
        this.cdr.detectChanges();
        this.toastr.success('Transacción aceptada');
        this.isAccepting[transactionId] = false;
        console.log('[acceptTransaction] Evaluando condición para mostrar botones después de aceptar...');
        console.log(`[acceptTransaction] transaction.status: ${transaction.status}, hasAccepted(${transactionId}): ${this.hasAccepted(transactionId)}`);
        console.log(`[acceptTransaction] Condición para mostrar botones: ${transaction.status === 'PENDING' && !this.hasAccepted(transactionId)}`);
      },
      error: (error) => {
        console.error(`[acceptTransaction] Error al aceptar la transacción ${transactionId}:`, error);
        this.toastr.error('Error al aceptar la transacción: ' + error.message);
        this.isAccepting[transactionId] = false;
        this.cdr.detectChanges();
      },
    });
  }

  rejectTransaction(transactionId: number) {
    if (!this.conversation || !this.currentUser) return;

    console.log(`[rejectTransaction] Rechazando transacción ${transactionId}...`);
    this.isRejecting[transactionId] = true;
    this.cdr.detectChanges();
    this.negotiationService.confirmTransaction(this.conversation.id, transactionId, false).subscribe({
      next: (transaction) => {
        console.log(`[rejectTransaction] Transacción ${transactionId} rechazada:`, transaction);
        this.transactions[transactionId] = { ...transaction };
        this.transactions = { ...this.transactions };
        this.cdr.detectChanges();
        this.toastr.success('Transacción rechazada');
        this.isRejecting[transactionId] = false;
        console.log('[rejectTransaction] Evaluando condición para mostrar botones después de rechazar...');
        console.log(`[rejectTransaction] transaction.status: ${transaction.status}, hasAccepted(${transactionId}): ${this.hasAccepted(transactionId)}`);
        console.log(`[rejectTransaction] Condición para mostrar botones: ${transaction.status === 'PENDING' && !this.hasAccepted(transactionId)}`);
      },
      error: (error) => {
        console.error(`[rejectTransaction] Error al rechazar la transacción ${transactionId}:`, error);
        this.toastr.error('Error al rechazar la transacción: ' + error.message);
        this.isRejecting[transactionId] = false;
        this.cdr.detectChanges();
      },
    });
  }

  showTransactionDetails(transactionId: number) {
    console.log(`[showTransactionDetails] Mostrando detalles de la transacción ${transactionId}`);
    const transaction = this.transactions[transactionId];
    if (!transaction) {
      console.warn('[showTransactionDetails] No se encontraron detalles de la transacción');
      this.toastr.error('No se encontraron detalles de la transacción');
      return;
    }

    const proposalMessage = this.messages.filter((m) => m.type === 'PROPOSAL').slice(-1)[0];
    const responseMessage = this.messages.filter((m) => m.type === 'PROPOSAL_RESPONSE').slice(-1)[0];

    if (!proposalMessage || !responseMessage) {
      console.warn('[showTransactionDetails] No se encontraron mensajes de propuesta o respuesta');
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
    console.log('[showTransactionDetails] Detalles mostrados:', details);
    this.toastr.info(details, 'Detalles de la Transacción', { timeOut: 10000 });
  }

  hasAccepted(transactionId: number): boolean {
    const transaction = this.transactions[transactionId];
    if (!transaction || !this.currentUser) {
      console.log('[hasAccepted] Transacción o usuario no definido:', { transaction, currentUser: this.currentUser });
      return false;
    }

    const isBuyer = this.currentUser.id === transaction.buyerId;
    const hasAccepted = isBuyer ? transaction.buyerAccepted : transaction.sellerAccepted;
    console.log(`[hasAccepted] Usuario ${this.currentUser.id}, es comprador: ${isBuyer}, buyerAccepted: ${transaction.buyerAccepted}, sellerAccepted: ${transaction.sellerAccepted}, resultado: ${hasAccepted}`);
    return hasAccepted;
  }

  getTransactionId(messageText: string): number {
    console.log(`[getTransactionId] Procesando mensaje: "${messageText}"`);
    if (!messageText || typeof messageText !== 'string') {
      console.warn('[getTransactionId] messageText es undefined, null o no es un string:', messageText);
      return 0;
    }
    let match = messageText.match(/ID: (\d+)/);
    if (match) {
      console.log(`[getTransactionId] Coincidencia encontrada (ID:): ${match[1]}`);
      return parseInt(match[1], 10);
    }
    match = messageText.match(/transacción (\d+)/i);
    if (match) {
      console.log(`[getTransactionId] Coincidencia encontrada (transacción): ${match[1]}`);
      return parseInt(match[1], 10);
    }
    match = messageText.match(/Transaccion (\d+)/i);
    if (match) {
      console.log(`[getTransactionId] Coincidencia encontrada (Transaccion sin tilde): ${match[1]}`);
      return parseInt(match[1], 10);
    }
    match = messageText.match(/Transacción ID: (\d+)/i);
    if (match) {
      console.log(`[getTransactionId] Coincidencia encontrada (Transacción ID:): ${match[1]}`);
      return parseInt(match[1], 10);
    }
    console.warn('[getTransactionId] No se encontró transactionId en el mensaje');
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
      console.log('[ngOnDestroy] Suscripción al canal WebSocket cancelada');
    }
    if (this.wsNotificationSubscription) {
      this.wsNotificationSubscription.unsubscribe();
      console.log('[ngOnDestroy] Suscripción a notificaciones WebSocket cancelada');
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
      console.log('[ngOnDestroy] Suscripción al router cancelada');
    }
    this.isWebSocketConnected = false;
    this.subscribedConversationId = null;
  }

  consoleLog(transaction: Transaction): boolean {
    console.log('[HTML] Transacción renderizada:', transaction);
    const shouldShowButtons = transaction.status === 'PENDING' && !this.hasAccepted(transaction.id);
    console.log('[HTML] Condición para mostrar botones:', shouldShowButtons);
    console.log('[HTML] transaction.status:', transaction.status);
    console.log('[HTML] hasAccepted:', this.hasAccepted(transaction.id));
    return true;
  }
}