package com.example.demo.dtos;

import lombok.Data;

@Data
public class RegisterRequestDto {
    private String username;
    private String useremail;
    private String password;

    public RegisterRequestDto(String username, String useremail, String password) {
        this.username = username;
        this.useremail = useremail;
        this.password = password;
    }
}