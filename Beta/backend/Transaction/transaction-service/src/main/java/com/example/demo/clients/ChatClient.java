package com.example.demo.clients;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

@FeignClient(name = "chat-service", url = "${chat.service.url:http://localhost:8085}")
public interface ChatClient {

    @PostMapping("/api/negotiations/notify/{conversationId}")
    ResponseEntity<Void> notifyTransactionUpdate(
            @PathVariable("conversationId") Long conversationId,
            @RequestBody Map<String, Object> message);

    @PostMapping("/api/negotiations/notify/user/{userId}")
    ResponseEntity<String> sendNotificationToUser(
            @PathVariable("userId") Long userId,
            @RequestBody Map<String, Object> notification);
}
