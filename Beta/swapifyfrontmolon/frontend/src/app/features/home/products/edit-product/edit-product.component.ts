import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../../services/product-service/product.service';
import { Product } from '../../../../models/product.model';
import { CloudinaryService } from '../../../../services/cloudinary-service/cloudinary.service';

@Component({
  selector: 'app-edit-product',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-product.component.html',
  styleUrls: ['./edit-product.component.css']
})
export class EditProductComponent implements OnInit, OnDestroy {
  product: Product = {
    id: '',
    title: '',
    price: 0,
    description: '',
    imageUrl: [],
    ownerId: 0,
    category: '',
    imageId: [],
    attributes: {}
  };
  productId: string | null = null;
  imageFiles: File[] = [];
  imagePreviews: string[] = [];
  token: string | null = localStorage.getItem('token');
  maxImages: number = 5;
  newAttributeKey: string = '';
  newAttributeValue: string = '';
  attributeError: string = '';

  constructor(
    private productService: ProductService,
    private cloudinaryService: CloudinaryService,
    private route: ActivatedRoute,
    public router: Router
  ) {}

  objectKeys(obj: { [key: string]: string }): string[] {
    return Object.keys(obj);
  }

  ngOnInit(): void {
    if (!this.token) {
      console.error('No se encontró el token del usuario');
      alert('Por favor, inicia sesión para editar un producto.');
      this.router.navigate(['/login']);
      return;
    }

    this.productId = this.route.snapshot.paramMap.get('id');
    if (this.productId) {
      this.productService.getProductById(this.productId, this.token).subscribe({
        next: (data) => {
          this.product = { ...data, attributes: data.attributes || {} };
          this.imagePreviews = [...(data.imageUrl || [])];
        },
        error: (error) => {
          console.error('Error al cargar el producto:', error);
          alert('Error al cargar el producto. Por favor, intenta de nuevo.');
          this.router.navigate(['/home']);
        }
      });
    } else {
      console.error('No se encontró el ID del producto en la URL');
      alert('No se encontró el producto.');
      this.router.navigate(['/home']);
    }
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const newFiles = Array.from(input.files);
      const totalImages = this.imageFiles.length + newFiles.length;

      if (totalImages > this.maxImages) {
        alert(`Solo puedes subir hasta ${this.maxImages} imágenes. Selecciona menos imágenes.`);
        return;
      }

      this.imageFiles = [...this.imageFiles, ...newFiles].slice(0, this.maxImages);
      this.imagePreviews = this.imageFiles.map(file => URL.createObjectURL(file));
      console.log('Archivos seleccionados:', this.imageFiles);
    }
  }

  removeImage(index: number): void {
    this.imageFiles.splice(index, 1);
    this.imagePreviews.splice(index, 1);
    console.log('Imagen eliminada. Archivos restantes:', this.imageFiles);
  }

  addAttribute(): void {
    if (!this.newAttributeKey.trim() || !this.newAttributeValue.trim()) {
      this.attributeError = 'La clave y el valor del atributo son obligatorios.';
      return;
    }

    if (this.product.attributes![this.newAttributeKey]) {
      this.attributeError = 'Ya existe un atributo con esa clave.';
      return;
    }

    this.product.attributes = {
      ...this.product.attributes,
      [this.newAttributeKey]: this.newAttributeValue
    };
    this.newAttributeKey = '';
    this.newAttributeValue = '';
    this.attributeError = '';
    console.log('Atributo añadido:', this.product.attributes);
  }

  removeAttribute(key: string): void {
    const { [key]: _, ...rest } = this.product.attributes!;
    this.product.attributes = rest;
    console.log('Atributo eliminado:', key, 'Atributos restantes:', this.product.attributes);
  }

  editProduct(): void {
    if (!this.product.title || !this.product.category || !this.product.description || this.product.price <= 0) {
      alert('Por favor, completa todos los campos obligatorios.');
      return;
    }

    if (Object.keys(this.product.attributes!).length === 0) {
      alert('Debes añadir al menos un atributo (por ejemplo, "Condición: Usado").');
      return;
    }

    const productData: Partial<Product> = {
      title: this.product.title,
      category: this.product.category,
      description: this.product.description,
      price: this.product.price,
      attributes: this.product.attributes
    };

    if (this.imageFiles.length > 0) {
      const uploadPromises = this.imageFiles.map(file =>
        this.cloudinaryService.uploadImage(file, this.token!).toPromise()
      );

      Promise.all(uploadPromises)
        .then(uploadResponses => {
          productData.imageUrl = uploadResponses.map(response => response.imageUrl);
          productData.imageId = uploadResponses.map(response => response.publicId);
          this.updateProduct(productData);
        })
        .catch(error => {
          console.error('Error al subir las imágenes:', error);
          alert('Error al subir las imágenes. Por favor, intenta de nuevo.');
        });
    } else {
      productData.imageUrl = this.product.imageUrl;
      productData.imageId = this.product.imageId;
      this.updateProduct(productData);
    }
  }

  private updateProduct(productData: Partial<Product>): void {
    if (this.productId) {
      this.productService.updateProduct(this.productId, productData, this.token!).subscribe({
        next: (response) => {
          console.log('Producto actualizado exitosamente:', response);
          alert('Producto actualizado exitosamente.');
          this.router.navigate(['/profile']);
        },
        error: (error) => {
          console.error('Error al actualizar el producto:', error);
          alert('Error al actualizar el producto. Por favor, intenta de nuevo.');
        }
      });
    } else {
      console.error('No se encontró el ID del producto en el componente');
      alert('No se encontró el producto.');
    }
  }

  get imagesRemaining(): number {
    return this.maxImages - this.imageFiles.length;
  }

  ngOnDestroy(): void {
    this.imagePreviews.forEach(url => URL.revokeObjectURL(url));
  }
}