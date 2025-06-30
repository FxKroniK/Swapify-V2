package com.example.demo.interfaces;

import com.example.demo.dtos.CreateTransactionDto;
import com.example.demo.dtos.TransactionDto;
import com.example.demo.dtos.UpdateTransactionStatusDto;

import java.util.List;

public interface TransactionService {
    TransactionDto createTransaction(CreateTransactionDto dto, String authToken);

    TransactionDto getTransaction(Long id, String authToken); // Modificado para incluir authToken

    TransactionDto updateTransactionStatus(Long id, UpdateTransactionStatusDto dto, String authToken);

    List<TransactionDto> getTransactionsByUser(String authToken);
}