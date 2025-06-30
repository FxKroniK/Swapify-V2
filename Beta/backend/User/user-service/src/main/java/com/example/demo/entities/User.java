package com.example.demo.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    private Long id;

    @Column(nullable = false, unique = true)
    private String usermail;

    @Column
    private String nickname;

    @Column(nullable = false)
    private int credits;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "about_me")
    private String aboutMe;

    @Column(name = "profile_picture")
    private String profilePictureUrl;

    @Column(name = "profile_picture_id")
    private String profilePictureId;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "location_name")
    private String locationName;

    @Column(name = "rating") // Nuevo campo: valoración promedio del usuario
    private Double rating;

    @Column(name = "review_count") // Nuevo campo: número de valoraciones recibidas
    private Integer reviewCount;

    // Constructor vacío (necesario para JPA)
    public User() {
    }

    // Constructor con campos (actualizado para incluir los nuevos campos)
    public User(String usermail, String nickname, int credits, LocalDateTime updatedAt, String aboutMe, String profilePicture, Double rating, Integer reviewCount) {
        this.usermail = usermail;
        this.nickname = nickname;
        this.credits = credits;
        this.updatedAt = updatedAt;
        this.aboutMe = aboutMe;
        this.profilePictureUrl = profilePicture;
        this.rating = rating;
        this.reviewCount = reviewCount;
    }

    // Getters y setters para los nuevos campos
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

    // Resto de getters y setters (sin cambios)
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsermail() {
        return usermail;
    }

    public void setUsermail(String username) {
        this.usermail = username;
    }

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public int getCredits() {
        return credits;
    }

    public void setCredits(int credits) {
        this.credits = credits;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getAboutMe() {
        return aboutMe;
    }

    public void setAboutMe(String aboutMe) {
        this.aboutMe = aboutMe;
    }

    public String getProfilePictureUrl() {
        return profilePictureUrl;
    }

    public void setProfilePictureUrl(String profilePicture) {
        this.profilePictureUrl = profilePicture;
    }

    public String getProfilePictureId() {
        return profilePictureId;
    }

    public void setProfilePictureId(String profilePictureId) {
        this.profilePictureId = profilePictureId;
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

    public String getLocationName() {
        return locationName;
    }

    public void setLocationName(String locationName) {
        this.locationName = locationName;
    }
}