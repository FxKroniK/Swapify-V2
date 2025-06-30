package com.example.demo.Config;

import org.springframework.stereotype.Component;

// Componente auxiliar
@Component
public class TokenHolder {
    private String currentToken;

    public void setCurrentToken(String token) {
        this.currentToken = token;
    }

    public String getCurrentToken() {
        return this.currentToken;
    }
}
