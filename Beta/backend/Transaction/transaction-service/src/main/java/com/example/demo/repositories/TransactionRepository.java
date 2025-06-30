package com.example.demo.repositories;

import com.example.demo.entities.Status;
import com.example.demo.entities.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByBuyerIdOrSellerId(Long buyerId, Long sellerId);

    @Query("SELECT t FROM Transaction t WHERE t.status = 'COMPLETED' AND " +
            "((t.buyerId = :userA AND t.sellerId = :userB) OR (t.buyerId = :userB AND t.sellerId = :userA))")
    List<Transaction> findCompletedTransactionsBetweenUsers(@Param("userA") Long userA, @Param("userB") Long userB);

    List<Transaction> findByBuyerIdAndStatus(Long buyerId, Status status);

    List<Transaction> findByBuyerIdOrSellerIdAndStatus(Long buyerId, Long sellerId, Status status);


}