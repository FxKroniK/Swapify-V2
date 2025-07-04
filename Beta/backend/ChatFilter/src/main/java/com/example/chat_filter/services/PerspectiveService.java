package com.example.chat_filter.services;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class PerspectiveService {
    private static final String API_KEY= "AIzaSyAPSVh_7Kq0411E2Frde6_ua1gWXheYof0";
    private static final String API_URL = "https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=" + API_KEY;
    private final RestTemplate restTemplate = new RestTemplate();

    public boolean isContentAppropriate(String content) {
        Map<String, Object> requestBody = Map.of(
                "comment", Map.of("text", content),
                "languages", List.of("es", "en"),
                "requestedAttributes", Map.of("TOXICITY", Map.of())
        );
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(API_URL, request, Map.class);
            Map attributes = (Map) ((Map) response.getBody().get("attributeScores")).get("TOXICITY");
            Map summaryScore = (Map) attributes.get("summaryScore");
            Double value = (Double) summaryScore.get("value");

            return value < 0.7; // Puedes ajustar este umbral
        } catch (Exception e) {
            e.printStackTrace();
            return true; // En caso de error, no bloqueamos el mensaje
        }
    }


}
