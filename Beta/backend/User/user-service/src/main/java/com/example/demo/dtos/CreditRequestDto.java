package com.example.demo.dtos;

import lombok.Data;

@Data
public class CreditRequestDto {
    private int amount;
    private String reason;

    public int getAmount() {
        return amount;
    }

    public CreditRequestDto() {
    }

    public void setAmount(int amount) {
        this.amount = amount;
    }

    public CreditRequestDto(int amount, String reason) {
        this.amount = amount;
        this.reason = reason;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}