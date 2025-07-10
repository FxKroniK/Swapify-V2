package com.example.demo.controllers;

import com.example.demo.dtos.ConversationDto;
import com.example.demo.dtos.MessageDto;
import com.example.demo.dtos.TransactionDto;
import com.example.demo.interfaces.NegotiationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/negotiations")
public class NegotiationController {

    private static final Logger log = LoggerFactory.getLogger(NegotiationController.class);

    private final NegotiationService negotiationService;

    // ✅ AGREGAR SimpMessagingTemplate para las notificaciones
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public NegotiationController(NegotiationService negotiationService) {
        this.negotiationService = negotiationService;
    }

    @PostMapping("/start")
    public ResponseEntity<ConversationDto> startNegotiation(
            @RequestParam("productId") String productId,
            @RequestHeader("Authorization") String authToken) {
        ConversationDto conversation = negotiationService.startNegotiation(productId, authToken);
        return new ResponseEntity<>(conversation, HttpStatus.CREATED);
    }

    @PostMapping("/{conversationId}/messages")
    public ResponseEntity<MessageDto> sendMessage(
            @PathVariable("conversationId") Long conversationId,
            @RequestParam("content") String content,
            @RequestParam(value = "type", defaultValue = "TEXT") String type,
            @RequestParam(value = "productId", required = false) String productId,
            @RequestParam(value = "creditsOffered", required = false, defaultValue = "0") Integer creditsOffered,
            @RequestHeader("Authorization") String authToken) {
        MessageDto message = negotiationService.sendMessage(conversationId, content, type, authToken, productId, creditsOffered);
        return new ResponseEntity<>(message, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ConversationDto> getNegotiation(
            @PathVariable("id") Long id,
            @RequestHeader("Authorization") String authToken) {
        ConversationDto conversation = negotiationService.getNegotiation(id, authToken);
        return new ResponseEntity<>(conversation, HttpStatus.OK);
    }

    @PostMapping("/{id}/proposal")
    public ResponseEntity<ConversationDto> sendProposal(
            @PathVariable("id") Long id,
            @RequestParam(value = "productIdsOffered", required = false) List<String> productIdsOffered,
            @RequestParam(value = "creditsOffered", required = false, defaultValue = "0") Integer creditsOffered,
            @RequestHeader("Authorization") String authToken) {
        ConversationDto conversation = negotiationService.sendProposal(id, productIdsOffered, creditsOffered, authToken);
        return new ResponseEntity<>(conversation, HttpStatus.OK);
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<ConversationDto> acceptProposal(
            @PathVariable("id") Long id,
            @RequestHeader("Authorization") String authToken) {
        ConversationDto conversation = negotiationService.acceptProposal(id, authToken);
        return new ResponseEntity<>(conversation, HttpStatus.OK);
    }

    @GetMapping("/user")
    public ResponseEntity<List<ConversationDto>> getUserConversations(
            @RequestHeader("Authorization") String authToken) {
        List<ConversationDto> conversations = negotiationService.getUserConversations(authToken);
        return new ResponseEntity<>(conversations, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNegotiation(
            @PathVariable("id") Long id,
            @RequestHeader("Authorization") String authToken) {
        negotiationService.deleteNegotiation(id, authToken);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @PostMapping("/{conversationId}/transactions")
    public ResponseEntity<TransactionDto> createTransaction(
            @PathVariable("conversationId") Long conversationId,
            @RequestHeader("Authorization") String authToken) {
        TransactionDto transaction = negotiationService.createTransaction(conversationId, authToken);
        return new ResponseEntity<>(transaction, HttpStatus.CREATED);
    }

    @PostMapping("/{conversationId}/transactions/{transactionId}/confirm")
    public ResponseEntity<TransactionDto> confirmTransaction(
            @PathVariable("conversationId") Long conversationId,
            @PathVariable("transactionId") Long transactionId,
            @RequestParam("accept") boolean accept,
            @RequestHeader("Authorization") String authToken) {
        TransactionDto transaction = negotiationService.confirmTransaction(conversationId, transactionId, authToken, accept);
        return new ResponseEntity<>(transaction, HttpStatus.OK);
    }

    @PostMapping("/notify/{conversationId}")
    public ResponseEntity<Void> notifyTransactionUpdate(
            @PathVariable("conversationId") Long conversationId,
            @RequestBody Map<String, Object> message) {
        try {
            // Delegar la lógica al servicio
            negotiationService.notifyTransactionUpdate(conversationId, message);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            System.err.println("Error al procesar la notificación: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ✅ NUEVO ENDPOINT - Para recibir notificaciones del microservicio de transacciones
    // y enviarlas por WebSocket a usuarios específicos
    @PostMapping("/notify/user/{userId}")
    public ResponseEntity<String> sendNotificationToUser(
            @PathVariable Long userId,
            @RequestBody Map<String, Object> notification) {

        try {
            String destination = "/user/" + userId + "/queue/notifications";

            log.info("📡 [Chat-Notification] Enviando notificación WebSocket a usuario {} en destino {}: {}",
                    userId, destination, notification.get("message"));

            // ✅ ENVIAR POR WEBSOCKET al usuario específico
            messagingTemplate.convertAndSend(destination, notification);

            log.info("✅ [Chat-Notification] Notificación WebSocket enviada exitosamente a usuario {}", userId);

            return ResponseEntity.ok("Notificación enviada");

        } catch (Exception e) {
            log.error("❌ [Chat-Notification] Error enviando notificación WebSocket a usuario {}: ", userId, e);
            return ResponseEntity.internalServerError().body("Error enviando notificación");
        }
    }
}
