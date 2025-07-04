import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../../services/product-service/product.service';
import { AuthService } from '../../../services/auth-service/auth.service';
import { NegotiationService } from '../../../services/negotiation-service/negotiation.service';
import { UserService } from '../../../services/user-service/user.service';
import { Product, Conversation } from '../../../models/product.model';
import { UserDto } from '../../../models/user.model';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.css']
})
export class FavoritesComponent implements OnInit {
  isLoading: boolean = false;
  products: Product[] = [];
  user: UserDto | null = null;

  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private negotiationService: NegotiationService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.user$.subscribe(user => {
      this.user = user as UserDto | null;
      if (!this.user) {
        this.router.navigate(['/login']);
      } else {
        this.loadFavorites();
        this.loadUserConversations();
      }
    });
  }

  loadFavorites(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }
    this.isLoading = true;
    this.productService.getUserFavorites(token).subscribe({
      next: (products) => {
        this.products = products.map(p => ({ ...p, isFavorite: true }));
        this.isLoading = false;
        this.updateProductConversations();
      },
      error: (error) => {
        console.error('Error al cargar favoritos:', error);
        this.isLoading = false;
        alert('No se pudieron cargar los favoritos. Inténtalo de nuevo.');
      }
    });
  }

  loadUserConversations(): void {
    if (!this.user) return;
    this.negotiationService.getUserConversations().subscribe({
      next: (conversations) => {
        this.updateProductConversations(conversations);
      },
      error: (error) => {
        console.error('Error al cargar conversaciones:', error);
      }
    });
  }

  updateProductConversations(conversations?: Conversation[]): void {
    if (!conversations) {
      this.negotiationService.getUserConversations().subscribe({
        next: (conv) => {
          this.applyConversationsToProducts(conv);
        },
        error: (error) => {
          console.error('Error al actualizar conversaciones:', error);
        }
      });
    } else {
      this.applyConversationsToProducts(conversations);
    }
  }

  applyConversationsToProducts(conversations: Conversation[]): void {
    this.products = this.products.map(product => {
      const conversation = conversations.find(conv => conv.productId === product.id);
      return conversation ? { ...product, conversation } : product;
    });
  }

  toggleFavorite(product: Product): void {
    if (!this.user) {
      this.router.navigate(['/login']);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Por favor, inicia sesión para gestionar favoritos.');
      return;
    }

    if (product.isFavorite) {
      this.productService.removeFavorite(product.id, token).subscribe({
        next: () => {
          this.products = this.products.filter(p => p.id !== product.id);
        },
        error: (error) => {
          console.error('Error al eliminar favorito:', error);
          alert('No se pudo eliminar el favorito. Inténtalo de nuevo.');
        }
      });
    } else {
      this.productService.addFavorite(product.id, token).subscribe({
        next: () => {
          product.isFavorite = true;
        },
        error: (error) => {
          console.error('Error al añadir favorito:', error);
          alert('No se pudo añadir el favorito. Inténtalo de nuevo.');
        }
      });
    }
  }

  goToProductDetail(productId: string): void {
    this.router.navigate([`/product/${productId}`]);
  }

  startNegotiation(productId: string): void {
    if (!this.user) {
      this.router.navigate(['/login']);
      return;
    }
    this.negotiationService.startNegotiation(productId).subscribe({
      next: (conversation) => {
        this.products = this.products.map(p =>
          p.id === productId ? { ...p, conversation } : p
        );
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

  goToMain(): void {
    this.router.navigate(['/main']);
  }
}