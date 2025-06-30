package com.example.demo.clients;

import com.example.demo.dtos.UserInfoDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "auth-service", url = "http://localhost:8081")
public interface AuthClient {

    @GetMapping("/auth/validate-user")
    UserInfoDto validateUserToken(
            @RequestHeader("Authorization") String token,
            @RequestParam(value = "userId", required = false) Long id
    );
}