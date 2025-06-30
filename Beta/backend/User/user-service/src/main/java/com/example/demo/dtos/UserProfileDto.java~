package com.example.demo.dtos;

import jakarta.persistence.Column;

public class UserProfileDto {
    private Long id; // Añadir el campo id
    private String usermail;
    private String aboutMe;
    private String locationName;
    private Double latitude;
    private Double longitude;
    private String profilePictureUrl;
    private String nickname;
    private String profilePictureId;

    public String getProfilePictureUrl() {
        return profilePictureUrl;
    }

    public void setProfilePictureUrl(String profilePictureUrl) {
        this.profilePictureUrl = profilePictureUrl;
    }

    public String getProfilePictureId() {
        return profilePictureId;
    }

    public void setProfilePictureId(String profilePictureId) {
        this.profilePictureId = profilePictureId;
    }

    public String getLocationName() {
        return locationName;
    }

    public void setLocationName(String locationName) {
        this.locationName = locationName;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }



    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    private String profilePicture;
    private String pictureId;

    public String getPictureId() {
        return pictureId;
    }

    public void setPictureId(String pictureId) {
        this.pictureId = pictureId;
    }

    public UserProfileDto(String usermail, String nickname,String aboutMe, String profilePicture, String pictureId) {
        this.usermail = usermail;
        this.nickname = nickname;
        this.aboutMe = aboutMe;
        this.profilePicture = profilePicture;
        this.pictureId = pictureId;
    }

    public UserProfileDto(Long id, String usermail, String aboutMe, String locationName, Double latitude, Double longitude, String nickname, String profilePicture, String pictureId) {
        this.id = id;
        this.usermail = usermail;
        this.aboutMe = aboutMe;
        this.locationName = locationName;
        this.latitude = latitude;
        this.longitude = longitude;
        this.nickname = nickname;
        this.profilePicture = profilePicture;
        this.pictureId = pictureId;
    }

    // Getters y setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsermail() {
        return usermail;
    }

    public void setUsermail(String usermail) {
        this.usermail = usermail;
    }

    public String getAboutMe() {
        return aboutMe;
    }

    public void setAboutMe(String aboutMe) {
        this.aboutMe = aboutMe;
    }

    public String getProfilePicture() {
        return profilePicture;
    }

    public void setProfilePicture(String profilePicture) {
        this.profilePicture = profilePicture;
    }
}