    package com.example.demo.controllers;

    import com.example.demo.clients.AuthClient;
    import com.example.demo.clients.UserClient;
    import com.example.demo.dtos.*;
    import com.example.demo.entities.Status;
    import com.example.demo.entities.Transaction;
    import com.example.demo.repositories.TransactionRepository;
    import com.example.demo.services.EmailService;
    import com.example.demo.services.TransactionServiceImpl;
    import jakarta.persistence.EntityNotFoundException;
    import org.springframework.beans.factory.annotation.Autowired;
    import org.springframework.http.HttpStatus;
    import org.springframework.http.ResponseEntity;
    import org.springframework.web.bind.annotation.*;

    import java.util.List;
    import java.util.stream.Collectors;

    @CrossOrigin(origins = "http://localhost:4200")
    @RestController
    @RequestMapping("/transactions")
    public class TransactionController {

        private final TransactionServiceImpl transactionService;
        private final AuthClient authClient;
        private final UserClient userClient;
        @Autowired
        private TransactionRepository transactionRepository;
        @Autowired
        private EmailService emailService;

        public TransactionController(
                TransactionServiceImpl transactionService,
                AuthClient authClient,
                UserClient userClient) {
            this.transactionService = transactionService;
            this.authClient = authClient;
            this.userClient = userClient;
        }

        @PostMapping
        public ResponseEntity<TransactionDto> createTransaction(
                @RequestBody CreateTransactionDto dto,
                @RequestHeader("Authorization") String token) {

            String cleanToken = token.replace("Bearer ", "").trim();
            UserInfoDto userInfo = authClient.validateUserToken("Bearer " + cleanToken, null);

            if (userInfo == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            TransactionDto transaction = transactionService.createTransaction(dto, "Bearer " + cleanToken);
            return ResponseEntity.status(HttpStatus.CREATED).body(transaction);
        }

        @PutMapping("/{id}/status")
        public ResponseEntity<TransactionDto> updateTransactionStatus(
                @PathVariable("id") Long id,
                @RequestBody UpdateTransactionStatusDto dto,
                @RequestHeader("Authorization") String token) {
            try {
                String cleanToken = token.replace("Bearer ", "").trim();
                System.out.println("[Controller] Token limpio: " + cleanToken);

                UserInfoDto userInfo = authClient.validateUserToken("Bearer " + cleanToken, null);
                if (userInfo == null) {
                    System.out.println("[Controller] Usuario no autorizado");
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
                }

                System.out.println("[Controller] Usuario validado: " + userInfo.getEmail());

                TransactionDto updatedTransaction = transactionService.updateTransactionStatus(
                        id,
                        dto,
                        "Bearer " + cleanToken
                );

                System.out.println("[Controller] Transacción actualizada con status: " + dto.getStatus());

                return ResponseEntity.ok(updatedTransaction);

            } catch (Exception e) {
                System.out.println("[Controller] Error al actualizar transacción: " + e.getMessage());
                e.printStackTrace(); // Más útil que solo el mensaje
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        }


        @GetMapping("/{id}")
        public ResponseEntity<TransactionDto> getTransaction(
                @PathVariable("id") Long id,
                @RequestHeader("Authorization") String token) {
            try {
                String cleanToken = token.replace("Bearer ", "").trim();
                UserInfoDto userInfo = authClient.validateUserToken("Bearer " + cleanToken, null);

                if (userInfo == null) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
                }

                TransactionDto transaction = transactionService.getTransaction(id, "Bearer " + cleanToken);
                return ResponseEntity.ok(transaction);

            } catch (EntityNotFoundException e) {
                System.out.println("Error: Transacción no encontrada: " + e.getMessage());
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            } catch (Exception e) {
                System.out.println("Error: " + e.getMessage());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        }

        @GetMapping("/completed")
        public ResponseEntity<CompletedTransactionResponseDTO> checkCompletedTransaction(
                @RequestParam Long userA,
                @RequestParam Long userB) {

            List<Transaction> transactions =
                    transactionRepository.findCompletedTransactionsBetweenUsers(userA, userB);

            boolean hasCompleted = !transactions.isEmpty();
            List<Long> transactionIds = transactions.stream()
                    .map(Transaction::getId)
                    .collect(Collectors.toList());

            CompletedTransactionResponseDTO response =
                    new CompletedTransactionResponseDTO(hasCompleted, transactionIds);

            return ResponseEntity.ok(response);
        }

        @GetMapping("/completed/full")
        public ResponseEntity<List<TransactionDto>> getCompletedTransactionsBetweenUsers(
                @RequestParam Long userA,
                @RequestParam Long userB) {

            List<Transaction> transactions =
                    transactionRepository.findCompletedTransactionsBetweenUsers(userA, userB);

            List<TransactionDto> response = transactions.stream()
                    .map(this::toDto) // Usamos la función de arriba
                    .collect(Collectors.toList());

            return ResponseEntity.ok(response);
        }


        @GetMapping("/transactions/received-products/{userId}")
        public List<String> getReceivedProductIds(@PathVariable Long userId) {
            List<Transaction> completed = transactionRepository.findByBuyerIdAndStatus(userId, Status.COMPLETED);
            return completed.stream()
                    .map(Transaction::getProductOfferedId)
                    .distinct()
                    .collect(Collectors.toList());
        }

        @GetMapping("/completed/by-buyer/{buyerId}")
        public ResponseEntity<List<TransactionDto>> getCompletedTransactionsByBuyer(@PathVariable Long buyerId) {
            List<Transaction> transactions = transactionRepository.findByBuyerIdAndStatus(buyerId, Status.COMPLETED);
            List<TransactionDto> dtos = transactions.stream()
                    .map(this::toDto)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(dtos);
        }

        @GetMapping("/completed/user/{userId}")
        public ResponseEntity<List<TransactionDto>> getCompletedTransactionsByUser(@PathVariable Long userId) {
            List<Transaction> transactions = transactionRepository.findByBuyerIdOrSellerIdAndStatus(userId, userId, Status.COMPLETED);
            List<TransactionDto> dtos = transactions.stream()
                    .map(this::toDto)
                    .toList();

            return ResponseEntity.ok(dtos);
        }


        public TransactionDto toDto(Transaction t) {
            TransactionDto dto = new TransactionDto();
            dto.setId(t.getId());
            dto.setBuyerId(t.getBuyerId());
            dto.setSellerId(t.getSellerId());
            dto.setProductOfferedId(t.getProductOfferedId());
            dto.setProductRequestedId(t.getProductRequestedId());
            dto.setCreditsOffered(t.getCreditsOffered());
            dto.setCreditsRequested(t.getCreditsRequested());
            dto.setStatus(t.getStatus());
            dto.setCreatedAt(t.getCreatedAt().toString());
            dto.setUpdatedAt(t.getUpdatedAt().toString());
            dto.setBuyerAccepted(t.isBuyerAccepted());
            dto.setSellerAccepted(t.isSellerAccepted());
            return dto;
        }

    }