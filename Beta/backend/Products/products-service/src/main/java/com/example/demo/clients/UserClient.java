package com.example.demo.clients;

import com.example.demo.dtos.UserInfoDto;
import com.example.demo.dtos.UserLocationDto;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class UserClient {

    private final WebClient webClient;

    private final String userServiceUrl = "http://localhost:8082";

    public UserClient(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.baseUrl(userServiceUrl).build();
    }

    public List<Long> getUserIdsByLocation(String location) {
        System.out.println("Solicitando usuarios por ubicación: " + location);
        List<UserInfoDto> users = webClient.get()
                .uri(userServiceUrl + "/api/users/get-by-location/{location}", location)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<UserInfoDto>>() {
                })
                .block();
        System.out.println("Usuarios recibidos: " + (users != null ? users.size() : "null"));
        return users != null ? users.stream()
                .map(UserInfoDto::getId)
                .collect(Collectors.toList()) : Collections.emptyList();
    }

    public List<UserLocationDto> getUsersWithLocation(String token) {
        String cleanToken = token.startsWith("Bearer ") ? token.replace("Bearer ", "") : token;
        System.out.println("Enviando solicitud a " + userServiceUrl + "/api/users/all-with-location con token: " + cleanToken);
        try {
            List<UserLocationDto> users = webClient.get()
                    .uri(userServiceUrl + "/api/users/all-with-location")
                    .header("Authorization", cleanToken)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<List<UserLocationDto>>() {
                    })
                    .doOnError(error -> System.out.println("Error al llamar a /api/users/all-with-location: " + error.getMessage()))
                    .block();
            System.out.println("Respuesta de /api/users/all-with-location: " + (users != null ? users.size() + " usuarios" : "null"));
            return users != null ? users : Collections.emptyList();
        } catch (Exception e) {
            System.out.println("Excepción en getUsersWithLocation: " + e.getMessage());
            e.printStackTrace();
            throw new IllegalStateException("Error al obtener usuarios con ubicación: " + e.getMessage());
        }
    }
}