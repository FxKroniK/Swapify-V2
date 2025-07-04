import { Component, OnInit, OnChanges, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReviewService } from '../../../services/review-service/review.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-review',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-review.component.html',
  styleUrl: './create-review.component.css'
})
export class CreateReviewComponent implements OnInit, OnChanges {
  id: number = 0;
  reviewerId: number = 0;
  reviewedUserId: number = 0;
  productId: string = '';

  rating: number = 0;
  comment: string = '';
  @Output() reviewSubmitted = new EventEmitter<any>();
  @Output() reviewCancelled = new EventEmitter<void>();

  @Input() inputReviewedUserId?: number;
  @Input() inputProductId?: string;

  constructor(private router: Router, private reviewService: ReviewService) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (token) {
      const userId = this.getCurrentUserIdFromToken(token);
      if (userId) {
        this.reviewerId = userId;
      } else {
        console.error('No se pudo extraer userId del token');
        this.router.navigate(['/login']);
      }
    } else {
      console.error('No hay token en localStorage');
      this.router.navigate(['/login']);
    }
    this.updateInputs();
    console.log('ngOnInit -> reviewerId:', this.reviewerId, 'reviewedUserId:', this.reviewedUserId, 'productId:', this.productId, 'rating:', this.rating);
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.updateInputs();
    console.log('ngOnChanges -> reviewerId:', this.reviewerId, 'reviewedUserId:', this.reviewedUserId, 'productId:', this.productId, 'rating:', this.rating);
  }

  private updateInputs(): void {
    if (this.inputReviewedUserId !== undefined && this.inputReviewedUserId !== null && this.inputReviewedUserId > 0) {
      this.reviewedUserId = this.inputReviewedUserId;
    } else {
      console.error('inputReviewedUserId no recibido o inválido. No se puede proceder sin un reviewedUserId válido.');
      this.reviewedUserId = 0; // No forzamos un valor temporal, dejamos como inválido
    }
    if (this.inputProductId !== undefined && this.inputProductId !== null && this.inputProductId.trim() !== '') {
      this.productId = this.inputProductId;
    } else {
      console.error('inputProductId no recibido o inválido. No se puede proceder sin un productId válido.');
      this.productId = ''; // No forzamos un valor temporal, dejamos como inválido
    }
  }

  getCurrentUserIdFromToken(token: string): number | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId || payload.id || null;
    } catch {
      return null;
    }
  }

  setRating(value: number): void {
    this.rating = value;
    console.log('Rating actualizado:', this.rating);
  }

  isValid(): boolean {
    const valid = this.rating > 0 && this.reviewerId > 0 && this.reviewedUserId > 0 && !!this.productId && this.comment.trim().length > 0;
    console.log('isValid ->', { rating: this.rating, reviewerId: this.reviewerId, reviewedUserId: this.reviewedUserId, productId: this.productId, comment: this.comment, valid });
    return valid;
  }

  submitReview(): void {
    if (!this.isValid()) {
      console.error('Faltan datos para enviar la reseña:', { rating: this.rating, reviewerId: this.reviewerId, reviewedUserId: this.reviewedUserId, productId: this.productId, comment: this.comment });
      alert('Por favor, completa todos los campos requeridos (rating, comentario) y asegúrate de que los IDs sean válidos.');
      return;
    }

    const review = {
      id: this.id,
      reviewerId: this.reviewerId,
      reviewedUserId: this.reviewedUserId,
      productId: this.productId,
      rating: this.rating,
      comment: this.comment,
      createdAt: new Date().toISOString()
    };

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No hay token de autenticación');
      this.router.navigate(['/login']);
      return;
    }

    console.log('Enviando review:', review);

    this.reviewService.createReview(review, token).subscribe({
      next: (response) => {
        console.log('Reseña creada con éxito:', response);
        this.reviewSubmitted.emit(response); // Notifica al padre que la reseña se envió
        this.cancelReview(); // Cierra el formulario
      },
      error: (error) => {
        console.error('Error al crear la reseña:', error);
        if (error.status === 403) {
          alert('No puedes reseñar este producto porque no está asociado a una transacción completada.');
        } else {
          alert('Error al enviar la reseña. Intenta de nuevo.');
        }
      }
    });
  }

  cancelReview(): void {
    this.rating = 0;
    this.comment = '';
    this.reviewCancelled.emit(); // Notifica al padre para cerrar el modal
  }
}