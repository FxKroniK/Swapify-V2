package com.example.user_review.clients;

import com.example.user_review.DTOs.ProductDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;

@Component
public class ProductClient {

    private final RestTemplate restTemplate;
    private final String baseUrl;

    public ProductClient(RestTemplate restTemplate,
                         @Value("${product.service.url}") String baseUrl) {
        this.restTemplate = restTemplate;
        this.baseUrl = baseUrl;
    }

    public ProductDto getProductById(String productId) {
        try {
            return restTemplate.getForObject(baseUrl + "/products/" + productId, ProductDto.class);
        } catch (HttpClientErrorException.NotFound e) {
            return null; // producto no encontrado
        } catch (Exception e) {
            e.printStackTrace(); // loggear si quieres
            return null;
        }
    }
}
