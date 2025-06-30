package com.example.user_review.DTOs;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class ProductDto {
    private String id;
    private Long ownerId;
    private String title;
    private String description;
    private String category;
    private String status;
    private List<String> imageUrl; // Cambiado de String a List<String>
    private List<String> imageId;  // Cambiado de String a List<String>
    private Map<String, String> attributes;
    private Double price;
    private LocalDateTime createdAt;
    private Double latitude;
    private Double longitude;
    private String ownerLocation;
    private String ownerUsername;
    private Double ownerRating;
    private Integer ownerReviewCount;

    // Getters y setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Long getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(Long ownerId) {
        this.ownerId = ownerId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<String> getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(List<String> imageUrl) {
        this.imageUrl = imageUrl;
    }

    public List<String> getImageId() {
        return imageId;
    }

    public void setImageId(List<String> imageId) {
        this.imageId = imageId;
    }

    public Map<String, String> getAttributes() {
        return attributes;
    }

    public void setAttributes(Map<String, String> attributes) {
        this.attributes = attributes;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public String getOwnerLocation() {
        return ownerLocation;
    }

    public void setOwnerLocation(String ownerLocation) {
        this.ownerLocation = ownerLocation;
    }

    public String getOwnerUsername() {
        return ownerUsername;
    }

    public void setOwnerUsername(String ownerUsername) {
        this.ownerUsername = ownerUsername;
    }

    public Double getOwnerRating() {
        return ownerRating;
    }

    public void setOwnerRating(Double ownerRating) {
        this.ownerRating = ownerRating;
    }

    public Integer getOwnerReviewCount() {
        return ownerReviewCount;
    }

    public void setOwnerReviewCount(Integer ownerReviewCount) {
        this.ownerReviewCount = ownerReviewCount;
    }
}