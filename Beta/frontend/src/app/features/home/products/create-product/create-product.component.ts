import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService } from '../../../../services/product-service/product.service';
import { CreateProductDto } from '../../../../models/product.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TransactionService } from '../../../../services/transaction-service/transaction.service';
import { CloudinaryService } from '../../../../services/cloudinary-service/cloudinary.service';
import { AuthService } from '../../../../services/auth-service/auth.service';

@Component({
  selector: 'app-create-product',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './create-product.component.html',
  styleUrls: ['./create-product.component.css']
})
export class CreateProductComponent implements OnInit, OnDestroy {
  productData: CreateProductDto = {
    title: '',
    category: '',
    description: '',
    price: 0,
    imageUrl: [],
    imageId: [],
    attributes: {}
  };
  imageFiles: File[] = [];
  imagePreviews: string[] = [];
  isUploading: boolean = false;
  token: string | null = localStorage.getItem('token');
  maxImages: number = 5;
  newAttributeKey: string = '';
  newAttributeValue: string = '';
  attributeError: string = '';

  constructor(
    private productService: ProductService,
    private transactionService: TransactionService,
    private cloudinaryService: CloudinaryService,
    private authService: AuthService,
    public router: Router
  ) {}

  objectKeys(obj: { [key: string]: string }): string[] {
    return Object.keys(obj);
  }

  ngOnInit(): void {
    if (!this.token) {
      console.error('No se encontró el token del usuario');
      alert('Por favor, inicia sesión para crear un producto.');
      this.router.navigate(['/login']);
      return;
    }
  }

  onFilesSelected(event: any): void {
    const files: FileList = event.target.files;
    if (files.length > 0) {
      const newFiles = Array.from(files);
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

    if (this.productData.attributes[this.newAttributeKey]) {
      this.attributeError = 'Ya existe un atributo con esa clave.';
      return;
    }

    this.productData.attributes = {
      ...this.productData.attributes,
      [this.newAttributeKey]: this.newAttributeValue
    };
    this.newAttributeKey = '';
    this.newAttributeValue = '';
    this.attributeError = '';
    console.log('Atributo añadido:', this.productData.attributes);
  }

  removeAttribute(key: string): void {
    const { [key]: _, ...rest } = this.productData.attributes;
    this.productData.attributes = rest;
    console.log('Atributo eliminado:', key, 'Atributos restantes:', this.productData.attributes);
  }

  createProduct(): void {
    if (!this.productData.title || !this.productData.category || !this.productData.description || this.productData.price <= 0) {
      alert('Por favor, completa todos los campos obligatorios.');
      return;
    }

    if (this.imageFiles.length === 0) {
      alert('Debes seleccionar al menos una imagen.');
      return;
    }

    this.isUploading = true;
    const uploadPromises = this.imageFiles.map(file =>
      this.cloudinaryService.uploadImage(file, this.token!).toPromise()
    );

    Promise.all(uploadPromises)
      .then(uploadResponses => {
        this.productData.imageUrl = uploadResponses.map(response => response.imageUrl);
        this.productData.imageId = uploadResponses.map(response => response.publicId);

        this.productService.createProduct(this.productData, this.token!).subscribe({
          next: (response) => {
            console.log('Producto creado exitosamente:', response);
            alert('Producto creado exitosamente.');
            this.router.navigate(['/profile']);
          },
          error: (error) => {
            console.error('Error al crear el producto:', error);
            alert('Error al crear el producto. Por favor, intenta de nuevo.');
          },
          complete: () => {
            this.isUploading = false;
          }
        });
      })
      .catch(error => {
        console.error('Error al subir las imágenes:', error);
        this.isUploading = false;
        if (error.status === 403) {
          alert('Error 403: No tienes permiso para subir imágenes. Verifica tu autenticación.');
        } else {
          alert('Error al subir las imágenes. Por favor, intenta de nuevo.');
        }
      });
  }

  get imagesRemaining(): number {
    return this.maxImages - this.imageFiles.length;
  }

  ngOnDestroy(): void {
    this.imagePreviews.forEach(url => URL.revokeObjectURL(url));
  }
}