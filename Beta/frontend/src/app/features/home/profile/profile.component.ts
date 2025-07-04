import { Component, OnInit } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { RouterLink } from '@angular/router';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { UserService } from '../../../services/user-service/user.service';
import { AuthService } from '../../../services/auth-service/auth.service';
import { ProductService } from '../../../services/product-service/product.service';
import { CloudinaryService } from '../../../services/cloudinary-service/cloudinary.service';
import { NegotiationService } from '../../../services/negotiation-service/negotiation.service';
import { TransactionService } from '../../../services/transaction-service/transaction.service';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { UserProfile, UserDto } from '../../../models/user.model';
import { RevieweableProductDto } from '../../../models/review.model';
import { CreateReviewComponent } from '../create-review/create-review.component';
import { ReviewsComponent } from '../reviews/reviews.component';
import { ReviewService } from '../../../services/review-service/review.service';

export interface Transaction {
  id: number;
  sellerId: number;
  buyerId: number;
  productOfferedId: string;
  productRequestedId: string;
  creditsOffered: number;
  creditsRequested: number;
  status: 'PENDING' | 'COMPLETED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  buyerAccepted: boolean;
  sellerAccepted: boolean;
  isProcessing: boolean;
  conversationId: number;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule, NavbarComponent, CreateReviewComponent, ReviewsComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user: UserDto | null = null;
  profile: UserProfile | null = null;
  isOwnProfile: boolean = true;
  nickname: string = '';
  aboutMe: string = '';
  profileImageUrl: string = '';
  imageFile: File | null = null;
  isEditing: boolean = false;
  isEditingMe: boolean = false;
  isEditingUsername: boolean = false;
  products: any[] = [];
  conversations: any[] = [];
  otherUserNames: { [conversationId: number]: string } = {};
  latitude: number | null = null;
  longitude: number | null = null;
  municipio: string | null = null;
  pais: string | null = null;
  mostrarSeccionProductos: boolean = true;
  showReviewModal: boolean = false;
  purchasedProducts: any[] = [];
  isProfileMenuOpen: boolean = false;
  reviewableProducts: any[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 4;
  mostrarHistorialResenas: boolean = false;
  activeTab: 'productos' | 'conversaciones' | 'resenas' = 'productos';
  starCounts: number[] = [0, 0, 0, 0, 0]; // [5,4,3,2,1]
  totalReviews: number = 0;
  averageRating: number = 0;

  selectedProductForReview: RevieweableProductDto | null = null;
  showReviewForm = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    private authService: AuthService,
    private productService: ProductService,
    private cloudinaryService: CloudinaryService,
    private http: HttpClient,
    private negotiationService: NegotiationService,
    private transactionService: TransactionService,
    private reviewService: ReviewService,
  ) { }

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      this.user = user || null;
    });

    const userId = this.route.snapshot.paramMap.get('userId');
    const token = localStorage.getItem('token');

    if (userId && token) {
      this.isOwnProfile = this.user?.id === +userId;
      this.userService.getUserById(+userId, token).subscribe({
        next: response => {
          this.profile = response;
          this.nickname = response.nickname || '';
          this.aboutMe = response.aboutMe || '';
          this.profileImageUrl = response.profilePictureUrl || '';
          this.recuperarProductosPropietario(+userId);
          if (this.isOwnProfile) {
            this.loadReviewableProducts();
          }
          this.cargarResumenValoraciones();
        },
        error: error => {
          console.error('Error fetching other user profile:', error);
          this.router.navigate(['/home']);
        }
      });
    } else if (token) {
      this.isOwnProfile = true;
      this.userService.getUserProfile(token).subscribe({
        next: response => {
          this.profile = response;
          this.nickname = response.nickname || '';
          this.aboutMe = response.aboutMe || '';
          this.profileImageUrl = response.profilePictureUrl || '';
          this.recuperarProductosPropietario();
          this.loadReviewableProducts();
          this.cargarResumenValoraciones();
        },
        error: error => {
          console.error('Error fetching profile:', error);
          this.router.navigate(['/login']);
        }
      });
    } else {
      console.error('No token available.');
      this.router.navigate(['/login']);
    }

    if (this.isOwnProfile) {
      this.obtenerUbicacion();
    }
  }

  get paginatedProducts() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.products.slice(startIndex, endIndex);
  }

  get totalPages(): number[] {
    return Array.from({ length: Math.ceil(this.products.length / this.itemsPerPage) }, (_, i) => i + 1);
  }

  toggleReviewModal() {
    if (this.isOwnProfile) {
      this.showReviewModal = !this.showReviewModal;
    }
  }

  cargarResumenValoraciones() {
    const token = localStorage.getItem('token');
    if (this.user?.id && token) {
      this.reviewService.getReviewsForUser(this.user.id.toString(), token).subscribe(reviews => {
        this.totalReviews = reviews.length;
        this.starCounts = [0, 0, 0, 0, 0];
        let sum = 0;
        reviews.forEach(r => {
          if (r.rating >= 1 && r.rating <= 5) {
            this.starCounts[5 - r.rating]++;
            sum += r.rating;
          }
        });
        this.averageRating = this.totalReviews > 0 ? sum / this.totalReviews : 0;
      });
    }
  }

  getStarPercentage(star: number): number {
    const index = 5 - star; // starCounts[0] = 5 estrellas, starCounts[1] = 4 estrellas, etc.
    if (this.totalReviews === 0) return 0;
    return (this.starCounts[index] / this.totalReviews) * 100;
  }

  writeReview(productId: number) {
    if (this.isOwnProfile) {
      this.router.navigate(['/createReview/', productId]);
      console.log('Writing review for product ID:', productId);
    }
  }

  openReviewForm(product: RevieweableProductDto) {
    this.selectedProductForReview = product;
    this.showReviewForm = true;
  }

  closeReviewForm() {
    this.selectedProductForReview = null;
    this.showReviewForm = false;
    this.loadReviewableProducts();
    this.cargarResumenValoraciones();
  }

  openReviewModal() {
    if (this.isOwnProfile) {
      this.showReviewModal = true;
    }
  }

  mostrarProductos(): void {
    this.mostrarSeccionProductos = true;
    this.recuperarProductosPropietario(this.profile?.id);
  }

  mostrarConversaciones(): void {
    if (this.isOwnProfile) {
      this.mostrarSeccionProductos = false;
      this.recuperarConversaciones();
    }
  }

  mostrarTodasResenas() {
    this.mostrarHistorialResenas = true;
  }

  cerrarHistorialResenas() {
    this.mostrarHistorialResenas = false;
  }

  recuperarConversaciones() {
    const token = localStorage.getItem('token');
    if (token && this.user?.id && this.isOwnProfile) {
      this.negotiationService.getUserConversations().subscribe({
        next: (response) => {
          this.conversations = response;
          this.products = this.products.map(product => ({
            ...product,
            conversation: this.conversations.find(conv => conv.productId === product.id && conv.status === 'ACTIVE')
          }));
        },
        error: (error) => {
          console.error('Error fetching conversations:', error);
        }
      });
    }
  }

  goToChat(conversationId: number) {
    if (this.isOwnProfile) {
      this.router.navigate([`/chat/${conversationId}`]);
    }
  }

  deleteConversation(conversationId: number) {
    if (this.isOwnProfile && confirm('¿Estás seguro de que quieres eliminar esta conversación?')) {
      this.negotiationService.deleteConversation(conversationId).subscribe({
        next: () => {
          this.conversations = this.conversations.filter(conv => conv.id !== conversationId);
          delete this.otherUserNames[conversationId];
          this.products = this.products.map(product => {
            if (product.conversation && product.conversation.id === conversationId) {
              const { conversation, ...rest } = product;
              return rest;
            }
            return product;
          });
        },
        error: (error) => {
          console.error('Error deleting conversation:', error);
          alert('No se pudo eliminar la conversación. Inténtalo de nuevo.');
        }
      });
    }
  }

  obtenerUbicacion(): void {
    if (this.isOwnProfile && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.latitude = position.coords.latitude;
          this.longitude = position.coords.longitude;
          this.obtenerMunicipio();
        },
        (error) => {
          console.error('Error obtaining location:', error);
        }
      );
    }
  }

  obtenerMunicipio(): void {
    if (this.isOwnProfile && this.latitude && this.longitude) {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${this.latitude}&lon=${this.longitude}&format=json`;
      this.http.get<any>(url).subscribe({
        next: (response) => {
          this.municipio = response.address.city || response.address.town || response.address.village || 'Municipio no encontrado';
          this.pais = response.address.country || 'País no encontrado';
        },
        error: (error) => {
          console.error('Error obtaining municipality and country:', error);
        }
      });
    }
  }

  updateLocation(): void {
    const token = localStorage.getItem('token');
    if (!this.isOwnProfile || !token || !this.user?.id) {
      console.error('Cannot update location: not own profile or no token/ID.');
      return;
    }

    if (this.latitude && this.longitude && this.municipio) {
      const payload = { latitude: this.latitude, longitude: this.longitude, locationName: this.municipio };
      this.userService.updateUserLocation(this.user.id, payload, token).subscribe({
        next: (response) => {
          if (this.profile) {
            this.profile = { ...this.profile, locationName: this.municipio };
          }
          alert('Ubicación actualizada correctamente.');
        },
        error: (error) => {
          alert('No se pudo actualizar la ubicación. Inténtalo de nuevo.');
        }
      });
    } else {
      alert('No se pudo obtener la ubicación completa. Por favor, inténtalo de nuevo.');
    }
  }

  enableEditing() {
    if (this.isOwnProfile) {
      this.isEditing = true;
    }
  }

  enableEditingMe() {
    if (this.isOwnProfile) {
      this.isEditingMe = true;
    }
  }

  onFileSelected(event: Event) {
    if (this.isOwnProfile) {
      const input = event.target as HTMLInputElement;
      if (input.files && input.files.length > 0) {
        this.imageFile = input.files[0];
      }
    }
  }

  saveProfile() {
    if (!this.isOwnProfile) return;

    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    if (this.imageFile) {
      this.cloudinaryService.uploadImage(this.imageFile, token).subscribe({
        next: (uploadResponse) => {
          this.profileImageUrl = uploadResponse.imageUrl;
          this.updateProfile(token);
        },
        error: (error) => {
          if (error.status === 403) {
            alert('Error 403: ' + error.error.error);
          }
        }
      });
    } else {
      this.updateProfile(token);
    }
  }

  private updateProfile(token: string): void {
    const updatedProfile: any = {
      profilePictureUrl: this.profileImageUrl
    };

    this.userService.updateUserProfile(token, updatedProfile).subscribe({
      next: response => {
        if (this.profile) {
          this.profile = { ...this.profile, profilePictureUrl: this.profileImageUrl };
        }
        if (this.user) {
          this.user = { ...this.user, profilePictureUrl: this.profileImageUrl };
          this.authService.updateUser(this.user);
        }
        setTimeout(() => {
          this.isEditing = false;
        }, 0);
      },
      error: error => {
        setTimeout(() => {
          this.isEditing = false;
        }, 0);
      }
    });
  }

  saveProfileAbout() {
    if (!this.isOwnProfile) return;

    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    const updatedProfile: any = {};
    if (this.aboutMe) {
      updatedProfile.aboutMe = this.aboutMe;
    }

    this.userService.updateUserProfile(token, updatedProfile).subscribe({
      next: response => {
        if (this.profile) {
          this.profile = { ...this.profile, aboutMe: this.aboutMe };
        }
        setTimeout(() => {
          this.isEditingMe = false;
        }, 0);
      },
      error: error => {
        setTimeout(() => {
          this.isEditingMe = false;
        }, 0);
      }
    });
  }

  recogerProductos() {
    const token = localStorage.getItem('token');
    if (token) {
      this.productService.getAllProducts(token).subscribe({
        next: response => {
          this.products = response;
        },
        error: error => {
        }
      });
    }
  }

  recuperarProductosPropietario(userId?: number) {
    const token = localStorage.getItem('token');
    const id = userId || this.user?.id;
    if (token && id) {
      this.productService.getProductsByOwner(id, token).subscribe({
        next: (response) => {
          this.products = response.map((product: any) => ({
            ...product,
            imageUrl: product.imageUrl,
            imageId: product.imageId
          }));
          if (this.isOwnProfile) {
            this.recuperarConversaciones();
          }
        },
        error: (error) => {
        }
      });
    }
  }

  eliminarProducto(productId: string, imageId: string) {
    if (!this.isOwnProfile) return;

    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    this.cloudinaryService.deleteImage(imageId).subscribe({
      next: () => {
        this.productService.deleteProduct(productId, token).subscribe({
          next: () => {
            this.recuperarProductosPropietario();
          },
          error: error => {
          }
        });
      },
      error: error => {
      }
    });
  }

  toggleEditUsername() {
    if (this.isOwnProfile) {
      this.isEditingUsername = true;
    }
  }

  updateUsername() {
    if (!this.isOwnProfile) return;

    if (!this.nickname.trim()) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    const profileData = { nickname: this.nickname };

    this.userService.updateUserProfile(token, profileData).subscribe({
      next: (response) => {
        if (this.profile) {
          this.profile = { ...this.profile, nickname: this.nickname };
        }
        if (this.user && this.isOwnProfile) {
          this.user = { ...this.user, nickname: this.nickname };
          this.authService.updateUser(this.user);
        }
        this.isEditingUsername = false;
      },
      error: (error) => {
      }
    });
  }

  logout() {
    if (this.isOwnProfile) {
      this.authService.logout();
      this.router.navigate(['/main']);
    }
  }

  irARegistro() {
    this.router.navigate(['/register']);
  }

  irAProfile() {
    this.router.navigate(['/profile']);
  }

  irAContacta() {
    this.router.navigate(['/contact']);
  }

  irALogin() {
    this.router.navigate(['/login']);
  }

  irACrear() {
    if (this.isOwnProfile) {
      this.router.navigate(['/create']);
    }
  }

  irAEditar(productId: string): void {
    if (this.isOwnProfile) {
      this.router.navigate(['/edit', productId]);
    }
  }

  loadReviewableProducts() {
  if (!this.isOwnProfile || !this.user || !this.user.id) {
    return;
  }

  const token = localStorage.getItem('token');
  if (!token) {
    return;
  }

  this.reviewService.getReviewableProducts(this.user.id.toString(), token).subscribe({
    next: (products) => {
      this.reviewableProducts = products;
    },
    error: (error) => {
      console.error('Error al cargar productos para reseñar:', error);
      this.reviewableProducts = [];
    }
  });
}
}