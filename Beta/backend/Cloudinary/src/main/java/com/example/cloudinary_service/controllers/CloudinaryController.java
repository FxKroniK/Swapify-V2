package com.example.cloudinary_service.controllers;

import com.example.cloudinary_service.pojos.MultipartInputStreamFileResource;
import com.example.cloudinary_service.services.CloudinaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/cloudinary")
public class CloudinaryController {

    @Autowired
    CloudinaryService cloudinaryService;

    @Autowired
    private RestTemplate restTemplate;

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> upload(@RequestParam MultipartFile multipartFile) throws IOException {
        BufferedImage bi = ImageIO.read(multipartFile.getInputStream());
        if (bi == null) {
            return new ResponseEntity<>(Map.of("error", "No valid image"), HttpStatus.BAD_REQUEST);
        }

        if (!isImageSafe(multipartFile)) {
            return new ResponseEntity<>(Map.of("error", "La imagen fue considerada inapropiada"), HttpStatus.FORBIDDEN);
        }

        Map result = cloudinaryService.upload(multipartFile);

        return new ResponseEntity<>(
                Map.of(
                        "message", "Image uploaded successfully",
                        "imageUrl", (String) result.get("url"),
                        "publicId", (String) result.get("public_id")
                ),
                HttpStatus.OK
        );
    }


    @DeleteMapping("/delete/{publicId}")
    public ResponseEntity<String> delete(@PathVariable("publicId") String publicId) {
        try {
            cloudinaryService.delete(publicId);
            return new ResponseEntity<>("Image deleted from Cloudinary", HttpStatus.OK);
        } catch (IOException e) {
            return new ResponseEntity<>("Failed to delete image from Cloudinary", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public boolean isImageSafe(MultipartFile multipartFile) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new MultipartInputStreamFileResource(multipartFile.getInputStream(), multipartFile.getOriginalFilename()));

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = new RestTemplate().postForEntity(
                    "http://localhost:8090/moderation/check-upload",
                    requestEntity,
                    String.class
            );

            return response.getBody().contains("segura");

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }



}
