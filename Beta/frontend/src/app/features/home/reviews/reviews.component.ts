// src/app/components/reviews/reviews.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewService } from '../../../services/review-service/review.service';
import { Review, ReviewDTO, RevieweableProductDto } from '../../../models/review.model';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.css'],
  providers: [ReviewService]
})
export class ReviewsComponent implements OnInit {
  @Input() userId: number = 0;
  reviews: Review[] = [];
  averageRating: number = 0;
  positiveCount: number = 0;
  negativeCount: number = 0;
  isLoading: boolean = false;
  errorMessage: string | null = null;

  constructor(private reviewService: ReviewService) { }

  ngOnInit() {
    this.loadReviews();
    this.loadAverageRating();
    this.loadCounts();
  }

  loadReviews() {
    const token = localStorage.getItem('token');
    if (!token) return;

    this.isLoading = true;
    this.reviewService.getReviewsForUser(this.userId.toString(), token).subscribe({
      next: (reviews) => {
        this.reviews = reviews;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.isLoading = false;
      }
    });
  }

  loadAverageRating() {
    const token = localStorage.getItem('token');
    if (!token) return;

    this.reviewService.getAverageRating(this.userId.toString(), token).subscribe({
      next: (rating) => {
        this.averageRating = rating;
      },
      error: (error) => {
        this.errorMessage = error.message;
      }
    });
  }

  loadCounts() {
    const token = localStorage.getItem('token');
    if (!token) return;

    this.reviewService.getPositiveNegativeCounts(this.userId.toString(), token).subscribe({
      next: (counts) => {
        this.positiveCount = counts.positives;
        this.negativeCount = counts.negatives;
      },
      error: (error) => {
        this.errorMessage = error.message;
      }
    });
  }

  getStars(rating: number): string[] {
    const stars: string[] = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= rating ? 'fas fa-star' : 'far fa-star');
    }
    return stars;
  }
}