package com.example.demo.services;

import com.example.demo.interfaces.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailServiceImpl implements EmailService {
    @Autowired
    private JavaMailSender mailSender;

    @Override
    public void sendResetPasswordEmail(String toEmail, String token) {
        String resetLink = "http://localhost:4200/resetPassword?token=" + token;
//        String resetLink = "http://localhost:4200/resetPassword";
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Restablecer tu contraseña");
        message.setText("Haz clic aquí para restablecer tu contraseña: " + resetLink);
        mailSender.send(message);
    }
}