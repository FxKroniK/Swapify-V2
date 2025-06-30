package com.example.demo.dtos;

public class UpdateTransactionStatusDto {
    private String status;
    private String productRequestedId;  // Necesario cuando el comprador ofrece un producto
    private Long conversationId;  // Campo añadido

    // Getters y setters
    public void setStatus(String status) {
        this.status = status;
    }

    public void setProductRequestedId(String productRequestedId) {
        this.productRequestedId = productRequestedId;
    }

    public void setConversationId(Long conversationId) {
        this.conversationId = conversationId;
    }

    public String getStatus() {
        return status;
    }

    public String getProductRequestedId() {
        return productRequestedId;
    }

    public Long getConversationId() {
        return conversationId;
    }
}