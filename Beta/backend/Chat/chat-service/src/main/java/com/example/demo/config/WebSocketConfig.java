package com.example.demo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Habilita un broker simple para enviar mensajes a los clientes suscritos
        config.enableSimpleBroker("/topic");
        // Define el prefijo para los destinos de las aplicaciones (mensajes enviados desde el cliente)
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Registra el endpoint WebSocket nativo
        registry.addEndpoint("/websocket").setAllowedOrigins("http://localhost:4200");

        // Opcional: Mantén un endpoint con SockJS para compatibilidad (si es necesario)
        registry.addEndpoint("/websocket-sockjs").setAllowedOrigins("http://localhost:4200").withSockJS();
    }
}