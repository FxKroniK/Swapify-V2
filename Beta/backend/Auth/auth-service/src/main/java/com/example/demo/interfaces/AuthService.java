package com.example.demo.interfaces;

import com.example.demo.dtos.LoginRequestDto;
import com.example.demo.dtos.MessageDto;
import com.example.demo.dtos.RegisterRequestDto;

public interface AuthService {
    MessageDto login(LoginRequestDto loginRequest);
    MessageDto register(RegisterRequestDto registerRequest);
}