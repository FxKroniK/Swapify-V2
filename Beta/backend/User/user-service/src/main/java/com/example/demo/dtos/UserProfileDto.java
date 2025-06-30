package com.example.demo.dtos;

public class UserProfileDto {
    private Long id;
    private String usermail;
    private String aboutMe;
    private String locationName;
    private Double latitude;
    private Double longitude;
    private String profilePictureUrl;
    private String nickname;
    private String profilePictureId;
    private Double rating; // Nuevo campo
    private Integer reviewCount; // Nuevo campo

    // Constructor usado anteriormente (ajustado)
    public UserProfileDto(String usermail, String nickname, String aboutMe, String profilePicture, String pictureId) {
        this.usermail = usermail;
        this.nickname = nickname;
        this.aboutMe = aboutMe;
        this.profilePictureUrl = profilePicture;
        this.profilePictureId = pictureId;
        this.rating = 0.0; // Valor por defecto
        this.reviewCount = 0; // Valor por defecto
    }

    // Constructor principal (ajustado)
    public UserProfileDto(Long id, String usermail, String aboutMe, String locationName, Double latitude, Double longitude,
                          String nickname, String profilePicture, String pictureId) {
        this.id = id;
        this.usermail = usermail;
        this.aboutMe = aboutMe;
        this.locationName = locationName;
        this.latitude = latitude;
        this.longitude = longitude;
        this.nickname = nickname;
        this.profilePictureUrl = profilePicture;
        this.profilePictureId = pictureId;
        this.rating = 0.0; // Valor por defecto
        this.reviewCount = 0; // Valor por defecto
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

    public Double getRating() {
        return rating;
    }

    public void setRating(Double rating) {
        this.rating = rating;
    }

    public Integer getReviewCount() {
        return reviewCount;
    }

    public void setReviewCount(Integer reviewCount) {
        this.reviewCount = reviewCount;
    }
}