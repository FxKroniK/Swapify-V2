package com.example.demo.interfaces;

import com.example.demo.entities.Users;

public interface UserService {
    Users findByUsername(String username);
    Users findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    void save(Users user);
}