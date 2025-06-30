package com.example.demo.dtos;

import lombok.Data;

@Data
public class UpdateUserProfileDto {
    private String aboutMe;
    private String profilePictureUrl;
    private String profilePictureId;
    private String nickname;
    private Double averageRating;
    private Integer reviewCount;
    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public String getProfilePictureId() {
        return profilePictureId;
    }

    public void setProfilePictureId(String profilePictureId) {
        this.profilePictureId = profilePictureId;
    }

    // Constructor vacío (necesario para deserialización JSON)
    public UpdateUserProfileDto() {
    }

    public UpdateUserProfileDto(String aboutMe, String profilePicture, String profilePictureId, String nickname) {
        this.aboutMe = aboutMe;
        this.profilePictureUrl = profilePicture;
        this.profilePictureId = profilePictureId;
        this.nickname = nickname;
    }

    // Getters y setters
    public String getAboutMe() {
        return aboutMe;
    }

    public void setAboutMe(String aboutMe) {
        this.aboutMe = aboutMe;
    }

    public String getProfilePictureUrl() {
        return profilePictureUrl;
    }

    public void setProfilePictureUrl(String profilePictureUrl) {
        this.profilePictureUrl = profilePictureUrl;
    }

    public Double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(Double averageRating) {
        this.averageRating = averageRating;
    }

    public Integer getReviewCount() {
        return reviewCount;
    }

    public void setReviewCount(Integer reviewCount) {
        this.reviewCount = reviewCount;
    }

}