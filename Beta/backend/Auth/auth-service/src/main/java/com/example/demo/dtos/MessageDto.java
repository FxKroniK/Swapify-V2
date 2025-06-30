package com.example.demo.dtos;

import lombok.Data;

@Data
public class MessageDto {
    private String message;

    public MessageDto(String message) {
        this.message = message;
    }
}