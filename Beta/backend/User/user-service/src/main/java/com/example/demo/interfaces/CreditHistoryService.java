package com.example.demo.interfaces;

import com.example.demo.dtos.CreditHistoryDto;
import com.example.demo.dtos.CreditRequestDto;

import java.util.List;

public interface CreditHistoryService {
    void addCredits(Long userId, CreditRequestDto dto);
    List<CreditHistoryDto> getCreditHistory(Long userId);
}