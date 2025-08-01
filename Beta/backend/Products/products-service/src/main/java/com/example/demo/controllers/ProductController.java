package com.example.demo.controllers;

import com.example.demo.clients.AuthClient;
import com.example.demo.dtos.CreateProductDto;
import com.example.demo.dtos.FavoriteRequestDto;
import com.example.demo.dtos.ProductDto;
import com.example.demo.dtos.UpdateProductDto;
import com.example.demo.dtos.UserInfoDto;
import com.example.demo.entities.Favorite;
import com.example.demo.entities.Product;
import com.example.demo.interfaces.ProductService;
import com.example.demo.repositories.FavoriteRepository;
import com.example.demo.repositories.ProductRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.stream.Collectors;

import static org.springframework.web.bind.annotation.RequestMethod.*;

@CrossOrigin(origins = "http://localhost:4200", methods = {GET, POST, PUT, PATCH, DELETE, OPTIONS})
@RestController
@RequestMapping("/products")
public class ProductController {
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private ProductService productService;
    @Autowired
    private FavoriteRepository favoriteRepository;
    @Autowired
    private AuthClient authClient;

    @PostMapping
    public ResponseEntity<ProductDto> createProduct(
            @Valid @RequestBody CreateProductDto dto,
            @RequestHeader("Authorization") String token) {
        Long ownerId = getOwnerIdFromToken(token);
        ProductDto product = productService.createProduct(dto, ownerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(product);
    }

    @GetMapping
    public ResponseEntity<List<ProductDto>> getAllProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String keyword) {
        List<ProductDto> products = productService.getAllProducts(category, keyword);
        return ResponseEntity.ok(products);
    }

    @PostMapping("/{id}/transfer")
    public ResponseEntity<Void> transferProduct(
            @PathVariable("id") String id,
            @RequestParam("fromUserId") Long fromUserId,
            @RequestParam("toUserId") Long toUserId,
            @RequestHeader("Authorization") String token) {
        try {
            Long requesterId = getOwnerIdFromToken(token);
            if (!requesterId.equals(fromUserId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            productService.transferProduct(id, fromUserId, toUserId);
            return ResponseEntity.ok().build();
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDto> getProductById(@PathVariable String id) {
        ProductDto product = productService.getProductById(id);
        return ResponseEntity.ok(product);
    }

    @GetMapping("/ownerId/{ownerId}")
    public ResponseEntity<List<ProductDto>> getProductByOwnerId(@PathVariable long ownerId) {
        if (ownerId == 0) {
            return ResponseEntity.badRequest().build();
        }
        List<ProductDto> products = productService.findByOwnerId(ownerId);
        return ResponseEntity.ok(products);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ProductDto> updateProduct(
            @PathVariable String id,
            @RequestBody UpdateProductDto dto,
            @RequestHeader("Authorization") String token) {
        Long ownerId = getOwnerIdFromToken(token);
        ProductDto updatedProduct = productService.updateProduct(id, dto, ownerId);
        return ResponseEntity.ok(updatedProduct);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(
            @PathVariable String id,
            @RequestHeader("Authorization") String token) {
        Long ownerId = getOwnerIdFromToken(token);
        productService.deleteProduct(id, ownerId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<Product>> searchByKeyword(@RequestParam String keyword) {
        int minimumLength = 4;
        if (keyword.length() < minimumLength) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
        List<Product> products = productService.findByKeyword(keyword);
        return new ResponseEntity<>(products, HttpStatus.OK);
    }

    @GetMapping("/by-location/{location}")
    public ResponseEntity<List<ProductDto>> getProductsByLocation(@PathVariable String location) {
        List<ProductDto> products = productService.getProductsByLocation(location);
        return ResponseEntity.ok(products);
    }

    @GetMapping("/by-coordinates")
    public ResponseEntity<List<ProductDto>> getProductsByCoordinates(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(defaultValue = "10") Double radius,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String keyword,
            @RequestHeader("Authorization") String token) {
        System.out.println("Recibida solicitud a /products/by-coordinates");
        System.out.println("Parámetros: latitude=" + latitude + ", longitude=" + longitude + ", radius=" + radius + ", category=" + category + ", keyword=" + keyword);
        System.out.println("Token recibido: " + token);
        try {
            String cleanToken = token.replace("Bearer ", "");
            System.out.println("Token limpio: " + cleanToken);
            UserInfoDto userInfo = authClient.validateUserToken(cleanToken).block();
            if (userInfo == null) {
                System.out.println("Token inválido o usuario no encontrado");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
            }
            System.out.println("Usuario validado: ID=" + userInfo.getId() + ", Email=" + userInfo.getUseremail());
            List<ProductDto> products = productService.getProductsByCoordinates(latitude, longitude, radius, category, keyword, token);
            System.out.println("Productos encontrados: " + (products != null ? products.size() : 0));
            return ResponseEntity.ok(products);
        } catch (IllegalArgumentException e) {
            System.out.println("Error de validación: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        } catch (IllegalStateException e) {
            System.out.println("Error de estado: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        } catch (Exception e) {
            System.out.println("Error inesperado en /products/by-coordinates: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/trending")
    public ResponseEntity<List<ProductDto>> getTrendingProducts() {
        List<FavoriteRepository.ProductFavoriteCount> trending = favoriteRepository.findProductsByFavoriteCount();
        List<ProductDto> products = trending.stream()
                .map(result -> {
                    String productId = result.getProductId();
                    if (productId == null || productId.trim().isEmpty()) return null;
                    try {
                        ProductDto dto = productService.getProductById(productId);
                        dto.setFavoriteCount(result.getCount());
                        return dto;
                    } catch (Exception e) {
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        return ResponseEntity.ok(products);
    }

    @PostMapping("/favorites")
    public ResponseEntity<Void> addFavorite(
            @RequestBody FavoriteRequestDto request,
            @RequestHeader("Authorization") String token) {
        Long userId = getOwnerIdFromToken(token);
        String productId = request.getProductId();
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NoSuchElementException("Product not found with id: " + productId));
        if (favoriteRepository.existsByUserIdAndProductId(userId, productId)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        favoriteRepository.saveFavorite(userId, productId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/favorites/{productId}")
    public ResponseEntity<Void> removeFavorite(
            @PathVariable String productId,
            @RequestHeader("Authorization") String token) {
        Long userId = getOwnerIdFromToken(token);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NoSuchElementException("Product not found with id: " + productId));
        favoriteRepository.deleteByUserIdAndProductId(userId, productId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/favorites")
    public ResponseEntity<List<ProductDto>> getUserFavorites(@RequestHeader("Authorization") String token) {
        Long userId = getOwnerIdFromToken(token);
        List<Favorite> favorites = favoriteRepository.findByUserId(userId);
        List<ProductDto> products = favorites.stream()
                .map(f -> {
                    try {
                        return productService.getProductById(f.getProductId());
                    } catch (NoSuchElementException e) {
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        return ResponseEntity.ok(products);
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<ProductDto>> getProductsByCategory(@PathVariable String category) {
        List<ProductDto> products = productService.getAllProducts(category, null);
        return ResponseEntity.ok(products);
    }

    private Long getOwnerIdFromToken(String token) {
        String bearerToken = token.replace("Bearer ", "");
        UserInfoDto userInfo = authClient.validateUserToken(bearerToken).block();
        if (userInfo == null || userInfo.getId() == null) {
            throw new IllegalArgumentException("Invalid token or user not found");
        }
        return userInfo.getId();
    }
}