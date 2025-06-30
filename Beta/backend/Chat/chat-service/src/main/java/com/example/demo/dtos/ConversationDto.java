package com.example.demo.dtos;

import java.util.List;

public class ConversationDto {
    private Long id;
    private String productId;
    private Long buyerId;   // Cambiado de UUID a Long
    private Long sellerId;  // Cambiado de UUID a Long

    public List<MessageDto> getMessages() {
        return messages;
    }

    public void setMessages(List<MessageDto> messages) {
        this.messages = messages;
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

    public String getProposalProductIds() {
        return proposalProductIds;
    }

    public void setProposalProductIds(String proposalProductIds) {
        this.proposalProductIds = proposalProductIds;
    }

    public Integer getProposalCreditsOffered() {
        return proposalCreditsOffered;
    }

    public void setProposalCreditsOffered(Integer proposalCreditsOffered) {
        this.proposalCreditsOffered = proposalCreditsOffered;
    }

    public Long getSellerId() {
        return sellerId;
    }

    public void setSellerId(Long sellerId) {
        this.sellerId = sellerId;
    }

    public Long getBuyerId() {
        return buyerId;
    }

    public void setBuyerId(Long buyerId) {
        this.buyerId = buyerId;
    }

    public String getProductId() {
        return productId;
    }

    public void setProductId(String productId) {
        this.productId = productId;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    private List<MessageDto> messages;
    private String status;
    private String proposalProductIds;
    private Integer proposalCreditsOffered;
    private String createdAt;

    public ConversationDto(Long id, String productId, Long buyerId, Long sellerId, List<MessageDto> messages,
                           String status, String proposalProductIds, Integer proposalCreditsOffered, String createdAt) {
        this.id = id;
        this.productId = productId;
        this.buyerId = buyerId;
        this.sellerId = sellerId;
        this.messages = messages;
        this.status = status;
        this.proposalProductIds = proposalProductIds;
        this.proposalCreditsOffered = proposalCreditsOffered;
        this.createdAt = createdAt;
    }
    // Getters y setters
}