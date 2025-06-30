package com.example.demo.dtos;

public class MessageDto {
    private Long id;
    private Long conversationId;
    private Long senderId;
    private String content;
    private String timestamp;
    private String type;
    private String productId;
    private Integer creditsOffered;

    public MessageDto() {}

    public MessageDto(Long id, Long conversationId, Long senderId, String content, String timestamp, String type, String productId, Integer creditsOffered) {
        this.id = id;
        this.conversationId = conversationId;
        this.senderId = senderId;
        this.content = content;
        this.timestamp = timestamp;
        this.type = type;
        this.productId = productId;
        this.creditsOffered = creditsOffered;
    }

    // Getters y setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getConversationId() { return conversationId; }
    public void setConversationId(Long conversationId) { this.conversationId = conversationId; }
    public Long getSenderId() { return senderId; }
    public void setSenderId(Long senderId) { this.senderId = senderId; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }
    public Integer getCreditsOffered() { return creditsOffered; }
    public void setCreditsOffered(Integer creditsOffered) { this.creditsOffered = creditsOffered; }
}