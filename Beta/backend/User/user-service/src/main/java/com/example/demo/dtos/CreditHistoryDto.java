package com.example.demo.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CreditHistoryDto {
    private int amount;

    public CreditHistoryDto() {
    }

    public CreditHistoryDto(int amount, String reason, LocalDateTime timestamp) {
        this.amount = amount;
        this.reason = reason;
        this.timestamp = timestamp;
    }

    public int getAmount() {
        return amount;
    }

    public void setAmount(int amount) {
        this.amount = amount;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    private String reason;
    private LocalDateTime timestamp;
}