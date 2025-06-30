package com.example.demo.entities;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class Message {
    private Long id;

    private Long senderId;

    private String productId;

    private String content;

    public Integer getCreditsOffered() {
        return creditsOffered;
    }

    public void setCreditsOffered(Integer creditsOffered) {
        this.creditsOffered = creditsOffered;
    }

    private Integer creditsOffered;
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public MessageType getType() {
        return type;
    }

    public void setType(MessageType type) {
        this.type = type;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getProductId() {
        return productId;
    }

    public void setProductId(String productId) {
        this.productId = productId;
    }

    public Long getSenderId() {
        return senderId;
    }

    public void setSenderId(Long senderId) {
        this.senderId = senderId;
    }

    private LocalDateTime timestamp;

    private MessageType type;
}