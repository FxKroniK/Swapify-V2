package com.example.user_review.controller;

import com.example.user_review.DTOs.ReviewDTO;
import com.example.user_review.DTOs.RevieweableProductDto;
import com.example.user_review.DTOs.TransactionDto;
import com.example.user_review.clients.TransactionClient;
import com.example.user_review.entities.Review;
import com.example.user_review.repository.ReviewRepository;
import com.example.user_review.serviceImpl.ReviewService;
import org.hibernate.Transaction;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    @Autowired
    private TransactionClient transactionClient;


    @PostMapping
    public ResponseEntity<?> createReview(@RequestBody ReviewDTO request) {
        Long reviewerId = request.getReviewerId();
        Long reviewedUserId = request.getReviewedUserId();
        String productId = request.getProductId();

        System.out.println("[ReviewController] reviewerId: " + reviewerId);
        System.out.println("[ReviewController] reviewedUserId: " + reviewedUserId);
        System.out.println("[ReviewController] productId de la review: " + productId);

        List<TransactionDto> transactions =
                transactionClient.checkCompletedTransaction(reviewerId, reviewedUserId);

        System.out.println("[ReviewController] Transacciones encontradas: " + transactions.size());

        for (TransactionDto t : transactions) {
            System.out.println("[ReviewController] Transacción ID: " + t.getId() +
                    ", offered: " + t.getProductOfferedId() +
                    ", requested: " + t.getProductRequestedId());
        }

        boolean productEnTransaccion = transactions.stream().anyMatch(t ->
                productId.equals(t.getProductOfferedId()) || productId.equals(t.getProductRequestedId())
        );

        if (!productEnTransaccion) {
            System.out.println("[ReviewController] Producto no encontrado en transacciones completadas.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("No puedes dejar una review de un producto no involucrado en una transacción completada.");
        }

        if (reviewService.alreadyReviewed(reviewerId, reviewedUserId, request.getProductId())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Ya has dejado una review para este producto.");
        }

        Review review = reviewService.createReviewFromDTO(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(review);
    }

    @GetMapping("/available-products")
    public ResponseEntity<List<RevieweableProductDto>> getProductsAvailableForReview(@RequestParam Long userId) {
        return ResponseEntity.ok(reviewService.getReviewableProducts(userId));
    }



    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Review>> getReviews(@PathVariable Long userId) {
        return ResponseEntity.ok(reviewService.getReviewsForUser(userId));
    }

    @GetMapping("/user/{userId}/rating")
    public ResponseEntity<Double> getAverageRating(@PathVariable Long userId) {
        return ResponseEntity.ok(reviewService.getAverageRatingForUser(userId));
    }

    @GetMapping("/user/{userId}/counts")
    public ResponseEntity<Map<String, Long>> getPositiveNegativeCounts(@PathVariable Long userId) {
        long positives = reviewService.getPositiveReviewCount(userId);
        long negatives = reviewService.getNegativeReviewCount(userId);

        Map<String, Long> response = new HashMap<>();
        response.put("positives", positives);
        response.put("negatives", negatives);
        return ResponseEntity.ok(response);
    }
}
