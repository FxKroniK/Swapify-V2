package com.example.user_review.DTOs;

import lombok.Data;

@Data
public class TransactionDto {
    private Long id;
    private Long buyerId;
    private Long sellerId;
    private String productOfferedId;
    private String productRequestedId;
    private Integer creditsOffered;
    private Integer creditsRequested;
    private String status;
    private String createdAt;
    private String updatedAt; // Nuevo
    private boolean buyerAccepted;
    private boolean sellerAccepted;

    // Getters y setters
    public void setId(Long id) {
        this.id = id;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public void setUpdatedAt(String updatedAt) { // Nuevo
        this.updatedAt = updatedAt;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setCreditsOffered(Integer creditsOffered) {
        this.creditsOffered = creditsOffered;
    }

    public void setCreditsRequested(Integer creditsRequested) {
        this.creditsRequested = creditsRequested;
    }

    public void setProductRequestedId(String productRequestedId) {
        this.productRequestedId = productRequestedId;
    }

    public void setProductOfferedId(String productOfferedId) {
        this.productOfferedId = productOfferedId;
    }

    public void setSellerId(Long sellerId) {
        this.sellerId = sellerId;
    }

    public void setBuyerId(Long buyerId) {
        this.buyerId = buyerId;
    }

    public void setBuyerAccepted(boolean buyerAccepted) {
        this.buyerAccepted = buyerAccepted;
    }

    public void setSellerAccepted(boolean sellerAccepted) {
        this.sellerAccepted = sellerAccepted;
    }

    public Long getId() {
        return id;
    }

    public Long getBuyerId() {
        return buyerId;
    }

    public Long getSellerId() {
        return sellerId;
    }

    public String getProductOfferedId() {
        return productOfferedId;
    }

    public String getProductRequestedId() {
        return productRequestedId;
    }

    public Integer getCreditsOffered() {
        return creditsOffered;
    }

    public Integer getCreditsRequested() {
        return creditsRequested;
    }

    public String getStatus() {
        return status;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public String getUpdatedAt() { // Nuevo
        return updatedAt;
    }

    public boolean isBuyerAccepted() {
        return buyerAccepted;
    }

    public boolean isSellerAccepted() {
        return sellerAccepted;
    }

    // Constructor
    public TransactionDto(Long id, Long buyerId, Long sellerId,
                          String productRequestedId, String productOfferedId,
                          Integer creditsOffered, Integer creditsRequested,
                          String status, String createdAt, String updatedAt,
                          boolean buyerAccepted, boolean sellerAccepted) {
        this.id = id;
        this.buyerId = buyerId;
        this.sellerId = sellerId;
        this.productRequestedId = productRequestedId;
        this.productOfferedId = productOfferedId;
        this.creditsOffered = creditsOffered;
        this.creditsRequested = creditsRequested;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.buyerAccepted = buyerAccepted;
        this.sellerAccepted = sellerAccepted;
    }

    // Constructor por defecto
    public TransactionDto() {
    }
}