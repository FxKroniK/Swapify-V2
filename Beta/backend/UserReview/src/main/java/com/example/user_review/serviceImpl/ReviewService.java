package com.example.user_review.serviceImpl;

import com.example.user_review.DTOs.ProductDto;
import com.example.user_review.DTOs.ReviewDTO;
import com.example.user_review.DTOs.RevieweableProductDto;
import com.example.user_review.DTOs.TransactionDto;
import com.example.user_review.clients.ProductClient;
import com.example.user_review.clients.TransactionClient;
import com.example.user_review.entities.Review;
import com.example.user_review.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private TransactionClient transactionClient;

    @Autowired
    private ProductClient productClient;

    public Review createReview(Review review) {
        // Puedes añadir validaciones para no permitir múltiples reviews del mismo user a otro
        return reviewRepository.save(review);
    }

    public Review createReviewFromDTO(ReviewDTO request) {
        Review review = new Review();
        review.setReviewerId(request.getReviewerId());
        review.setReviewedUserId(request.getReviewedUserId());
        review.setRating(request.getRating());
        review.setComment(request.getComment());
        review.setCreatedAt(LocalDateTime.now()); // Asignas la fecha actual
        review.setProductId(request.getProductId());

        return reviewRepository.save(review);
    }


    public List<Review> getReviewsForUser(Long reviewedUserId) {
        return reviewRepository.findByReviewedUserId(reviewedUserId);
    }

    public Double getAverageRatingForUser(Long userId) {
        List<Review> reviews = reviewRepository.findByReviewedUserId(userId);

        if (reviews.isEmpty()) {
            return 0.0; // O podrías devolver null si prefieres no mostrar promedio
        }

        double average = reviews.stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0.0);

        return average;
    }

    public long getPositiveReviewCount(Long reviewedUserId) {
        return reviewRepository.countByReviewedUserIdAndRatingGreaterThanEqual(reviewedUserId, 4);
    }

    public long getNegativeReviewCount(Long reviewedUserId) {
        return reviewRepository.countByReviewedUserIdAndRatingLessThanEqual(reviewedUserId, 2);
    }

    public boolean alreadyReviewed(Long reviewerId, Long reviewedUserId, String productId) {
        return reviewRepository.existsByReviewerIdAndReviewedUserIdAndProductId(reviewerId, reviewedUserId, productId);
    }

    public List<RevieweableProductDto> getReviewableProducts(Long userId) {
        List<TransactionDto> allCompletedTransactions = transactionClient.getCompletedTransactionsByUser(userId);

        List<RevieweableProductDto> reviewableProducts = new ArrayList<>();

        for (TransactionDto transaction : allCompletedTransactions) {
            String productId;
            Long reviewedUserId;

            // Si el usuario fue el comprador, recibió el producto ofrecido por el otro
            if (transaction.getBuyerId().equals(userId)) {
                productId = transaction.getProductOfferedId();
                reviewedUserId = transaction.getSellerId();
            }
            // Si fue el vendedor, recibió el producto solicitado por el otro
            else if (transaction.getSellerId().equals(userId)) {
                productId = transaction.getProductRequestedId();
                reviewedUserId = transaction.getBuyerId();
            } else {
                continue; // no es parte de la transacción
            }

            // --- AÑADE ESTA COMPROBACIÓN ---
            if (alreadyReviewed(userId, reviewedUserId, productId)) {
                continue; // Ya reseñado, no lo añadas
            }

            ProductDto product = productClient.getProductById(productId);

            if (product != null) {
                RevieweableProductDto dto = new RevieweableProductDto();
                dto.setProductId(product.getId());
                dto.setTitle(product.getTitle());
                dto.setDescription(product.getDescription());
                dto.setImageUrl(product.getImageUrl().isEmpty() ? null : product.getImageUrl().get(0));
                dto.setReviewerId(userId);
                dto.setReviewedUserId(reviewedUserId);

                reviewableProducts.add(dto);
            }
        }

        return reviewableProducts;
    }


}