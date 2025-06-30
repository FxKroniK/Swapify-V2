package com.example.demo.dtos;

public class UserInfoDto {
    private Long id;
    private String username;
    private String useremail;
    private String nickname; // Añadido para compatibilidad con UserService
    private String role;

    // Constructor vacío (necesario para deserialización con WebClient)
    public UserInfoDto() {
    }

    // Constructor con parámetros
    public UserInfoDto(Long id, String username, String useremail, String nickname, String role) {
        this.id = id;
        this.username = username;
        this.useremail = useremail;
        this.nickname = nickname;
        this.role = role;
    }

    // Getters y Setters
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

    public String getUseremail() {
        return useremail;
    }

    public void setUseremail(String useremail) {
        this.useremail = useremail;
    }

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}