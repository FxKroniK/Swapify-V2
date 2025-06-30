    package com.example.demo.clients;

    import com.example.demo.dtos.ProductDto;
    import org.springframework.cloud.openfeign.FeignClient;
    import org.springframework.web.bind.annotation.*;

    @FeignClient(name = "product-service", url = "${product.service.url}")
    public interface ProductClient {

        @GetMapping("/{id}")
        ProductDto getProduct(
                @PathVariable("id") String productId
                // ← Añadido
        );

        @PostMapping("/{id}/transfer")
        void transferProduct(
                @PathVariable("id") String productId,
                @RequestParam("fromUserId") Long fromUserId,
                @RequestParam("toUserId") Long toUserId,
                @RequestHeader("Authorization") String token
        );
    }