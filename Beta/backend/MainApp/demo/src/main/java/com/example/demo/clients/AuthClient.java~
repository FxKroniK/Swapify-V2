package com.example.demo.clients;

import com.example.demo.dtos.UserInfoDto;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
public class AuthClient {
    private final WebClient webClient;

    public AuthClient(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.baseUrl("http://localhost:8081").build();
    }

    public Mono<UserInfoDto> validateUserToken(String token, Long id) {
        return webClient.get()
                .uri("/auth/validate-user?userId=" + id)
                .header("Authorization", "Bearer " + token)
                .retrieve()
                .bodyToMono(UserInfoDto.class)
                .onErrorResume(e -> Mono.error(new RuntimeException("Error validando token: " + e.getMessage())));
    }
}

/// TODO: 18/03/2025 Feign Client en vez de WebClient;