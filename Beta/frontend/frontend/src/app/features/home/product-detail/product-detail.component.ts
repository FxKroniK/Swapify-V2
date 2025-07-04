import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ProductService } from '../../../services/product-service/product.service';
import { UserService } from '../../../services/user-service/user.service';
import { NegotiationService } from '../../../services/negotiation-service/negotiation.service';
import { AuthService } from '../../../services/auth-service/auth.service';
import { Product, Conversation } from '../../../models/product.model';
import { UserProfile, UserDto } from '../../../models/user.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  productId: string | null = null;
  token: string | null = localStorage.getItem('token');
  owner: UserProfile | null = null;
  user: UserDto | null = null;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private userService: UserService,
    private negotiationService: NegotiationService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Obtener el usuario autenticado
    this.authService.user$.subscribe(user => {
      this.user = user as UserDto | null;
    });

    // Verificar si hay un token válido
    if (!this.token) {
      console.error('No se encontró el token del usuario');
      this.router.navigate(['/login']);
      return;
    }

    // Obtener el productId de la URL
    this.productId = this.route.snapshot.paramMap.get('id');
    if (!this.productId) {
      console.error('No se encontró el ID del producto en la URL');
      this.router.navigate(['/home']);
      return;
    }

    // Cargar los detalles del producto
    this.productService.getProductById(this.productId, this.token).subscribe({
      next: (product) => {
        console.log('Producto cargado:', product);
        this.product = product;
        // Cargar conversaciones para verificar si ya existe un chat
        if (this.user && this.productId) {
          this.loadProductConversation(this.productId);
        }
        // Cargar el perfil del propietario
        if (product.ownerId) {
          console.log('Solicitando perfil del propietario con ownerId:', product.ownerId);
          this.userService.getUserById(product.ownerId, this.token!).subscribe({
            next: (owner: UserProfile) => {
              console.log('Propietario cargado:', owner);
              this.owner = owner;
              console.log('Nickname del propietario:', owner.nickname);
            },
            error: (error: HttpErrorResponse) => {
              console.error('Error al cargar el perfil del propietario:', error.message, error.status, error.error);
              this.owner = null;
            }
          });
        } else {
          console.error('El producto no tiene ownerId:', product);
        }
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error al cargar los detalles del producto:', error.message, error.status, error.error);
        this.router.navigate(['/home']);
      }
    });
  }

  loadProductConversation(productId: string): void {
    this.negotiationService.getUserConversations().subscribe({
      next: (conversations: Conversation[]) => {
        const conversation = conversations.find(conv => conv.productId === productId);
        if (this.product && conversation) {
          this.product = { ...this.product, conversation };
        }
      },
      error: (error) => {
        console.error('Error al cargar conversaciones:', error);
      }
    });
  }

  startNegotiation(productId: string): void {
    if (!this.user) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.token) {
      console.error('No se encontró el token del usuario');
      this.router.navigate(['/login']);
      return;
    }

    this.negotiationService.startNegotiation(productId).subscribe({
      next: (conversation) => {
        if (this.product) {
          this.product = { ...this.product, conversation };
        }
        this.router.navigate(['/chat'], { state: { conversationId: conversation.id } });
      },
      error: (error) => {
        console.error('Error al iniciar negociación:', error);
        alert('Error al iniciar la conversación. Por favor, intenta de nuevo.');
      }
    });
  }

  goToChat(conversationId: number): void {
    this.router.navigate(['/chat'], { state: { conversationId } });
  }

  goToOwnerProfile(): void {
    if (this.owner) {
      this.router.navigate([`/profile/${this.owner.id}`]);
    }
  }

  goToHome(): void {
    this.router.navigate(['/home']);
  }
}