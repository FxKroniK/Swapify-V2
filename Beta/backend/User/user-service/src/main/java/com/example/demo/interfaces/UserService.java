package com.example.demo.interfaces;

import com.example.demo.dtos.*;
import com.example.demo.entities.User;

import java.util.List;

public interface UserService {
    UserDto getUser(Long id);
    UserProfileDto getUserEntity(Long id);
    void updateUser(Long id, UpdateUserDto dto);
    void updateCredits(Long id, int amount);
    UserDto createUser(UserInfoDto userInfoDto);
    void updateUserProfile(Long id, UpdateUserProfileDto dto);
    UserProfileDto getUserProfile(Long id);
    void updateUserProfileReactively(Long id, UpdateUserProfileDto dto);
    UserProfileDto getUserProfileByEmail(String email);
    UserDto getUserByEmail(String email);
    void transferCredits(Long fromUserId, Long toUserId, int amount);
    User updateLocation(Long userId, Double latitude, Double longitude, String locationName);
    List<User> getUsersByLocation(String locationName);
    List<User> getAllUsersWithLocation();
    void addReview(Long userId, Double newRating); // Nuevo método
    UserProfileDto getUserByUsername(String username); // Nuevo mét
}