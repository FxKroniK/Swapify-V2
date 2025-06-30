package com.example.demo.controllers;

import com.example.demo.dtos.LoginRequestDto;
import com.example.demo.dtos.MessageDto;
import com.example.demo.dtos.RegisterRequestDto;
import com.example.demo.dtos.UserInfoDto;
import com.example.demo.entities.Users;
import com.example.demo.interfaces.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    @Autowired
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<MessageDto> login(@RequestBody LoginRequestDto loginRequest) {
        try {
            MessageDto responseDto = authService.login(loginRequest);
            return ResponseEntity.ok(responseDto);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageDto(e.getMessage()));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<MessageDto> register(@RequestBody RegisterRequestDto registerRequest) {
        try {
            MessageDto responseDto = authService.register(registerRequest);
            return ResponseEntity.ok(responseDto);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new MessageDto(e.getMessage()));
        }
    }

    @GetMapping("/validate-user")
    public ResponseEntity<UserInfoDto> validateCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || !(authentication.getPrincipal() instanceof Users user)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        UserInfoDto userInfo = new UserInfoDto(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getUsername(), // Usamos username como nickname por defecto
                user.getRole().name()
        );
        return ResponseEntity.ok(userInfo);
    }
}