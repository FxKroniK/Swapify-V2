package com.example.demo.dtos;

import lombok.Data;

@Data
public class CreateUserDto {
    private Long id; // Agregamos el ID para mapearlo desde el UserInfoDto
    private String username;
    private String nickname;

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    private String email; // Agregamos el email para mapearlo desde el UserInfoDto



    public CreateUserDto() {
    }

    public CreateUserDto(Long id, String username, String email) {
        this.id = id;
        this.username = username;
        this.email = email;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}