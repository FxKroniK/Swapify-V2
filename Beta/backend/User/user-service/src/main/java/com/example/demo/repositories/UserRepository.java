package com.example.demo.repositories;

import com.example.demo.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsermail(String email);
    List<User> findByLocationName(String locationName);
    List<User> findByLatitudeIsNotNullAndLongitudeIsNotNull();
    Optional<User> findByNickname(String nickname); // Nuevo método
}