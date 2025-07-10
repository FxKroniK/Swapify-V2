package com.example.demo.services;

import com.example.demo.clients.AuthClient;
import com.example.demo.clients.ProductClient;
import com.example.demo.clients.TransactionClient;
import com.example.demo.config.IdGeneratorService;
import com.example.demo.dtos.*;
import com.example.demo.entities.*;
import com.example.demo.interfaces.NegotiationService;
import com.example.demo.repositories.ConversationRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
public class NegotiationServiceImpl implements NegotiationService {
    private final ConversationRepository conversationRepository;
    private final AuthClient authClient;
    private final ProductClient productClient;
    private final TransactionClient transactionClient;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;
    private final IdGeneratorService idGeneratorService;

    public NegotiationServiceImpl(
            ConversationRepository conversationRepository,
            AuthClient authClient,
            ProductClient productClient,
            TransactionClient transactionClient,
            SimpMessagingTemplate messagingTemplate,
            IdGeneratorService idGeneratorService) {
        this.conversationRepository = conversationRepository;
        this.authClient = authClient;
        this.productClient = productClient;
        this.transactionClient = transactionClient;
        this.messagingTemplate = messagingTemplate;
        this.objectMapper = new ObjectMapper();
        this.idGeneratorService = idGeneratorService;
    }

    @Override
    @Transactional
    public ConversationDto startNegotiation(String productId, String authToken) {
        UserInfoDto userInfo;
        try {
            userInfo = authClient.validateUserToken(authToken, null);
        } catch (Exception e) {
            throw new RuntimeException("Error al validar el token: " + e.getMessage(), e);
        }
        if (userInfo == null) throw new NoSuchElementException("Token inválido");

        ProductDto product;
        try {
            product = productClient.getProduct(productId);
        } catch (Exception e) {
            throw new RuntimeException("Error al obtener el producto: " + e.getMessage(), e);
        }
        if (product == null) throw new NoSuchElementException("Producto no encontrado");

        Long buyerId = userInfo.getId();
        Long sellerId = Long.valueOf(product.getOwnerId());

        if (buyerId.equals(sellerId)) {
            throw new IllegalArgumentException("No puedes iniciar una negociación para tu propio producto");
        }

        Optional<Conversation> existingConversation = conversationRepository
                .findByBuyerIdAndSellerIdAndProductIdAndStatus(
                        buyerId, sellerId, productId, ConversationStatus.ACTIVE);
        if (existingConversation.isPresent()) {
            return mapToDto(existingConversation.get());
        }

        existingConversation = conversationRepository
                .findByBuyerIdAndSellerIdAndStatus(buyerId, sellerId, ConversationStatus.ACTIVE);
        if (existingConversation.isPresent()) {
            return mapToDto(existingConversation.get());
        }

        Conversation conversation = new Conversation();
        conversation.setId(idGeneratorService.generateSequence("conversation_sequence"));
        conversation.setProductId(productId);
        conversation.setBuyerId(buyerId);
        conversation.setSellerId(sellerId);
        conversation.setStatus(ConversationStatus.ACTIVE);
        conversation.setCreatedAt(LocalDateTime.now());

        Conversation savedConversation = conversationRepository.save(conversation);
        return mapToDto(savedConversation);
    }

    @Override
    @Transactional
    public MessageDto sendMessage(Long conversationId, String content, String type, String authToken, String productId, Integer creditsOffered) {
        UserInfoDto userInfo;
        try {
            userInfo = authClient.validateUserToken(authToken, null);
        } catch (Exception e) {
            throw new RuntimeException("Error al validar el token: " + e.getMessage(), e);
        }
        if (userInfo == null) throw new NoSuchElementException("Token inválido");

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new NoSuchElementException("Conversación no encontrada"));

        Long senderId = userInfo.getId();
        if (!senderId.equals(conversation.getBuyerId()) && !senderId.equals(conversation.getSellerId())) {
            throw new IllegalArgumentException("Solo los participantes pueden enviar mensajes");
        }

        // Validar producto si se proporciona
        if (productId != null && !productId.isEmpty()) {
            ProductDto product = productClient.getProduct(productId);
            if (product == null || !product.getOwnerId().equals(senderId.toString())) {
                throw new IllegalArgumentException("El producto no existe o no pertenece al remitente");
            }
        }

        Message message = new Message();
        message.setId(idGeneratorService.generateSequence("message_sequence"));
        message.setSenderId(senderId);
        message.setContent(content);
        message.setTimestamp(LocalDateTime.now());
        message.setType(MessageType.valueOf(type.toUpperCase()));
        message.setProductId(productId);
        message.setCreditsOffered(creditsOffered != null ? creditsOffered : 0);

        conversation.getMessages().add(message);
        Conversation updatedConversation = conversationRepository.save(conversation);

        Message savedMessage = updatedConversation.getMessages().stream()
                .filter(m -> m.getId().equals(message.getId()))
                .findFirst()
                .orElse(message);

        MessageDto dto = mapToMessageDto(savedMessage, conversationId);
        System.out.println("Enviando mensaje al canal /topic/conversations/" + conversationId + ": " + dto.getContent());
        messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, dto);
        return dto;
    }

    @Override
    public ConversationDto getNegotiation(Long id, String authToken) {
        UserInfoDto userInfo;
        try {
            userInfo = authClient.validateUserToken(authToken, null);
        } catch (Exception e) {
            throw new RuntimeException("Error al validar el token: " + e.getMessage(), e);
        }
        if (userInfo == null) throw new NoSuchElementException("Token inválido");

        Conversation conversation = conversationRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Conversación no encontrada"));

        Long requesterId = userInfo.getId();
        if (!requesterId.equals(conversation.getBuyerId()) && !requesterId.equals(conversation.getSellerId())) {
            throw new IllegalArgumentException("Solo los participantes de la conversación pueden verla");
        }

        return mapToDto(conversation);
    }

    @Override
    @Transactional
    public ConversationDto sendProposal(Long id, List<String> productIdsOffered, Integer creditsOffered, String authToken) {
        UserInfoDto userInfo;
        try {
            userInfo = authClient.validateUserToken(authToken, null);
        } catch (Exception e) {
            throw new RuntimeException("Error al validar el token: " + e.getMessage(), e);
        }
        if (userInfo == null) throw new NoSuchElementException("Token inválido");

        Conversation conversation = conversationRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Conversación no encontrada"));

        Long senderId = userInfo.getId();
        if (!senderId.equals(conversation.getBuyerId()) && !senderId.equals(conversation.getSellerId())) {
            throw new IllegalArgumentException("Solo los participantes pueden enviar propuestas");
        }

        String productId = productIdsOffered != null && !productIdsOffered.isEmpty() ? productIdsOffered.get(0) : null;
        if (productId != null && !productId.isEmpty()) {
            ProductDto product = productClient.getProduct(productId);
            if (product == null || !product.getOwnerId().equals(senderId.toString())) {
                throw new IllegalArgumentException("El producto no existe o no pertenece al remitente");
            }
        }

        String content = "Propuesta: " + (productId != null ? "Producto ID " + productId : "") +
                (creditsOffered != null && creditsOffered > 0 ? ", " + creditsOffered + " créditos" : "");

        Message message = new Message();
        message.setId(idGeneratorService.generateSequence("message_sequence"));
        message.setSenderId(senderId);
        message.setContent(content);
        message.setTimestamp(LocalDateTime.now());
        message.setType(MessageType.PROPOSAL);
        message.setProductId(productId);
        message.setCreditsOffered(creditsOffered != null ? creditsOffered : 0);

        conversation.getMessages().add(message);
        Conversation updatedConversation = conversationRepository.save(conversation);

        MessageDto dto = mapToMessageDto(message, id);
        System.out.println("Enviando mensaje al canal /topic/conversations/" + id + ": " + dto.getContent());
        messagingTemplate.convertAndSend("/topic/conversations/" + id, dto);
        return mapToDto(updatedConversation);
    }

    @Override
    @Transactional
    public ConversationDto acceptProposal(Long id, String authToken) {
        throw new UnsupportedOperationException("acceptProposal is deprecated. Use transaction status updates.");
    }

    @Override
    public List<ConversationDto> getUserConversations(String authToken) {
        UserInfoDto userInfo;
        try {
            userInfo = authClient.validateUserToken(authToken, null);
        } catch (Exception e) {
            throw new RuntimeException("Error al validar el token: " + e.getMessage(), e);
        }
        if (userInfo == null) throw new NoSuchElementException("Token inválido");

        Long userId = userInfo.getId();
        List<Conversation> conversations = conversationRepository.findByBuyerIdOrSellerId(userId);
        return conversations.stream().map(this::mapToDto).toList();
    }

    @Override
    @Transactional
    public void deleteNegotiation(Long id, String authToken) {
        UserInfoDto userInfo;
        try {
            userInfo = authClient.validateUserToken(authToken, null);
        } catch (Exception e) {
            throw new RuntimeException("Error al validar el token: " + e.getMessage(), e);
        }
        if (userInfo == null) throw new NoSuchElementException("Token inválido");

        Conversation conversation = conversationRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Conversación no encontrada"));

        Long requesterId = userInfo.getId();
        if (!requesterId.equals(conversation.getBuyerId()) && !requesterId.equals(conversation.getSellerId())) {
            throw new IllegalArgumentException("Solo los participantes de la conversación pueden eliminarla");
        }

        conversationRepository.deleteById(id);
    }

    @Override
    @Transactional
    public TransactionDto createTransaction(Long conversationId, String authToken) {
        System.out.println("Token en NegotiationServiceImpl.createTransaction: " + authToken);

        UserInfoDto userInfo;
        try {
            userInfo = authClient.validateUserToken(authToken, null);
        } catch (Exception e) {
            throw new RuntimeException("Error al validar el token: " + e.getMessage(), e);
        }
        if (userInfo == null) throw new NoSuchElementException("Token inválido");

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new NoSuchElementException("Conversación no encontrada"));

        Long senderId = userInfo.getId();
        if (!senderId.equals(conversation.getBuyerId()) && !senderId.equals(conversation.getSellerId())) {
            throw new IllegalArgumentException("Solo los participantes pueden crear transacciones");
        }

        Message proposal = conversation.getMessages().stream()
                .filter(m -> m.getType() == MessageType.PROPOSAL)
                .reduce((first, second) -> second)
                .orElseThrow(() -> new IllegalStateException("No se encontró una propuesta original"));

        Message response = conversation.getMessages().stream()
                .filter(m -> m.getType() == MessageType.PROPOSAL_RESPONSE)
                .reduce((first, second) -> second)
                .orElseThrow(() -> new IllegalStateException("No se encontró una respuesta a la propuesta"));

        Long sellerId = conversation.getSellerId();
        Long buyerId = conversation.getBuyerId();

        CreateTransactionDto transactionDto = new CreateTransactionDto();
        transactionDto.setSellerId(sellerId);
        transactionDto.setBuyerId(buyerId);
        transactionDto.setConversationId(conversationId);
        if (proposal.getSenderId().equals(sellerId)) {
            transactionDto.setProductOfferedId(proposal.getProductId());
            transactionDto.setCreditsOffered(proposal.getCreditsOffered());
            transactionDto.setProductRequestedId(response.getProductId());
            transactionDto.setCreditsRequested(response.getCreditsOffered());
        } else {
            transactionDto.setProductOfferedId(response.getProductId());
            transactionDto.setCreditsOffered(response.getCreditsOffered());
            transactionDto.setProductRequestedId(proposal.getProductId());
            transactionDto.setCreditsRequested(proposal.getCreditsOffered());
        }

        TransactionDto createdTransaction = transactionClient.createTransaction(transactionDto, authToken);

        Message systemMessage = new Message();
        systemMessage.setId(idGeneratorService.generateSequence("message_sequence"));
        systemMessage.setContent("Transacción creada con ID: " + createdTransaction.getId());
        systemMessage.setTimestamp(LocalDateTime.now());
        systemMessage.setType(MessageType.SYSTEM);
        conversation.getMessages().add(systemMessage);
        conversationRepository.save(conversation);

        MessageDto systemMessageDto = mapToMessageDto(systemMessage, conversationId);
        System.out.println("Enviando mensaje al canal /topic/conversations/" + conversationId + ": " + systemMessageDto.getContent());
        messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, systemMessageDto);

        return createdTransaction;
    }

    @Override
    @Transactional
    public TransactionDto confirmTransaction(Long conversationId, Long transactionId, String authToken, boolean accept) {
        UserInfoDto userInfo;
        try {
            userInfo = authClient.validateUserToken(authToken, null);
        } catch (Exception e) {
            throw new RuntimeException("Error al validar el token: " + e.getMessage(), e);
        }
        if (userInfo == null) throw new NoSuchElementException("Token inválido");

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new NoSuchElementException("Conversación no encontrada"));

        Long userId = userInfo.getId();
        if (!userId.equals(conversation.getBuyerId()) && !userId.equals(conversation.getSellerId())) {
            throw new IllegalArgumentException("Solo los participantes pueden confirmar transacciones");
        }

        UpdateTransactionStatusDto statusDto = new UpdateTransactionStatusDto();
        statusDto.setStatus(accept ? "ACCEPTED" : "REJECTED");
        statusDto.setConversationId(conversationId); // Importante: añadir esto

        TransactionDto updatedTransaction = transactionClient.updateTransactionStatus(transactionId, statusDto, authToken);

        // ✅ ELIMINAR TODA LA LÓGICA DE CREACIÓN DE MENSAJES DEL SISTEMA
        // El backend ya se encarga de enviar el mensaje apropiado vía notifyTransactionUpdate

        System.out.println("[Chat] Transacción " + transactionId + " actualizada a estado: " + updatedTransaction.getStatus());

        return updatedTransaction;
    }

    @Override
    @Transactional
    public void notifyTransactionUpdate(Long conversationId, Map<String, Object> message) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new NoSuchElementException("Conversación no encontrada"));

        String content = (String) message.get("content");
        String type = (String) message.get("type");

        // **NUEVA LÓGICA** - Manejar confirmaciones de mensaje del sistema
        if ("SYSTEM_MESSAGE_CONFIRMATION".equals(type) && "SYSTEM_MESSAGE_SENT".equals(content)) {
            Long transactionId = message.get("transactionId") != null ?
                    Long.valueOf(message.get("transactionId").toString()) : null;
            Long buyerId = message.get("buyerId") != null ?
                    Long.valueOf(message.get("buyerId").toString()) : null;
            Long sellerId = message.get("sellerId") != null ?
                    Long.valueOf(message.get("sellerId").toString()) : null;

            if (transactionId != null && buyerId != null && sellerId != null) {
                // Crear notificación de confirmación para el comprador
                Map<String, Object> buyerNotification = Map.of(
                        "type", "SYSTEM_MESSAGE_SENT",
                        "message", "Mensaje del sistema enviado al chat",
                        "transactionId", transactionId,
                        "conversationId", conversationId,
                        "timestamp", LocalDateTime.now().toString()
                );

                // Crear notificación de confirmación para el vendedor
                Map<String, Object> sellerNotification = Map.of(
                        "type", "SYSTEM_MESSAGE_SENT",
                        "message", "Mensaje del sistema enviado al chat",
                        "transactionId", transactionId,
                        "conversationId", conversationId,
                        "timestamp", LocalDateTime.now().toString()
                );

                // Enviar notificaciones WebSocket a ambos usuarios
                System.out.println("Enviando confirmación SYSTEM_MESSAGE_SENT a usuario " + buyerId);
                messagingTemplate.convertAndSendToUser(
                        buyerId.toString(),
                        "/queue/notifications",
                        buyerNotification
                );

                System.out.println("Enviando confirmación SYSTEM_MESSAGE_SENT a usuario " + sellerId);
                messagingTemplate.convertAndSendToUser(
                        sellerId.toString(),
                        "/queue/notifications",
                        sellerNotification
                );

                System.out.println("[Chat] Confirmaciones SYSTEM_MESSAGE_SENT enviadas a usuarios " + buyerId + " y " + sellerId);
            }
            return; // No crear mensaje en la conversación para confirmaciones
        }

        // ✅ LÓGICA ACTUALIZADA - Solo aceptar mensajes amigables del backend
        if (content != null &&
                (content.equals("¡Transacción completada exitosamente!") ||
                        content.equals("Esperando confirmación de ambas partes...") ||
                        content.contains("Estado de transacción actualizado"))) {

            // Verificar que no existe ya un mensaje idéntico
            boolean alreadyExists = conversation.getMessages().stream()
                    .anyMatch(m -> m.getType() == MessageType.SYSTEM && content.equals(m.getContent()));

            if (alreadyExists) {
                System.out.println("[Chat] Mensaje de sistema ya existe, ignorando: " + content);
                return;
            }

            // Crear el mensaje del sistema
            Message systemMessage = new Message();
            systemMessage.setId(idGeneratorService.generateSequence("message_sequence"));
            systemMessage.setSenderId(0L);
            systemMessage.setContent(content);
            systemMessage.setTimestamp(LocalDateTime.now());
            systemMessage.setType(MessageType.SYSTEM);

            conversation.getMessages().add(systemMessage);
            conversationRepository.save(conversation);

            MessageDto systemMessageDto = mapToMessageDto(systemMessage, conversationId);
            System.out.println("[Chat] Enviando mensaje al canal /topic/conversations/" + conversationId + ": " + systemMessageDto.getContent());
            messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, systemMessageDto);

            System.out.println("[Chat] Mensaje WebSocket enviado: " + systemMessage.getContent());
        } else {
            System.out.println("[Chat] Mensaje ignorado en notifyTransactionUpdate: " + content);
        }
    }

    private ConversationDto mapToDto(Conversation c) {
        return new ConversationDto(
                c.getId(),
                c.getProductId(),
                c.getBuyerId(),
                c.getSellerId(),
                c.getMessages().stream().map(m -> mapToMessageDto(m, c.getId())).toList(),
                c.getStatus().toString(),
                c.getProposalProductIds(),
                c.getProposalCreditsOffered(),
                c.getCreatedAt().toString()
        );
    }

    private MessageDto mapToMessageDto(Message m, Long conversationId) {
        return new MessageDto(
                m.getId(),
                conversationId,
                m.getSenderId(),
                m.getContent(),
                m.getTimestamp().toString(),
                m.getType().toString(),
                m.getProductId(),
                m.getCreditsOffered()
        );
    }
}
