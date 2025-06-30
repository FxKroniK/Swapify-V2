package com.example.demo.dtos;

import lombok.Data;

@Data
public class TransactionDto {
    private Long id;
    private Long buyerId;
    private Long sellerId;
    private String sellerEmail;
    private String productOfferedId;
    private String productRequestedId;
    private Integer creditsOffered;

    public boolean isSellerAccepted() {
        return sellerAccepted;
    }

    public void setSellerAccepted(boolean sellerAccepted) {
        this.sellerAccepted = sellerAccepted;
    }

    public boolean isBuyerAccepted() {
        return buyerAccepted;
    }

    public void setBuyerAccepted(boolean buyerAccepted) {
        this.buyerAccepted = buyerAccepted;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getCreditsRequested() {
        return creditsRequested;
    }

    public void setCreditsRequested(Integer creditsRequested) {
        this.creditsRequested = creditsRequested;
    }

    public Integer getCreditsOffered() {
        return creditsOffered;
    }

    public void setCreditsOffered(Integer creditsOffered) {
        this.creditsOffered = creditsOffered;
    }

    public String getProductRequestedId() {
        return productRequestedId;
    }

    public void setProductRequestedId(String productRequestedId) {
        this.productRequestedId = productRequestedId;
    }

    public String getProductOfferedId() {
        return productOfferedId;
    }

    public void setProductOfferedId(String productOfferedId) {
        this.productOfferedId = productOfferedId;
    }

    public Long getSellerId() {
        return sellerId;
    }

    public void setSellerId(Long sellerId) {
        this.sellerId = sellerId;
    }

    public String getSellerEmail() {
        return sellerEmail;
    }

    public void setSellerEmail(String sellerEmail) {
        this.sellerEmail = sellerEmail;
    }

    public Long getBuyerId() {
        return buyerId;
    }

    public void setBuyerId(Long buyerId) {
        this.buyerId = buyerId;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    private Integer creditsRequested;
    private String status;         // Mantén como String si así lo usas en tu backend
    private String createdAt;
    private String updatedAt;      // Nuevo campo
    private boolean buyerAccepted; // Nuevo campo
    private boolean sellerAccepted;// Nuevo campo

    // Getters y setters generados por Lombok (@Data)

    // Constructor actualizado
    public TransactionDto(Long id, Long buyerId, Long sellerId, String sellerEmail,
                          String productRequestedId, String productOfferedId,
                          Integer creditsOffered, Integer creditsRequested,
                          String status, String createdAt, String updatedAt,
                          boolean buyerAccepted, boolean sellerAccepted) {
        this.id = id;
        this.buyerId = buyerId;
        this.sellerId = sellerId;
        this.sellerEmail = sellerEmail;
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