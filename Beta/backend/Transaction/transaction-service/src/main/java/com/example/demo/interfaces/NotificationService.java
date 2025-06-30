package com.example.demo.interfaces;

public interface NotificationService {

    void notifyNewTransaction(Long sellerId, Long buyerId, Long transactionId, String productTitle);

    void notifyTransactionUpdate(Long buyerId, Long sellerId, Long transactionId, String status);
}