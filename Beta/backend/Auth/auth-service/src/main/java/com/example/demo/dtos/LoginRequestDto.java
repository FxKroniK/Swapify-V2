package com.example.demo.dtos;

import lombok.Data;

@Data
public class LoginRequestDto {
    private String username;
    private String password;
}