package com.example.demo.services;

import com.example.demo.clients.AuthClient;
import com.example.demo.clients.ChatClient;
import com.example.demo.clients.ProductClient;
import com.example.demo.clients.UserClient;
import com.example.demo.dtos.*;
import com.example.demo.entities.Status;
import com.example.demo.entities.Transaction;

import com.example.demo.interfaces.NotificationService;
import com.example.demo.interfaces.TransactionService;
import com.example.demo.repositories.TransactionRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class TransactionServiceImpl implements TransactionService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private ProductClient productClient;

    @Autowired
    private UserClient userClient;

    @Autowired
    private AuthClient authClient;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private ChatClient chatClient;

    @Autowired
    private EmailService emailService;

    private final Map<Long, TransactionTokens> transactionTokensMap = new ConcurrentHashMap<>();
    private static final DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private static class TransactionTokens {
        private String buyerToken;
        private String sellerToken;

        public TransactionTokens() {}

        public String getBuyerToken() { return buyerToken; }
        public void setBuyerToken(String buyerToken) { this.buyerToken = buyerToken; }
        public String getSellerToken() { return sellerToken; }
        public void setSellerToken(String sellerToken) { this.sellerToken = sellerToken; }
    }

    private TransactionTokens getOrCreateTransactionTokens(Long transactionId) {
        return transactionTokensMap.computeIfAbsent(transactionId, k -> new TransactionTokens());
    }

    private void removeTransactionTokens(Long transactionId) {
        transactionTokensMap.remove(transactionId);
    }

    @Override
    @Transactional
    public TransactionDto createTransaction(CreateTransactionDto dto, String authToken) {
        System.out.println("Creando transacción con datos: " + dto.toString() + ", token: " + authToken);

        UserInfoDto userInfo = authClient.validateUserToken(authToken, null);
        if (userInfo == null) {
            throw new EntityNotFoundException("Token inválido o usuario no encontrado");
        }

        if (dto.getSellerId() == null || dto.getBuyerId() == null) {
            throw new IllegalArgumentException("sellerId y buyerId son requeridos");
        }

        if (dto.getProductOfferedId() != null) {
            System.out.println("Validando producto ofrecido ID: " + dto.getProductOfferedId());
            ProductDto offeredProduct = productClient.getProduct(dto.getProductOfferedId());
            if (offeredProduct == null) {
                throw new EntityNotFoundException("Producto ofrecido no encontrado: " + dto.getProductOfferedId());
            }
            if (!offeredProduct.getOwnerId().equals(String.valueOf(dto.getSellerId()))) {
                throw new IllegalArgumentException("Producto ofrecido no pertenece al vendedor: " + offeredProduct.getOwnerId() + " != " + dto.getSellerId());
            }
        }

        if (dto.getProductRequestedId() != null) {
            System.out.println("Validando producto solicitado ID: " + dto.getProductRequestedId());
            ProductDto requestedProduct = productClient.getProduct(dto.getProductRequestedId());
            if (requestedProduct == null) {
                throw new EntityNotFoundException("Producto solicitado no encontrado: " + dto.getProductRequestedId());
            }
        }

        Transaction transaction = new Transaction();
        transaction.setSellerId(dto.getSellerId());
        transaction.setBuyerId(dto.getBuyerId());
        transaction.setProductOfferedId(dto.getProductOfferedId());
        transaction.setProductRequestedId(dto.getProductRequestedId());
        transaction.setCreditsOffered(Optional.ofNullable(dto.getCreditsOffered()).orElse(0));
        transaction.setCreditsRequested(Optional.ofNullable(dto.getCreditsRequested()).orElse(0));
        transaction.setStatus(Status.PENDING);
        transaction.setCreatedAt(LocalDateTime.now());
        transaction.setBuyerAccepted(false);
        transaction.setSellerAccepted(false);
        transaction.setProcessing(false);
        transaction.setConversationId(dto.getConversationId());

        Transaction savedTransaction = transactionRepository.save(transaction);
        System.out.println("Transacción creada con ID: " + savedTransaction.getId());
        return mapToDto(savedTransaction);
    }

    @Override
    @Transactional
    public TransactionDto updateTransactionStatus(Long id, UpdateTransactionStatusDto dto, String authToken) {
        System.out.println("Actualizando estado de transacción con ID: " + id + ", status recibido: " + dto.getStatus());
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Transaction not found: " + id));

        if (transaction.getStatus() == Status.COMPLETED || transaction.getStatus() == Status.REJECTED) {
            System.out.println("Transacción con ID " + id + " ya ha sido procesada con estado: " + transaction.getStatus());
            return mapToDto(transaction);
        }

        if (transaction.isProcessing()) {
            System.out.println("Transacción con ID " + id + " está siendo procesada por otra solicitud");
            throw new IllegalStateException("La transacción ya está siendo procesada");
        }

        transaction.setProcessing(true);
        transactionRepository.save(transaction);

        try {
            UserInfoDto userInfo = authClient.validateUserToken(authToken, null);
            if (userInfo == null) {
                throw new EntityNotFoundException("Token inválido o usuario no encontrado");
            }

            boolean isBuyer = userInfo.getId().equals(transaction.getBuyerId());
            boolean isSeller = userInfo.getId().equals(transaction.getSellerId());

            if (!isBuyer && !isSeller) {
                throw new IllegalArgumentException("El usuario no es parte de esta transacción");
            }

            TransactionTokens tokens = getOrCreateTransactionTokens(id);
            if (isBuyer) {
                tokens.setBuyerToken(authToken);
            } else {
                tokens.setSellerToken(authToken);
            }

            String newStatus = dto.getStatus().toUpperCase();
            if (!newStatus.equals("ACCEPTED") && !newStatus.equals("REJECTED")) {
                throw new IllegalArgumentException("Status must be ACCEPTED or REJECTED");
            }

            if (newStatus.equals("REJECTED")) {
                System.out.println("Usuario " + userInfo.getId() + " rechaza la transacción ID: " + id);
                transaction.setStatus(Status.REJECTED);
            } else {
                if (isBuyer) {
                    if (transaction.isBuyerAccepted()) {
                        System.out.println("El comprador ya ha aceptado la transacción ID: " + id);
                        return mapToDto(transaction);
                    }
                    System.out.println("Comprador " + userInfo.getId() + " acepta la transacción ID: " + id);
                    if (dto.getProductRequestedId() != null) {
                        System.out.println("Validando producto solicitado ID: " + dto.getProductRequestedId());
                        ProductDto requestedProduct = productClient.getProduct(dto.getProductRequestedId());
                        if (requestedProduct == null) {
                            throw new EntityNotFoundException("Requested product not found: " + dto.getProductRequestedId());
                        }
                        if (!requestedProduct.getOwnerId().equals(String.valueOf(userInfo.getId()))) {
                            throw new IllegalArgumentException("Requested product doesn't belong to buyer: " + requestedProduct.getOwnerId() + " != " + userInfo.getId());
                        }
                        transaction.setProductRequestedId(dto.getProductRequestedId());
                    }
                    transaction.setBuyerId(userInfo.getId());
                    transaction.setBuyerAccepted(true);
                } else {
                    if (transaction.isSellerAccepted()) {
                        System.out.println("El vendedor ya ha aceptado la transacción ID: " + id);
                        return mapToDto(transaction);
                    }
                    System.out.println("Vendedor " + userInfo.getId() + " acepta la transacción ID: " + id);
                    transaction.setSellerAccepted(true);
                }

                if (transaction.isBuyerAccepted() && transaction.isSellerAccepted()) {
                    System.out.println("Ambos usuarios han aceptado la transacción ID: " + id + ". Procediendo con las transferencias.");

                    if (tokens.getBuyerToken() == null || tokens.getSellerToken() == null) {
                        throw new IllegalStateException("No se han capturado los tokens de ambos usuarios para la transacción ID: " + id);
                    }

                    transaction.setStatus(Status.COMPLETED);
                    transaction.setUpdatedAt(LocalDateTime.now());
                    transactionRepository.save(transaction);

                    try {
                        UserDto buyer = userClient.getUserInternal(transaction.getBuyerId());
                        UserDto seller = userClient.getUserInternal(transaction.getSellerId());

                        String content = "¡Gracias por usar Swapify!\n\n" +
                                "Tu intercambio se ha completado.\n" +
                                "Producto ofrecido: " + productClient.getProduct(transaction.getProductOfferedId()).getTitle() + " con id: "+ transaction.getProductOfferedId() + "\n" +
                                "Producto solicitado: " + productClient.getProduct(transaction.getProductRequestedId()).getTitle() + " con id: " + transaction.getProductRequestedId() +"\n" +
                                "Fecha: " + transaction.getUpdatedAt();

                        emailService.sendReceiptEmail(buyer.getUsermail(), "Recibo de intercambio", content);
                        emailService.sendReceiptEmail(seller.getUsermail(), "Recibo de intercambio", content);

                        System.out.println("[TransactionService] Correos de recibo enviados a ambas partes.");
                    } catch (Exception e) {
                        System.out.println("[TransactionService] Error al enviar correo de recibo: " + e.getMessage());
                        e.printStackTrace();
                    }

                    try {
                        if (transaction.getProductOfferedId() != null) {
                            System.out.println("Transfiriendo producto ofrecido ID: " + transaction.getProductOfferedId() + " de " + transaction.getSellerId() + " a " + transaction.getBuyerId());
                            ProductDto offeredProduct = productClient.getProduct(transaction.getProductOfferedId());
                            if (offeredProduct == null) {
                                throw new EntityNotFoundException("Offered product not found: " + transaction.getProductOfferedId());
                            }
                            if (!offeredProduct.getOwnerId().equals(String.valueOf(transaction.getSellerId()))) {
                                throw new IllegalArgumentException("Offered product doesn't belong to seller: " + offeredProduct.getOwnerId() + " != " + transaction.getSellerId());
                            }
                            productClient.transferProduct(
                                    transaction.getProductOfferedId(),
                                    transaction.getSellerId(),
                                    transaction.getBuyerId(),
                                    tokens.getSellerToken()
                            );
                        }

                        if (transaction.getProductRequestedId() != null) {
                            System.out.println("Transfiriendo producto solicitado ID: " + transaction.getProductRequestedId() + " de " + transaction.getBuyerId() + " a " + transaction.getSellerId());
                            ProductDto requestedProduct = productClient.getProduct(transaction.getProductRequestedId());
                            if (requestedProduct == null) {
                                throw new EntityNotFoundException("Requested product not found: " + transaction.getProductRequestedId());
                            }
                            if (!requestedProduct.getOwnerId().equals(String.valueOf(transaction.getBuyerId()))) {
                                throw new IllegalArgumentException("Requested product doesn't belong to buyer: " + requestedProduct.getOwnerId() + " != " + transaction.getBuyerId());
                            }
                            productClient.transferProduct(
                                    transaction.getProductRequestedId(),
                                    transaction.getBuyerId(),
                                    transaction.getSellerId(),
                                    tokens.getBuyerToken()
                            );
                        }

                        if (transaction.getCreditsOffered() != null && transaction.getCreditsOffered() > 0) {
                            System.out.println("Transfiriendo créditos ofrecidos: " + transaction.getCreditsOffered() + " de " + transaction.getSellerId() + " a " + transaction.getBuyerId());
                            userClient.transferCredits(
                                    transaction.getSellerId(),
                                    transaction.getBuyerId(),
                                    transaction.getCreditsOffered(),
                                    tokens.getSellerToken()
                            );
                        }

                        if (transaction.getCreditsRequested() != null && transaction.getCreditsRequested() > 0) {
                            System.out.println("Transfiriendo créditos solicitados: " + transaction.getCreditsRequested() + " de " + transaction.getBuyerId() + " a " + transaction.getSellerId());
                            userClient.transferCredits(
                                    transaction.getBuyerId(),
                                    transaction.getSellerId(),
                                    transaction.getCreditsRequested(),
                                    tokens.getBuyerToken()
                            );
                        }

                        System.out.println("Transacción ID: " + id + " completada exitosamente");
                    } catch (Exception e) {
                        transaction.setStatus(Status.PENDING);
                        transactionRepository.save(transaction);
                        System.err.println("Error al procesar las transferencias de la transacción ID: " + id + ", mensaje: " + e.getMessage());
                        throw new RuntimeException("Error al completar la transacción: " + e.getMessage(), e);
                    } finally {
                        removeTransactionTokens(id);
                    }
                } else {
                    System.out.println("Esperando la aceptación del otro usuario para la transacción ID: " + id);
                }
            }

            transaction.setUpdatedAt(LocalDateTime.now());
            Transaction updatedTransaction = transactionRepository.save(transaction);

            // ✅ CAMBIO PRINCIPAL - Notificar diferente según el estado
            System.out.println("[DEBUG] Transacción " + id + " - Estado: " + updatedTransaction.getStatus());
            System.out.println("[DEBUG] Notificando a comprador " + transaction.getBuyerId() + " y vendedor " + transaction.getSellerId());

            if (updatedTransaction.getStatus() == Status.COMPLETED) {
                // ✅ Para transacciones completadas, notificar a AMBOS usuarios
                System.out.println("[DEBUG] Enviando notificación de COMPLETADO a AMBOS usuarios");
                notificationService.notifyTransactionCompletedToBothUsers(
                        transaction.getBuyerId(),
                        transaction.getSellerId(),
                        id,
                        transaction.getConversationId()
                );
            } else {
                // Para otros estados, usar la lógica existente
                notificationService.notifyTransactionUpdate(
                        transaction.getBuyerId(),
                        transaction.getSellerId(),
                        id,
                        updatedTransaction.getStatus().toString()
                );
            }

            // Notificar al microservicio de chat usando el Feign Client
            Long conversationId = transaction.getConversationId();
            // Validar que el conversationId del DTO coincida con el de la transacción
            if (dto.getConversationId() != null && conversationId != null && !dto.getConversationId().equals(conversationId)) {
                System.err.println("[Backend] Inconsistencia: el conversationId del DTO (" + dto.getConversationId() +
                        ") no coincide con el de la transacción (" + conversationId + ")");
                throw new IllegalStateException("El conversationId proporcionado no coincide con el de la transacción");
            }

            if (conversationId != null) {
                try {
                    Map<String, Object> message = new HashMap<>();
                    message.put("id", System.currentTimeMillis());
                    message.put("conversationId", conversationId);
                    message.put("senderId", 0);

                    // ✅ CAMBIO PRINCIPAL - Usar mensajes amigables sin ID
                    String friendlyMessage;
                    if (updatedTransaction.getStatus() == Status.COMPLETED) {
                        friendlyMessage = "¡Transacción completada exitosamente!";
                    } else if (updatedTransaction.getStatus() == Status.PENDING) {
                        friendlyMessage = "Esperando confirmación de ambas partes...";
                    } else {
                        friendlyMessage = "Estado de transacción actualizado: " + updatedTransaction.getStatus();
                    }
                    message.put("content", friendlyMessage);

                    message.put("timestamp", LocalDateTime.now().toString());
                    message.put("type", "SYSTEM");

                    System.out.println("[Backend] Enviando notificación al microservicio de chat: " + message);
                    ResponseEntity<Void> response = chatClient.notifyTransactionUpdate(conversationId, message);
                    System.out.println("[Backend] Notificación enviada al microservicio de chat: " + response.getStatusCode());

                    // Si el envío al chat fue exitoso, notificar a ambos usuarios que el mensaje del sistema fue enviado
                    if (response.getStatusCode().is2xxSuccessful()) {
                        notificationService.notifySystemMessageSent(
                                transaction.getBuyerId(),
                                transaction.getSellerId(),
                                id,
                                conversationId
                        );
                        System.out.println("[Backend] Confirmación de mensaje del sistema enviada a usuarios");
                    }

                } catch (Exception e) {
                    System.err.println("[Backend] Error al notificar al microservicio de chat: " + e.getMessage());
                }
            } else {
                System.out.println("[Backend] No se encontró conversationId en la transacción, no se puede notificar al microservicio de chat");
            }

            return mapToDto(updatedTransaction);
        } finally {
            transaction.setProcessing(false);
            transactionRepository.save(transaction);
            if (transaction.getStatus() == Status.REJECTED) {
                removeTransactionTokens(id);
            }
        }
    }

    @Override
    public TransactionDto getTransaction(Long id, String authToken) {
        UserInfoDto userInfo = authClient.validateUserToken(authToken, null);
        if (userInfo == null) {
            throw new EntityNotFoundException("Token inválido o usuario no encontrado");
        }

        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Transaction not found: " + id));

        boolean isBuyer = userInfo.getId().equals(transaction.getBuyerId());
        boolean isSeller = userInfo.getId().equals(transaction.getSellerId());

        if (!isBuyer && !isSeller) {
            throw new IllegalArgumentException("El usuario no es parte de esta transacción");
        }

        return mapToDto(transaction);
    }

    @Override
    public List<TransactionDto> getTransactionsByUser(String authToken) {
        UserInfoDto userInfo = authClient.validateUserToken(authToken, null);
        if (userInfo == null) {
            throw new EntityNotFoundException("Token inválido o usuario no encontrado");
        }

        Long userId = userInfo.getId();
        List<Transaction> transactions = transactionRepository.findByBuyerIdOrSellerId(userId, userId);
        return transactions.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Scheduled(fixedRate = 3600000)
    public void cleanUpTransactionTokens() {
        System.out.println("Ejecutando limpieza de transactionTokensMap...");
        transactionTokensMap.entrySet().removeIf(entry -> {
            Long transactionId = entry.getKey();
            Transaction transaction = transactionRepository.findById(transactionId).orElse(null);
            if (transaction == null) {
                System.out.println("Eliminando tokens de la transacción " + transactionId + ": transacción no encontrada en la base de datos.");
                return true;
            }
            boolean shouldRemove = transaction.getStatus() == Status.PENDING
                    && transaction.getCreatedAt().isBefore(LocalDateTime.now().minusHours(1));
            if (shouldRemove) {
                System.out.println("Eliminando tokens de la transacción " + transactionId + ": está en estado PENDING y tiene más de 1 hora.");
            }
            return shouldRemove;
        });
        System.out.println("Limpieza de transactionTokensMap completada. Entradas restantes: " + transactionTokensMap.size());
    }

    private TransactionDto mapToDto(Transaction transaction) {
        TransactionDto dto = new TransactionDto();
        dto.setId(transaction.getId());
        dto.setSellerId(transaction.getSellerId());
        dto.setBuyerId(transaction.getBuyerId());
        dto.setProductOfferedId(transaction.getProductOfferedId());
        dto.setProductRequestedId(transaction.getProductRequestedId());
        dto.setCreditsOffered(transaction.getCreditsOffered());
        dto.setCreditsRequested(transaction.getCreditsRequested());
        dto.setStatus(transaction.getStatus());
        dto.setCreatedAt(transaction.getCreatedAt() != null ? transaction.getCreatedAt().format(formatter) : null);
        dto.setUpdatedAt(transaction.getUpdatedAt() != null ? transaction.getUpdatedAt().format(formatter) : null);
        dto.setBuyerAccepted(transaction.isBuyerAccepted());
        dto.setSellerAccepted(transaction.isSellerAccepted());
        return dto;
    }
}
