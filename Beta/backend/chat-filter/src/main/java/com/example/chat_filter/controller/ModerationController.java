package com.example.chat_filter.controller;

import com.example.chat_filter.services.PerspectiveService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/moderation")
public class ModerationController {


    private final PerspectiveService perspectiveService;

    public ModerationController(PerspectiveService perspectiveService) {
        System.out.println("🚀 ModerationController cargado");
        this.perspectiveService = perspectiveService;
    }

    @PostMapping("/check")
    public ResponseEntity<Boolean> checkMessage(@RequestBody Map<String, String> request) {
        String content = request.get("content");
        boolean result = perspectiveService.isContentAppropriate(content);
        return ResponseEntity.ok(result);
    }

}

