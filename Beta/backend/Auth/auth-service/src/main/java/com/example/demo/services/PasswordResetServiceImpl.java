package com.example.demo.services;

import com.example.demo.dtos.ConfirmResetRequestDto;
import com.example.demo.dtos.MessageDto;
import com.example.demo.dtos.ResetPasswordRequestDto;
import com.example.demo.entities.PasswordResetToken;
import com.example.demo.entities.Users;
import com.example.demo.interfaces.EmailService;
import com.example.demo.interfaces.PasswordResetService;
import com.example.demo.interfaces.UserService;
import com.example.demo.repositories.PasswordResetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class PasswordResetServiceImpl implements PasswordResetService {
    @Autowired
    private UserService userService;
    @Autowired
    private PasswordResetRepository tokenRepository;
    @Autowired
    private EmailService emailService; // Todavía inyectado pero no usado
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public MessageDto requestPasswordReset(ResetPasswordRequestDto requestDto) {
        Users user = userService.findByEmail(requestDto.getUseremail()); // Lanza EntityNotFoundException si no existe

        String resetToken = UUID.randomUUID().toString();
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(1);

        PasswordResetToken tokenEntity = new PasswordResetToken();
        tokenEntity.setUser(user);
        tokenEntity.setToken(resetToken);
        tokenEntity.setExpiresAt(expiresAt);
        tokenRepository.save(tokenEntity);

        // Reemplazamos el envío de correo por un mensaje de prueba
        emailService.sendResetPasswordEmail(user.getEmail(), resetToken);
        System.out.println("Token generado (supuestamente real): " + resetToken);

        return new MessageDto("Correo enviado (supuestamente real) token de reset: " + resetToken);
    }

    @Override
    public MessageDto confirmPasswordReset(ConfirmResetRequestDto requestDto) {
        PasswordResetToken tokenEntity = tokenRepository.findByToken(requestDto.getToken())
                .orElseThrow(() -> new IllegalArgumentException("Token inválido"));

        if (tokenEntity.getExpiresAt().isBefore(LocalDateTime.now())) {
            tokenRepository.delete(tokenEntity);
            throw new IllegalArgumentException("El token ha expirado");
        }

        Users user = tokenEntity.getUser();
        user.setPassword(passwordEncoder.encode(requestDto.getNewPassword()));
        userService.save(user);

        tokenRepository.delete(tokenEntity);

        return new MessageDto("Contraseña restablecida con éxito");
    }
}