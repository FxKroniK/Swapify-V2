package com.example.demo.services;

import com.example.demo.dtos.*;
import com.example.demo.entities.User;
import com.example.demo.interfaces.UserService;
import com.example.demo.repositories.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDto getUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        return new UserDto(user.getId(), user.getUsermail(), user.getNickname(), user.getCredits());
    }

    @Override
    public UserProfileDto getUserEntity(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        UserProfileDto dto = new UserProfileDto(
                user.getId(),
                user.getUsermail(),
                user.getAboutMe() != null ? user.getAboutMe() : "",
                user.getLocationName() != null ? user.getLocationName() : "",
                user.getLatitude(),
                user.getLongitude(),
                user.getNickname(),
                user.getProfilePictureUrl() != null ? user.getProfilePictureUrl() : "",
                user.getProfilePictureId() != null ? user.getProfilePictureId() : ""

        );
        dto.setRating(user.getRating() != null ? user.getRating() : 0.0);
        dto.setReviewCount(user.getReviewCount() != null ? user.getReviewCount() : 0);
        return dto;
    }

    @Override
    public void updateUser(Long id, UpdateUserDto dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        user.setUsermail(dto.getUsername());
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    @Override
    public void updateCredits(Long id, int amount) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        user.setCredits(user.getCredits() + amount);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    @Override
    public UserDto createUser(UserInfoDto userInfoDto) {
        // Verificar si el usuario ya existe por email
        Optional<User> existingUser = userRepository.findByUsermail(userInfoDto.getUseremail());
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            return new UserDto(user.getId(), user.getUsermail(), user.getNickname(), user.getCredits());
        }

        // Crear un nuevo usuario
        User user = new User();
        user.setId(userInfoDto.getId());
        user.setUsermail(userInfoDto.getUseremail());
        user.setNickname(userInfoDto.getNickname() != null ? userInfoDto.getNickname() : userInfoDto.getUsername());
        user.setCredits(100); // Créditos iniciales
        user.setUpdatedAt(LocalDateTime.now());
        user.setRating(0.0);
        user.setReviewCount(0);

        try {
            user = userRepository.save(user);
        } catch (Exception e) {
            throw new RuntimeException("Error creando usuario: " + e.getMessage());
        }

        return new UserDto(user.getId(), user.getUsermail(), user.getNickname(), user.getCredits());
    }

    @Override
    public void updateUserProfile(Long id, UpdateUserProfileDto dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        if (dto.getAboutMe() != null) {
            user.setAboutMe(dto.getAboutMe());
        }
        if (dto.getProfilePictureUrl() != null) {
            user.setProfilePictureUrl(dto.getProfilePictureUrl());
        }
        if (dto.getProfilePictureId() != null) {
            user.setProfilePictureId(dto.getProfilePictureId());
        }
        if (dto.getNickname() != null) {
            user.setNickname(dto.getNickname());
        }
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    @Override
    public void transferCredits(Long fromUserId, Long toUserId, int amount) {
        User fromUser = userRepository.findById(fromUserId)
                .orElseThrow(() -> new RuntimeException("Usuario origen no encontrado: " + fromUserId));
        User toUser = userRepository.findById(toUserId)
                .orElseThrow(() -> new RuntimeException("Usuario destino no encontrado: " + toUserId));

        if (fromUser.getCredits() < amount) {
            throw new RuntimeException("Créditos insuficientes para el usuario: " + fromUserId);
        }

        fromUser.setCredits(fromUser.getCredits() - amount);
        toUser.setCredits(toUser.getCredits() + amount);

        userRepository.save(fromUser);
        userRepository.save(toUser);
    }

    @Override
    public UserDto getUserByEmail(String email) {
        User user = userRepository.findByUsermail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found with email: " + email));
        return new UserDto(user.getId(), user.getUsermail(), user.getNickname(), user.getCredits());
    }

    @Override
    public UserProfileDto getUserProfile(Long id) {
        UserProfileDto userProfile = getUserEntity(id);
        return new UserProfileDto(
                userProfile.getId(),
                userProfile.getUsermail(),
                userProfile.getAboutMe() != null ? userProfile.getAboutMe() : "",
                userProfile.getLocationName() != null ? userProfile.getLocationName() : "",
                userProfile.getLatitude(),
                userProfile.getLongitude(),
                userProfile.getNickname(),
                userProfile.getProfilePictureUrl() != null ? userProfile.getProfilePictureUrl() : "",
                userProfile.getProfilePictureId() != null ? userProfile.getProfilePictureId() : ""
        ) {{
            setRating(userProfile.getRating() != null ? userProfile.getRating() : 0.0);
            setReviewCount(userProfile.getReviewCount() != null ? userProfile.getReviewCount() : 0);
        }};
    }

    @Override
    public void updateUserProfileReactively(Long id, UpdateUserProfileDto dto) {
        updateUserProfile(id, dto);
    }

    @Override
    public UserProfileDto getUserProfileByEmail(String email) {
        User user = userRepository.findByUsermail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found with email: " + email));
        UserProfileDto dto = new UserProfileDto(
                user.getId(),
                user.getUsermail(),
                user.getAboutMe() != null ? user.getAboutMe() : "",
                user.getLocationName() != null ? user.getLocationName() : "",
                user.getLatitude(),
                user.getLongitude(),
                user.getNickname(),
                user.getProfilePictureUrl() != null ? user.getProfilePictureUrl() : "",
                user.getProfilePictureId() != null ? user.getProfilePictureId() : ""
        );
        dto.setRating(user.getRating() != null ? user.getRating() : 0.0);
        dto.setReviewCount(user.getReviewCount() != null ? user.getReviewCount() : 0);
        return dto;
    }

    @Override
    public User updateLocation(Long userId, Double latitude, Double longitude, String locationName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        user.setLatitude(latitude);
        user.setLongitude(longitude);
        user.setLocationName(locationName);
        user.setUpdatedAt(LocalDateTime.now());

        return userRepository.save(user);
    }

    @Override
    public List<User> getUsersByLocation(String locationName) {
        List<User> users = new ArrayList<>();
        users = userRepository.findByLocationName(locationName);
        return users;
    }

    @Override
    public List<User> getAllUsersWithLocation() {
        return userRepository.findByLatitudeIsNotNullAndLongitudeIsNotNull();
    }

    @Override
    public void addReview(Long userId, Double newRating) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        int currentReviewCount = user.getReviewCount() != null ? user.getReviewCount() : 0;
        Double currentRating = user.getRating() != null ? user.getRating() : 0.0;

        // Calcular nueva valoración promedio
        double updatedRating = ((currentRating * currentReviewCount) + newRating) / (currentReviewCount + 1);
        user.setRating(updatedRating);
        user.setReviewCount(currentReviewCount + 1);
        user.setUpdatedAt(LocalDateTime.now());

        userRepository.save(user);
    }

    @Override
    public UserProfileDto getUserByUsername(String username) {
        User user = userRepository.findByNickname(username)
                .orElseThrow(() -> new EntityNotFoundException("User not found with username: " + username));
        UserProfileDto dto = new UserProfileDto(
                user.getId(),
                user.getUsermail(),
                user.getAboutMe() != null ? user.getAboutMe() : "",
                user.getLocationName() != null ? user.getLocationName() : "",
                user.getLatitude(),
                user.getLongitude(),
                user.getNickname(),
                user.getProfilePictureUrl() != null ? user.getProfilePictureUrl() : "",
                user.getProfilePictureId() != null ? user.getProfilePictureId() : ""
        );
        dto.setRating(user.getRating() != null ? user.getRating() : 0.0);
        dto.setReviewCount(user.getReviewCount() != null ? user.getReviewCount() : 0);
        return dto;
    }
}