package com.example.demo.clients;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "user-service", url = "http://localhost:8083/api") // Ajusta la URL
public interface UserClient {
    @PostMapping("/users/credits/transfer")
    void transferCredits(
            @RequestParam("fromUserId") Long fromUserId,
            @RequestParam("toUserId") Long toUserId,
            @RequestParam("amount") Integer amount,
            @RequestHeader("Authorization") String authToken
    );
}