package com.example.demo.clients;

import com.example.demo.dtos.CreateTransactionDto;
import com.example.demo.dtos.TransactionDto;
import com.example.demo.dtos.UpdateTransactionStatusDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

@FeignClient(name = "transaction-service", url = "${transaction.service.url:http://localhost:8084}")
public interface TransactionClient {
    @PostMapping("/transactions")
    TransactionDto createTransaction(
            @RequestBody CreateTransactionDto dto,
            @RequestHeader("Authorization") String authToken);

    @PutMapping("/transactions/{id}/status")
    TransactionDto updateTransactionStatus(
            @PathVariable("id") Long id,
            @RequestBody UpdateTransactionStatusDto dto,
            @RequestHeader("Authorization") String authToken);
}