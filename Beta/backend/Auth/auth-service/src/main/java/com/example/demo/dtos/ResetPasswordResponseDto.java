package com.example.demo.dtos;

import lombok.Data;

@Data
public class ResetPasswordResponseDto {
    String message;

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
