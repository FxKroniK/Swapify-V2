package com.example.user_review.clients;

import com.example.user_review.DTOs.TransactionDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

@Service
public class TransactionClient {

    @Autowired
    private RestTemplate restTemplate;

    @Value("${transaction.service.url}")
    private String transactionServiceUrl;

    public boolean hasCompletedTransaction(Long userA, Long userB) {
        String url = transactionServiceUrl + "transactions/completed?userA=" + userA + "&userB=" + userB;
        System.out.println("Consultando URL: " + url); // <-- agrega esto

        try {
            ResponseEntity<CompletedTransactionResponse> response =
                    restTemplate.getForEntity(url, CompletedTransactionResponse.class);

            return response.getBody() != null && response.getBody().isHasCompletedTransaction();
        } catch (Exception e) {
            e.printStackTrace(); // Para ver si hay errores de conexión o mapeo
            return false;
        }
    }

    public List<TransactionDto> checkCompletedTransaction(Long userA, Long userB) {
        String url = transactionServiceUrl + "/transactions/completed/full?userA=" + userA + "&userB=" + userB;

        try {
            ResponseEntity<List<TransactionDto>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<TransactionDto>>() {}
            );
            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (Exception e) {
            System.out.println("[TransactionClient] Error al obtener transacciones completadas: " + e.getMessage());
            return Collections.emptyList();
        }
    }

    public List<String> getReceivedProductIds(Long userId) {
        String url = transactionServiceUrl + "/transactions/received-products/" + userId;

        try {
            ResponseEntity<List<String>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<String>>() {}
            );
            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (Exception e) {
            System.out.println("[TransactionClient] Error al obtener productos recibidos: " + e.getMessage());
            return Collections.emptyList();
        }
    }

    public List<TransactionDto> getCompletedTransactionsByUser(Long userId) {
        String url = "http://localhost:8084/transactions/completed/user/" + userId;
        // Reemplaza 808X por el puerto correcto del transaction-service

        ResponseEntity<TransactionDto[]> response = restTemplate.getForEntity(url, TransactionDto[].class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            return Arrays.asList(response.getBody());
        } else {
            return Collections.emptyList();
        }
    }

    public List<TransactionDto> getCompletedTransactionsByBuyer(Long buyerId) {
        String url = transactionServiceUrl + "/transactions/completed/by-buyer/" + buyerId;

        try {
            ResponseEntity<List<TransactionDto>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<TransactionDto>>() {}
            );
            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (Exception e) {
            System.out.println("[TransactionClient] Error al obtener transacciones por buyer: " + e.getMessage());
            return Collections.emptyList();
        }



    }





    // Clase interna o externa para mapear la respuesta
    public static class CompletedTransactionResponse {
        private boolean hasCompletedTransaction;
        private List<Long> transactionIds;

        public boolean isHasCompletedTransaction() {
            return hasCompletedTransaction;
        }

        public void setHasCompletedTransaction(boolean hasCompletedTransaction) {
            this.hasCompletedTransaction = hasCompletedTransaction;
        }

        public List<Long> getTransactionIds() {
            return transactionIds;
        }

        public void setTransactionIds(List<Long> transactionIds) {
            this.transactionIds = transactionIds;
        }
    }


}
