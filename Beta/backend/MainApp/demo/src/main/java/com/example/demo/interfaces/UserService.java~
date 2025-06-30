package com.example.demo.interfaces;

import com.example.demo.dtos.*;

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
}