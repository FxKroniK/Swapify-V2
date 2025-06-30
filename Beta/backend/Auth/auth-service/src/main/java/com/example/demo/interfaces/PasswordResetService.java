package com.example.demo.interfaces;

import com.example.demo.dtos.ConfirmResetRequestDto;
import com.example.demo.dtos.MessageDto;
import com.example.demo.dtos.ResetPasswordRequestDto;

public interface PasswordResetService {
    MessageDto requestPasswordReset(ResetPasswordRequestDto requestDto);
    MessageDto confirmPasswordReset(ConfirmResetRequestDto requestDto);
}