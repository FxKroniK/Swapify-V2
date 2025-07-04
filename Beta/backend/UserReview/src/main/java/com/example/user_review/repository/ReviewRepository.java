package com.example.user_review.repository;

import com.example.user_review.entities.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByReviewedUserId(Long reviewedUserId);
    long countByReviewedUserIdAndRatingGreaterThanEqual(Long reviewedUserId, int rating);
    long countByReviewedUserIdAndRatingLessThanEqual(Long reviewedUserId, int rating);
    boolean existsByReviewerIdAndReviewedUserIdAndProductId(Long reviewerId, Long reviewedUserId, String productId);
    boolean existsByReviewerIdAndProductId(Long reviewerId, String productId);


}
