package com.example.demo.interfaces;

public interface EmailService {
    void sendResetPasswordEmail(String toEmail, String token);
}
