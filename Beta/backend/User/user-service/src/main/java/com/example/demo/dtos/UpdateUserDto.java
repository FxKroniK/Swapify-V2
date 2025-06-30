package com.example.demo.dtos;

import lombok.Data;

@Data
public class UpdateUserDto {
    private String username;

    public String getUsername() {
        return username;
    }

    public UpdateUserDto() {
    }

    public UpdateUserDto(String username) {
        this.username = username;
    }

    public void setUsername(String username) {
        this.username = username;
    }
}