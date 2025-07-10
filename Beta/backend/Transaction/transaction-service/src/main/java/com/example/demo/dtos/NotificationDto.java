package com.example.demo.dtos;

import java.time.LocalDateTime;

public class NotificationDto {
    private String type;
    private String message;
    private Long transactionId;
    private Long conversationId;
    private LocalDateTime timestamp;

    // Constructores
    public NotificationDto() {
        this.timestamp = LocalDateTime.now();
    }

    public NotificationDto(String type, String message, Long transactionId, Long conversationId) {
        this.type = type;
        this.message = message;
        this.transactionId = transactionId;
        this.conversationId = conversationId;
        this.timestamp = LocalDateTime.now();
    }

    // Getters y setters
    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Long getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(Long transactionId) {
        this.transactionId = transactionId;
    }

    public Long getConversationId() {
        return conversationId;
    }

    public void setConversationId(Long conversationId) {
        this.conversationId = conversationId;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    @Override
    public String toString() {
        return "NotificationDto{" +
                "type='" + type + '\'' +
                ", message='" + message + '\'' +
                ", transactionId=" + transactionId +
                ", conversationId=" + conversationId +
                ", timestamp=" + timestamp +
                '}';
    }
}
