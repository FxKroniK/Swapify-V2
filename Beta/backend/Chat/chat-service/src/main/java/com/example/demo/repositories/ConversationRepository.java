package com.example.demo.repositories;

import com.example.demo.entities.Conversation;
import com.example.demo.entities.ConversationStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends MongoRepository<Conversation, Long> {
    Optional<Conversation> findByProductIdAndStatus(String productId, ConversationStatus status);

    @Query("{ $or: [ { buyerId: ?0 }, { sellerId: ?0 } ] }")
    List<Conversation> findByBuyerIdOrSellerId(Long userId);

    Optional<Conversation> findByBuyerIdAndSellerIdAndStatus(Long buyerId, Long sellerId, ConversationStatus status);

    Optional<Conversation> findByBuyerIdAndSellerIdAndProductIdAndStatus(
            Long buyerId, Long sellerId, String productId, ConversationStatus status);
}