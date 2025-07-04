package com.example.user_review.DTOs;

public class ReviewDTO {
    private Long reviewerId;       // El usuario que deja la review
    private Long reviewedUserId;   // El usuario al que se deja la review
    private int rating;            // Puntuación de 1 a 5
    private String comment;        // Comentario opcional
    private String productId;

    // Getters y Setters

    public Long getReviewerId() {
        return reviewerId;
    }

    public void setReviewerId(Long reviewerId) {
        this.reviewerId = reviewerId;
    }

    public Long getReviewedUserId() {
        return reviewedUserId;
    }

    public void setReviewedUserId(Long reviewedUserId) {
        this.reviewedUserId = reviewedUserId;
    }

    public int getRating() {
        return rating;
    }

    public void setRating(int rating) {
        this.rating = rating;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public String getProductId() {
        return productId;
    }

    public void setProductId(String productId) {
        this.productId = productId;
    }
}
