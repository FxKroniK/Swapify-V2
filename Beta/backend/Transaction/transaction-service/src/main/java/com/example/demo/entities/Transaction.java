package com.example.demo.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long sellerId;
    private Long buyerId;
    private String productOfferedId;
    private String productRequestedId;
    private Integer creditsOffered;
    private Integer creditsRequested;

    @Enumerated(EnumType.STRING)
    private Status status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean buyerAccepted;
    private boolean sellerAccepted;
    private boolean isProcessing;
    private Long conversationId; // Campo añadido

    // Getters y setters generados por Lombok
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public boolean isProcessing() {
        return isProcessing;
    }

    public void setProcessing(boolean processing) {
        isProcessing = processing;
    }

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

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
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

    public Long getBuyerId() {
        return buyerId;
    }

    public void setBuyerId(Long buyerId) {
        this.buyerId = buyerId;
    }

    public Long getSellerId() {
        return sellerId;
    }

    public void setSellerId(Long sellerId) {
        this.sellerId = sellerId;
    }

    // Nuevo getter y setter para conversationId
    public Long getConversationId() {
        return conversationId;
    }

    public void setConversationId(Long conversationId) {
        this.conversationId = conversationId;
    }


}