package com.example.demo.repositories;

import com.example.demo.entities.Conversation;
import com.example.demo.entities.ConversationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    Optional<Conversation> findByProductIdAndStatus(String productId, ConversationStatus status);
    @Query("SELECT c FROM Conversation c WHERE c.buyerId = :userId OR c.sellerId = :userId")
    List<Conversation> findByBuyerIdOrSellerId(Long userId);

    Optional<Conversation> findByBuyerIdAndSellerIdAndStatus(Long buyerId, Long sellerId, ConversationStatus status);

    Optional<Conversation> findByBuyerIdAndSellerIdAndProductIdAndStatus(
            Long buyerId, Long sellerId, String productId, ConversationStatus status);
}