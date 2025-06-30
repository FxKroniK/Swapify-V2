import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../../services/product-service/product.service';
import { AuthService } from '../../../services/auth-service/auth.service';
import { Product, Conversation } from '../../../models/product.model';
import { NegotiationService } from '../../../services/negotiation-service/negotiation.service';
import { UserService } from '../../../services/user-service/user.service';
import { UserProfile, UserDto } from '../../../models/user.model';

declare const google: any;

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {
  searchKeyword: string = '';
  selectedCategory: string = '';
  search: boolean = false;
  searchCategory: boolean = false;
  isLoading: boolean = false;
  products: Product[] = [];
  trendingProducts: Product[] = [];
  user: UserDto | null = null;
  isProfileMenuOpen: boolean = false;
  isLocationModalOpen: boolean = false;
  radius: number = 10;
  latitude: number = 40.416775;
  longitude: number = -3.703790;
  recentlyViewed: Product[] = [];
  similarProducts: Product[] = [];
  map: any;
  marker: any;

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
        const token = localStorage.getItem('token') ?? undefined;
        if (token) {
          this.userService.getUserProfile(token).subscribe({
            next: (profile: UserProfile) => {
              if (this.user) {
                this.user = { ...this.user, profilePictureUrl: profile.profilePictureUrl };
              }
            },
            error: (error) => {
              console.error('Error al cargar el perfil del usuario:', error);
            }
          });
          this.loadFavorites(token);
        }
      }
    });

    this.loadProducts();
    this.loadTrendingProducts();
    this.loadRecentlyViewed();
    this.loadSimilarProducts();
    this.loadUserConversations();
  }

  loadFavorites(token: string): void {
    this.productService.getUserFavorites(token).subscribe({
      next: (favorites) => {
        this.updateFavoriteStatus(favorites);
      },
      error: (error) => {
        console.error('Error al cargar favoritos:', error);
      }
    });
  }

  updateFavoriteStatus(favorites: Product[]): void {
    const favoriteIds = new Set(favorites.map(f => f.id));
    this.products = this.products.map(p => ({
      ...p,
      isFavorite: favoriteIds.has(p.id)
    }));
    this.trendingProducts = this.trendingProducts.map(p => ({
      ...p,
      isFavorite: favoriteIds.has(p.id)
    }));
    this.recentlyViewed = this.recentlyViewed.map(p => ({
      ...p,
      isFavorite: favoriteIds.has(p.id)
    }));
    this.similarProducts = this.similarProducts.map(p => ({
      ...p,
      isFavorite: favoriteIds.has(p.id)
    }));
  }

  loadTrendingProducts(): void {
    this.productService.getTrendingProducts().subscribe({
      next: (products) => {
        this.trendingProducts = products;
        this.updateProductConversations();
        const token = localStorage.getItem('token');
        if (token) {
          this.loadFavorites(token);
        }
      },
      error: (error) => {
        console.error('Error al cargar productos trending:', error);
      }
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
          product.isFavorite = false;
          product.favoriteCount = (product.favoriteCount || 1) - 1;
          this.updateFavoriteInLists(product);
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
          product.favoriteCount = (product.favoriteCount || 0) + 1;
          this.updateFavoriteInLists(product);
        },
        error: (error) => {
          console.error('Error al añadir favorito:', error);
          alert('No se pudo añadir el favorito. Inténtalo de nuevo.');
        }
      });
    }
  }

  updateFavoriteInLists(updatedProduct: Product): void {
    const updateList = (list: Product[]) =>
      list.map(p => p.id === updatedProduct.id ? { ...p, isFavorite: updatedProduct.isFavorite, favoriteCount: updatedProduct.favoriteCount } : p);

    this.products = updateList(this.products);
    this.trendingProducts = updateList(this.trendingProducts);
    this.recentlyViewed = updateList(this.recentlyViewed);
    this.similarProducts = updateList(this.similarProducts);
  }

  initMap(): void {
    const defaultLocation = { lat: this.latitude, lng: this.longitude };
    this.map = new google.maps.Map(document.getElementById('map'), {
      center: defaultLocation,
      zoom: 12,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.latitude = position.coords.latitude;
          this.longitude = position.coords.longitude;
          this.map.setCenter({ lat: this.latitude, lng: this.longitude });
          this.addMarker(this.latitude, this.longitude);
        },
        (error) => {
          console.error('Error al obtener la ubicación del usuario:', error);
          alert('No se pudo obtener tu ubicación. Usando Madrid como ubicación predeterminada.');
          this.addMarker(this.latitude, this.longitude);
        }
      );
    } else {
      alert('La geolocalización no está soportada por tu navegador. Usando Madrid como ubicación predeterminada.');
      this.addMarker(this.latitude, this.longitude);
    }

    this.map.addListener('click', (event: any) => {
      this.latitude = event.latLng.lat();
      this.longitude = event.latLng.lng();
      this.addMarker(this.latitude, this.longitude);

      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat: this.latitude, lng: this.longitude } }, (results: any, status: any) => {
        if (status === google.maps.GeocoderStatus.OK && results[0]) {
          const locationInput = document.getElementById('locationInput') as HTMLInputElement;
          locationInput.value = results[0].formatted_address;
        }
      });
    });
  }

  addMarker(lat: number, lng: number): void {
    if (this.marker) {
      this.marker.setMap(null);
    }
    this.marker = new google.maps.Marker({
      position: { lat, lng },
      map: this.map,
      title: 'Ubicación seleccionada'
    });
  }

  openLocationModal(): void {
    this.isLocationModalOpen = true;
    setTimeout(() => {
      if (!this.map) {
        this.initMap();
      }
    }, 0);
  }

  closeLocationModal(): void {
    this.isLocationModalOpen = false;
  }

  centerMapOnLocation(): void {
    const locationInput = (document.getElementById('locationInput') as HTMLInputElement).value;
    if (!locationInput) {
      alert('Por favor, introduce una ubicación');
      return;
    }

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: locationInput }, (results: any, status: any) => {
      if (status === google.maps.GeocoderStatus.OK && results[0]) {
        this.latitude = results[0].geometry.location.lat();
        this.longitude = results[0].geometry.location.lng();
        this.map.setCenter({ lat: this.latitude, lng: this.longitude });
        this.addMarker(this.latitude, this.longitude);
      } else {
        alert('No se pudo encontrar la ubicación. Inténtalo de nuevo.');
      }
    });
  }

  updateRadius(): void {
    // Implementar si es necesario
  }

  applyFilterAndSearch(): void {
  const token = localStorage.getItem('token');
  console.log('Token en applyFilterAndSearch:', token);
  if (!token) {
    alert('No se encontró un token. Por favor, inicia sesión.');
    this.router.navigate(['/login']);
    return;
  }
  if (this.latitude == null || this.longitude == null || this.radius == null) {
    console.error('Parámetros inválidos:', { latitude: this.latitude, longitude: this.longitude, radius: this.radius });
    alert('Por favor, selecciona una ubicación válida.');
    return;
  }
  this.isLoading = true;
  this.isLocationModalOpen = false;
  this.search = true;
  this.searchCategory = false;
  this.productService
    .searchProductsByCoordinates(this.latitude, this.longitude, this.radius, this.selectedCategory, this.searchKeyword)
    .subscribe({
      next: (products) => {
        this.products = products;
        this.isLoading = false;
        this.updateProductConversations();
        this.loadFavorites(token);
      },
      error: (error) => {
        console.error('Error al buscar por coordenadas:', error);
        this.isLoading = false;
        alert('Error al buscar productos por ubicación: ' + error.message);
      }
    });
}

  loadProducts(): void {
    this.isLoading = true;
    const token = localStorage.getItem('token') ?? undefined;
    this.productService.getAllProducts(token).subscribe({
      next: (products) => {
        this.products = products;
        this.isLoading = false;
        this.updateProductConversations();
        if (token) {
          this.loadFavorites(token);
        }
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
        this.isLoading = false;
      }
    });
  }

  buscarProductos(): void {
    if (!this.searchKeyword.trim()) {
      this.search = false;
      this.loadProducts();
      return;
    }
    this.isLoading = true;
    this.search = true;
    this.searchCategory = false;
    this.productService
      .searchProducts(this.searchKeyword, this.latitude, this.longitude, this.radius, this.selectedCategory)
      .subscribe({
        next: (products) => {
          this.products = products;
          this.isLoading = false;
          this.updateProductConversations();
          const token = localStorage.getItem('token');
          if (token) {
            this.loadFavorites(token);
          }
        },
        error: (error) => {
          console.error('Error al buscar productos:', error);
          this.isLoading = false;
        }
      });
  }

  filtrarPorCategoria(category: string): void {
    this.searchCategory = true;
    this.search = false;
    this.isLoading = true;
    this.productService.getProductsByCategory(category).subscribe({
      next: (products) => {
        this.products = products;
        this.isLoading = false;
        this.updateProductConversations();
        const token = localStorage.getItem('token');
        if (token) {
          this.loadFavorites(token);
        }
      },
      error: (error) => {
        console.error('Error al filtrar por categoría:', error);
        this.isLoading = false;
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
    this.trendingProducts = this.trendingProducts.map(product => {
      const conversation = conversations.find(conv => conv.productId === product.id);
      return conversation ? { ...product, conversation } : product;
    });
    this.recentlyViewed = this.recentlyViewed.map(product => {
      const conversation = conversations.find(conv => conv.productId === product.id);
      return conversation ? { ...product, conversation } : product;
    });
    this.similarProducts = this.similarProducts.map(product => {
      const conversation = conversations.find(conv => conv.productId === product.id);
      return conversation ? { ...product, conversation } : product;
    });
  }

  irACrear(): void {
    this.router.navigate(['/create']);
  }

  irALogin(): void {
    this.router.navigate(['/login']);
  }

  irAProfile(): void {
    this.isProfileMenuOpen = false;
    this.router.navigate(['/profile']);
  }

  irAMisChats(): void {
    this.isProfileMenuOpen = false;
    this.router.navigate(['/chats']);
  }

  irAFavoritos(): void {
    this.isProfileMenuOpen = false;
    this.router.navigate(['/favorites']);
  }

  irAContacta(): void {
    this.router.navigate(['/contact']);
  }

  logout(): void {
    this.authService.logout();
    this.isProfileMenuOpen = false;
    this.router.navigate(['/login']);
  }

  toggleProfileMenu(): void {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  goToProductDetail(productId: string): void {
    const product = this.products.find(p => p.id === productId);
    if (product) {
      this.addToRecentlyViewed(product);
    }
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
        this.trendingProducts = this.trendingProducts.map(p =>
          p.id === productId ? { ...p, conversation } : p
        );
        this.recentlyViewed = this.recentlyViewed.map(p =>
          p.id === productId ? { ...p, conversation } : p
        );
        this.similarProducts = this.similarProducts.map(p =>
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

  addToRecentlyViewed(product: Product): void {
    const index = this.recentlyViewed.findIndex(p => p.id === product.id);
    if (index === -1) {
      this.recentlyViewed.unshift(product);
      if (this.recentlyViewed.length > 5) {
        this.recentlyViewed.pop();
      }
      localStorage.setItem('recentlyViewed', JSON.stringify(this.recentlyViewed));
    }
  }

  loadRecentlyViewed(): void {
    const saved = localStorage.getItem('recentlyViewed');
    if (saved) {
      this.recentlyViewed = JSON.parse(saved);
      this.updateProductConversations();
      const token = localStorage.getItem('token');
      if (token) {
        this.loadFavorites(token);
      }
    }
  }

  loadSimilarProducts(): void {
    this.similarProducts = this.products.slice(0, 4);
    const token = localStorage.getItem('token');
    if (token) {
      this.loadFavorites(token);
    }
  }
}