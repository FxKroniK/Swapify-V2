package com.example.demo.services;

import com.example.demo.interfaces.NotificationService;
import com.example.demo.clients.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class NotificationServiceImpl implements NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationServiceImpl.class);

    @Autowired
    private ChatClient chatClient;

    @Override
    public void notifyNewTransaction(Long sellerId, Long buyerId, Long transactionId, String productTitle) {
        // Implementación para notificar nueva transacción si es necesario
        log.info("Nueva transacción {} creada entre vendedor {} y comprador {} para producto {}",
                transactionId, sellerId, buyerId, productTitle);
    }

    @Override
    public void notifyTransactionUpdate(Long buyerId, Long sellerId, Long transactionId, String status) {
        try {
            // Crear notificación para el comprador
            Map<String, Object> buyerNotification = new HashMap<>();
            buyerNotification.put("type", "TRANSACTION_UPDATE");
            buyerNotification.put("message", "Estado de transacción actualizado: " + status);
            buyerNotification.put("transactionId", transactionId);
            buyerNotification.put("timestamp", LocalDateTime.now().toString());

            // Crear notificación para el vendedor
            Map<String, Object> sellerNotification = new HashMap<>();
            sellerNotification.put("type", "TRANSACTION_UPDATE");
            sellerNotification.put("message", "Estado de transacción actualizado: " + status);
            sellerNotification.put("transactionId", transactionId);
            sellerNotification.put("timestamp", LocalDateTime.now().toString());

            // Enviar notificaciones al microservicio de chat via REST
            sendNotificationToUser(buyerId, buyerNotification);
            sendNotificationToUser(sellerId, sellerNotification);

            log.info("Notificaciones de transacción enviadas a usuarios {} y {} para transacción {}",
                    buyerId, sellerId, transactionId);

        } catch (Exception e) {
            log.error("Error enviando notificaciones de transacción: ", e);
        }
    }

    @Override
    public void notifySystemMessageSent(Long buyerId, Long sellerId, Long transactionId, Long conversationId) {
        try {
            // Crear notificación de confirmación para el comprador
            Map<String, Object> buyerNotification = new HashMap<>();
            buyerNotification.put("type", "SYSTEM_MESSAGE_SENT");
            buyerNotification.put("message", "Mensaje del sistema enviado al chat");
            buyerNotification.put("transactionId", transactionId);
            buyerNotification.put("conversationId", conversationId);
            buyerNotification.put("timestamp", LocalDateTime.now().toString());

            // Crear notificación de confirmación para el vendedor
            Map<String, Object> sellerNotification = new HashMap<>();
            sellerNotification.put("type", "SYSTEM_MESSAGE_SENT");
            sellerNotification.put("message", "Mensaje del sistema enviado al chat");
            sellerNotification.put("transactionId", transactionId);
            sellerNotification.put("conversationId", conversationId);
            sellerNotification.put("timestamp", LocalDateTime.now().toString());

            // Enviar notificaciones al microservicio de chat via REST
            sendNotificationToUser(buyerId, buyerNotification);
            sendNotificationToUser(sellerId, sellerNotification);

            log.info("Confirmaciones SYSTEM_MESSAGE_SENT enviadas a usuarios {} y {} para transacción {}",
                    buyerId, sellerId, transactionId);

        } catch (Exception e) {
            log.error("Error enviando confirmaciones SYSTEM_MESSAGE_SENT: ", e);
        }
    }

    // ✅ NUEVO MÉTODO - Notificar a ambos usuarios cuando la transacción se completa
    @Override
    public void notifyTransactionCompletedToBothUsers(Long buyerId, Long sellerId, Long transactionId, Long conversationId) {
        String completionMessage = "¡Transacción completada exitosamente!";

        try {
            // Notificar al comprador
            Map<String, Object> buyerNotification = new HashMap<>();
            buyerNotification.put("type", "TRANSACTION_COMPLETED");
            buyerNotification.put("message", completionMessage);
            buyerNotification.put("transactionId", transactionId);
            buyerNotification.put("conversationId", conversationId);
            buyerNotification.put("timestamp", LocalDateTime.now().toString());

            sendNotificationToUser(buyerId, buyerNotification);
            log.info("Notificación de transacción completada enviada al comprador {}: {}", buyerId, completionMessage);

        } catch (Exception e) {
            log.error("Error enviando notificación al comprador {}: ", buyerId, e);
        }

        try {
            // Notificar al vendedor
            Map<String, Object> sellerNotification = new HashMap<>();
            sellerNotification.put("type", "TRANSACTION_COMPLETED");
            sellerNotification.put("message", completionMessage);
            sellerNotification.put("transactionId", transactionId);
            sellerNotification.put("conversationId", conversationId);
            sellerNotification.put("timestamp", LocalDateTime.now().toString());

            sendNotificationToUser(sellerId, sellerNotification);
            log.info("Notificación de transacción completada enviada al vendedor {}: {}", sellerId, completionMessage);

        } catch (Exception e) {
            log.error("Error enviando notificación al vendedor {}: ", sellerId, e);
        }

        log.info("[DEBUG] Notificaciones de completado enviadas a ambos usuarios {} y {} para transacción {}",
                buyerId, sellerId, transactionId);
    }

    /**
     * Envía una notificación a un usuario específico a través del microservicio de chat
     * ✅ ACTUALIZADO - Usa Feign Client en lugar de RestTemplate
     */
    private void sendNotificationToUser(Long userId, Map<String, Object> notification) {
        try {
            // ✅ USAR FEIGN CLIENT - Enviar notificación al usuario específico
            chatClient.sendNotificationToUser(userId, notification);

            log.debug("Notificación enviada a usuario {} via Feign: {}", userId, notification.get("message"));

        } catch (Exception e) {
            log.error("Error enviando notificación via Feign a usuario {}: ", userId, e);
            // No relanzar la excepción para que no afecte la transacción principal
        }
    }
}
