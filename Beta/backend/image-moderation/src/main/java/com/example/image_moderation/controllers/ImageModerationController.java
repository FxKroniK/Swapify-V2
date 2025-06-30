package com.example.image_moderation.controllers;

import com.example.image_moderation.services.ImageModerationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/moderation")
public class ImageModerationController {

    @Autowired
    private ImageModerationService moderationService;

    @PostMapping("/check-upload")
    public ResponseEntity<String> checkImageFromUpload(@RequestParam("file") MultipartFile file) {
        boolean isSafe = moderationService.isImageSafeFromMultipartFile(file);
        return ResponseEntity.ok(isSafe ? "Imagen segura" : "Imagen inapropiada");
    }
}
