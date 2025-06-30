package com.example.demo.dtos;

import lombok.Data;

@Data
public class MessageDto {
    private String message;

    // Constructor sin argumentos
    public MessageDto() {}

    // Constructor con argumento
    public MessageDto(String message) {
        this.message = message;
    }

    // Getter y setter
    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}