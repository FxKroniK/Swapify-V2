package com.example.demo.dtos;

public class UserLocationDto {
    private Long id;
    private Double latitude;
    private Double longitude;
    private String locationName;
    private String username;
    private Double rating;
    private Integer reviewCount;

    public UserLocationDto() {
    }

    public UserLocationDto(Long id, Double latitude, Double longitude, String locationName, String username,
                           Double rating, Integer reviewCount) {
        this.id = id;
        this.latitude = latitude;
        this.longitude = longitude;
        this.locationName = locationName;
        this.username = username;
        this.rating = rating;
        this.reviewCount = reviewCount;
    }

    // Nuevo constructor con 3 parámetros
    public UserLocationDto(Long id, Double latitude, Double longitude) {
        this.id = id;
        this.latitude = latitude;
        this.longitude = longitude;
        this.locationName = null;
        this.username = null;
        this.rating = null;
        this.reviewCount = null;
    }

    // Getters y Setters (mantienen los mismos)
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
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