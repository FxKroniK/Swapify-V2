import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth-service/auth.service';
import { ProductService } from '../../../services/product-service/product.service';
import { FormsModule } from '@angular/forms';
import { NegotiationService } from '../../../services/negotiation-service/negotiation.service';
import { UserService } from '../../../services/user-service/user.service';
import { Product } from '../../../models/product.model';
import { UserDto, UserProfile } from '../../../models/user.model';



declare var google: any;

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  user: UserDto | null = null;
  userProfile: UserProfile | null = null;
  products: Product[] = [];
  searchKeyword: string = '';
  selectedCategory: string = '';
  isLocationModalOpen: boolean = false;
  tempSelectedLatLng: { lat: number; lng: number } | null = null;
  radius: number = 10;
  search: boolean = false;
  searchCategory: boolean = false;
  isProfileMenuOpen: boolean = false;
  map: any;
  isLoading: boolean = false;
  favoriteCount: number = 0; // Nuevo: conteo de favoritos

  constructor(
    private router: Router,
    private productService: ProductService,
    private authService: AuthService,
    private negotiationService: NegotiationService,
    private userService: UserService
    
  ) {}

  ngOnInit(): void {
    this.authService.user$.subscribe(user => {
      this.user = user;
      if (user) {
        this.loadFavoriteCount();
        // Cargar el perfil del usuario para obtener la foto de perfil actualizada
        const token = localStorage.getItem('token');
        if (token) {
          this.userService.getUserProfile(token).subscribe({
            next: (profile) => {
              if (this.user) {
                this.user = { ...this.user, profilePictureUrl: profile.profilePictureUrl };
              }
            },
            error: (err) => {
              console.error('Error al cargar el perfil del usuario en navbar:', err);
            }
          });
        }
      } else {
        this.favoriteCount = 0;
      }
    });

    const token = localStorage.getItem('token');
    if (token) {
      this.userService.getUserProfile(token).subscribe({
        next: (userProfile) => {
          this.userProfile = userProfile;
        },
        error: (err) => {
          console.error('Error al obtener el perfil del usuario:', err);
        }
      });
    }
  }

  loadFavoriteCount(): void {
    const token = localStorage.getItem('token');
    if (token) {
      this.productService.getUserFavorites(token).subscribe({
        next: (favorites) => {
          this.favoriteCount = favorites.length;
        },
        error: (err) => {
          console.error('Error al cargar el conteo de favoritos:', err);
          this.favoriteCount = 0;
        }
      });
    }
  }

  fetchConversations() {
    const token = localStorage.getItem('token');
    if (token && this.user?.id) {
      this.negotiationService.getUserConversations().subscribe({
        next: (conversations) => {
          this.products = this.products.map(product => ({
            ...product,
            conversation: conversations.find(conv => conv.productId === product.id.toString() && conv.status === 'ACTIVE')
          }));
        },
        error: (error) => {
          console.error('Error al obtener conversaciones:', error);
        }
      });
    }
  }

  initializeMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) {
      console.error('No se encontró el elemento del mapa (#map)');
      return;
    }
    if (!google || !google.maps) {
      console.error('La API de Google Maps no está cargada');
      return;
    }

    let initialLatLng = { lat: 40.4168, lng: -3.7038 }; // Madrid por defecto
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          initialLatLng = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          this.renderMap(mapElement, initialLatLng);
        },
        error => {
          console.error('Error al obtener la ubicación:', error);
          this.renderMap(mapElement, initialLatLng);
        }
      );
    } else {
      this.renderMap(mapElement, initialLatLng);
    }
  }

  renderMap(mapElement: HTMLElement, center: { lat: number; lng: number }) {
    this.map = new google.maps.Map(mapElement, {
      center: new google.maps.LatLng(center.lat, center.lng),
      zoom: 12,
    });
    this.addAutocomplete();
    this.addMarker(center);
    this.addClickListener();
    this.drawCircle();
  }

  addAutocomplete() {
    const input = document.getElementById('locationInput') as HTMLInputElement;
    if (!input) {
      console.error('No se encontró el input de ubicación (#locationInput)');
      return;
    }
    const autocomplete = new google.maps.places.Autocomplete(input, {
      types: ['geocode'],
    });
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const latLng = place.geometry.location;
        this.map.setCenter(latLng);
        this.addMarker(latLng);
      }
    });
  }

  addMarker(latLng: any) {
    if (!this.map || !latLng) {
      console.error('Mapa o latLng no definidos:', { map: this.map, latLng });
      return;
    }

    let lat: number;
    let lng: number;

    if (latLng instanceof google.maps.LatLng) {
      lat = latLng.lat();
      lng = latLng.lng();
    } else if (typeof latLng.lat === 'number' && typeof latLng.lng === 'number') {
      lat = latLng.lat;
      lng = latLng.lng;
    } else if (typeof latLng.lat === 'function' && typeof latLng.lng === 'function') {
      lat = latLng.lat();
      lng = latLng.lng();
    } else {
      console.error('Formato de latLng no soportado:', latLng);
      return;
    }

    new google.maps.Marker({
      position: new google.maps.LatLng(lat, lng),
      map: this.map,
    });

    this.tempSelectedLatLng = { lat, lng };
    this.drawCircle();
  }

  drawCircle() {
    if (this.map && this.tempSelectedLatLng) {
      if (this.map.circle) {
        this.map.circle.setMap(null);
      }
      this.map.circle = new google.maps.Circle({
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#FF0000',
        fillOpacity: 0.35,
        map: this.map,
        center: new google.maps.LatLng(this.tempSelectedLatLng.lat, this.tempSelectedLatLng.lng),
        radius: this.radius * 1000,
      });
      this.map.fitBounds(this.map.circle.getBounds());
    }
  }

  addClickListener() {
    if (this.map) {
      this.map.addListener('click', (event: google.maps.MapMouseEvent) => {
        const latLng = event.latLng;
        this.addMarker(latLng);
        this.buscarProductos();
      });
    }
  }

  centerMapOnLocation() {
    if (this.tempSelectedLatLng) {
      this.map.setCenter(new google.maps.LatLng(this.tempSelectedLatLng.lat, this.tempSelectedLatLng.lng));
      this.drawCircle();
    }
  }

  updateRadius() {
    this.drawCircle();
  }

  openLocationModal() {
    this.isLocationModalOpen = true;
    setTimeout(() => {
      if (!google || !google.maps) {
        console.error('La API de Google Maps no está disponible. Asegúrate de que el script esté cargado.');
        alert('No se pudo cargar el mapa. Por favor, intenta de nuevo más tarde.');
        return;
      }
      this.initializeMap();
    }, 0);
  }

  closeLocationModal() {
    this.isLocationModalOpen = false;
  }

  applyFilterAndSearch() {
    if (this.tempSelectedLatLng) {
      this.buscarProductos();
    }
    this.closeLocationModal();
  }
  

  buscarProductos() {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No hay token disponible.');
      alert('Por favor, inicia sesión para buscar productos.');
      return;
    }

    this.isLoading = true;
    if (this.tempSelectedLatLng) {
      this.productService.searchProductsByCoordinates(
        this.tempSelectedLatLng.lat,
        this.tempSelectedLatLng.lng,
        this.radius,
        this.selectedCategory,
        this.searchKeyword
      ).subscribe({
        next: (response: Product[]) => {
          this.products = response;
          this.search = !!this.searchKeyword || !!this.tempSelectedLatLng;
          this.searchCategory = !!this.selectedCategory && !this.searchKeyword && !this.tempSelectedLatLng;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al buscar productos:', error);
          this.products = [];
          this.isLoading = false;
          alert('Hubo un error al buscar productos. Por favor, intenta de nuevo más tarde.');
        }
      });
    } else {
      const effectiveKeyword = this.searchKeyword.trim() || undefined;
      if (this.selectedCategory || effectiveKeyword) {
        this.productService.getAllProducts(token).subscribe({
          next: (response: Product[]) => {
            this.products = response.filter(product => {
              const matchesCategory = !this.selectedCategory || product.category === this.selectedCategory;
              const matchesKeyword = !effectiveKeyword || (product.title?.toLowerCase().includes(effectiveKeyword.toLowerCase()) || false);
              return matchesCategory && matchesKeyword;
            });
            this.search = !!effectiveKeyword;
            this.searchCategory = !!this.selectedCategory && !effectiveKeyword;
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error al recuperar productos:', error);
            this.products = [];
            this.isLoading = false;
            alert('No se pudieron cargar los productos. Inténtalo de nuevo.');
          }
        });
      } else {
        this.productService.getAllProducts(token).subscribe({
          next: (response: Product[]) => {
            this.products = response;
            this.search = false;
            this.searchCategory = false;
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error al recuperar productos:', error);
            this.products = [];
            this.isLoading = false;
            alert('No se pudieron cargar los productos. Por favor, inicia sesión o intenta de nuevo.');
          }
        });
      }
    }
  }

 filtrarPorCategoria(category: string) {
    this.router.navigate(['/main'], { queryParams: { category } });

}

  irAMain() {
    this.router.navigate(['/main']);
  }

  irACrear() {
    this.router.navigate(['/create']);
  }

  irALogin() {
    this.router.navigate(['/login']);
  }

  irAProfile() {
    this.isProfileMenuOpen = false;
    this.router.navigate(['/profile']);
  }

  irAMisChats() {
    this.isProfileMenuOpen = false;
    this.router.navigate(['/chat']);
  }

  irAFavoritos() {
    this.isProfileMenuOpen = false;
    this.router.navigate(['/favorites']);
  }

  irAContacta() {
    this.isProfileMenuOpen = false;
    this.router.navigate(['/contact']);
  }

  toggleProfileMenu() {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  logout() {
    this.isProfileMenuOpen = false;
    this.authService.logout();
    this.router.navigate(['/main']);
  }
}