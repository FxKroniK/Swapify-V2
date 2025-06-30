package com.example.demo.interfaces;

import com.example.demo.dtos.ConversationDto;
import com.example.demo.dtos.MessageDto;
import com.example.demo.dtos.TransactionDto;

import java.util.List;
import java.util.Map;

public interface NegotiationService {
    ConversationDto startNegotiation(String productId, String authToken);
    MessageDto sendMessage(Long conversationId, String content, String type, String authToken, String productId, Integer creditsOffered);
    ConversationDto getNegotiation(Long id, String authToken);
    ConversationDto sendProposal(Long id, List<String> productIdsOffered, Integer creditsOffered, String authToken);
    ConversationDto acceptProposal(Long id, String authToken);
    List<ConversationDto> getUserConversations(String authToken);
    void deleteNegotiation(Long id, String authToken);
    TransactionDto createTransaction(Long conversationId, String authToken);
    TransactionDto confirmTransaction(Long conversationId, Long transactionId, String authToken, boolean accept);
    void notifyTransactionUpdate(Long conversationId, Map<String, Object> message);
}
