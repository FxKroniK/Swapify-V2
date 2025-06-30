package com.example.demo.dtos;

public class UserInfoDto {
    private Long id;
    private String useremail; // Cambiado de 'email' a 'useremail' para consistencia
    private String nickname;
    private String role;
    private String imageUrl;
    private String imageId;

    public UserInfoDto() {
    }

    public UserInfoDto(Long id, String useremail, String role, String nickname, String imageUrl, String imageId) {
        this.id = id;
        this.useremail = useremail;
        this.role = role;
        this.nickname = nickname;
        this.imageUrl = imageUrl;
        this.imageId = imageId;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getImageId() {
        return imageId;
    }

    public void setImageId(String imageId) {
        this.imageId = imageId;
    }
}