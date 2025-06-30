package com.example.demo.entities;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "chats")
@Data
public class Conversation {
    @Id
    private Long id;

    @Indexed
    private String productId;

    @Indexed
    private Long buyerId;

    @Indexed
    private Long sellerId;

    @Indexed
    private ConversationStatus status;

    private String proposalProductIds;

    private Integer proposalCreditsOffered;

    private LocalDateTime createdAt;

    private List<Message> messages = new ArrayList<>();

    // Getters y Setters generados por Lombok @Data
    // Los métodos explícitos no son necesarios, pero los mantengo por claridad si prefieres conservarlos
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getProductId() {
        return productId;
    }

    public void setProductId(String productId) {
        this.productId = productId;
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

    public ConversationStatus getStatus() {
        return status;
    }

    public void setStatus(ConversationStatus status) {
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<Message> getMessages() {
        return messages;
    }

    public void setMessages(List<Message> messages) {
        this.messages = messages;
    }
}