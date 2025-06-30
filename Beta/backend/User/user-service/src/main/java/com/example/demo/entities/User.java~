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

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

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

    @Column(name = "location_name")
    private String locationName;


    public String getProfilePictureId() {
        return profilePictureId;
    }

    public void setProfilePictureId(String profilePictureId) {
        this.profilePictureId = profilePictureId;
    }

    // Constructor vacío (necesario para JPA)
    public User() {
    }

    // Constructor con campos (opcional, para facilitar la creación de instancias)
    public User(String usermail, String nickname, int credits, LocalDateTime updatedAt, String aboutMe, String profilePicture) {
        this.usermail = usermail;
        this.nickname = nickname;
        this.credits = credits;
        this.updatedAt = updatedAt;
        this.aboutMe = aboutMe;
        this.profilePictureUrl = profilePicture;
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

    public void setUsermail(String username) {
        this.usermail = username;
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
}