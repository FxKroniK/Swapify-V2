package com.example.demo.Config;

import feign.RequestInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

@Configuration
public class FeignConfig {

    @Bean
    public RequestInterceptor authRequestInterceptor(TokenHolder tokenHolder) {
        return template -> {
            String token = tokenHolder.getCurrentToken();
            if (token != null && !token.isEmpty()) {
                template.header("Authorization", "Bearer " + token);
            }
        };
    }
}

