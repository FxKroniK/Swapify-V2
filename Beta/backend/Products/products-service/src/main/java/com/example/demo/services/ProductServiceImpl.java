package com.example.demo.services;

import com.example.demo.clients.AuthClient;
import com.example.demo.clients.UserClient;
import com.example.demo.dtos.CreateProductDto;
import com.example.demo.dtos.ProductDto;
import com.example.demo.dtos.UpdateProductDto;
import com.example.demo.dtos.UserInfoDto;
import com.example.demo.dtos.UserLocationDto;
import com.example.demo.entities.Product;
import com.example.demo.interfaces.ProductService;
import com.example.demo.repositories.FavoriteRepository;
import com.example.demo.repositories.ProductRepository;
import com.example.demo.utils.DistanceCalculator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
public class ProductServiceImpl implements ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private FavoriteRepository favoriteRepository;

    @Autowired
    private AuthClient authClient;

    private final UserClient userClient;

    public ProductServiceImpl(UserClient userClient, ProductRepository productRepository) {
        this.userClient = userClient;
        this.productRepository = productRepository;
    }

    @Override
    public ProductDto createProduct(CreateProductDto dto, Long ownerId) {
        System.out.println("Creando producto para ownerId: " + ownerId);
        if (ownerId == null || ownerId == 0) {
            throw new IllegalArgumentException("El ownerId no puede ser null o 0");
        }
        Product product = new Product();
        product.setOwnerId(ownerId);
        product.setTitle(dto.getTitle());
        product.setDescription(dto.getDescription());
        product.setCategory(dto.getCategory());
        product.setAttributes(dto.getAttributes());
        product.setPrice(dto.getPrice());
        product.setImageUrl(dto.getImageUrl());
        product.setImageId(dto.getImageId());

        product = productRepository.save(product);
        System.out.println("Producto guardado con id: " + product.getId());
        return mapToDto(product, null);
    }

    @Override
    public List<ProductDto> getAllProducts(String category, String keyword) {
        List<Product> products;
        if (category != null && keyword != null) {
            products = productRepository.findByCategory(category).stream()
                    .filter(p -> p.getTitle().toLowerCase().contains(keyword.toLowerCase()))
                    .collect(Collectors.toList());
        } else if (category != null) {
            products = productRepository.findByCategory(category);
        } else if (keyword != null) {
            products = productRepository.findByKeyword(keyword);
        } else {
            products = productRepository.findAll();
        }
        return products.stream().map(product -> mapToDto(product, null)).collect(Collectors.toList());
    }

    @Override
    public ProductDto getProductById(String id) {
        if (id == null || id.trim().isEmpty()) {
            throw new IllegalArgumentException("El id del producto no puede ser null o vacío");
        }
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Product not found with id: " + id));
        return mapToDto(product, null);
    }

    @Override
    public ProductDto updateProduct(String id, UpdateProductDto dto, Long ownerId) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Product not found with id: " + id));

        if (!product.getOwnerId().equals(ownerId)) {
            throw new IllegalArgumentException("You are not authorized to update this product");
        }

        if (dto.getTitle() != null) product.setTitle(dto.getTitle());
        if (dto.getDescription() != null) product.setDescription(dto.getDescription());
        if (dto.getAttributes() != null) product.setAttributes(dto.getAttributes());
        if (dto.getPrice() != null) product.setPrice(dto.getPrice());
        if (dto.getImageUrl() != null) product.setImageUrl(dto.getImageUrl());
        if (dto.getImageId() != null) product.setImageId(dto.getImageId());

        product = productRepository.save(product);
        return mapToDto(product, null);
    }

    @Override
    public void deleteProduct(String id, Long ownerId) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Product not found with id: " + id));

        if (!product.getOwnerId().equals(ownerId)) {
            throw new IllegalArgumentException("You are not authorized to delete this product");
        }

        productRepository.delete(product);
    }

    @Override
    public void transferProduct(String id, Long fromUserId, Long toUserId) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Product not found with id: " + id));

        if (!product.getOwnerId().equals(fromUserId)) {
            throw new IllegalArgumentException("The product does not belong to the specified fromUserId");
        }

        product.setOwnerId(toUserId);
        productRepository.save(product);
    }

    @Override
    public ProductDto getProductsByOwnerAndId(long ownerId, String productId) {
        Product product = productRepository.findByOwnerIdAndId(ownerId, productId);
        if (product != null) {
            return mapToDto(product, null);
        }
        return null;
    }

    @Override
    public List<ProductDto> findByOwnerId(long ownerId) {
        System.out.println("Buscando productos para ownerId: " + ownerId);
        if (ownerId == 0) {
            throw new IllegalArgumentException("El ownerId no puede ser 0");
        }
        List<Product> products = productRepository.findByOwnerId(ownerId);
        return products.stream().map(product -> mapToDto(product, null)).toList();
    }

    @Override
    public List<Product> findByKeyword(String keyword) {
        return productRepository.findByKeyword(keyword);
    }

    @Override
    public List<ProductDto> getProductsByLocation(String location) {
        List<Long> userIds = userClient.getUserIdsByLocation(location);
        List<Product> products = productRepository.findByOwnerIdIn(userIds);
        return products.stream().map(product -> mapToDto(product, null)).toList();
    }

    @Override
    public List<ProductDto> getProductsByCoordinates(Double latitude, Double longitude, Double radius, String category, String keyword, String token) {
        if (latitude == null || longitude == null) {
            throw new IllegalArgumentException("Latitude and longitude are required");
        }

        if (token == null) {
            throw new IllegalStateException("No token provided");
        }

        List<UserLocationDto> users = userClient.getUsersWithLocation(token);
        List<Long> userIdsInRange = users.stream()
                .filter(user -> user.getLatitude() != null && user.getLongitude() != null)
                .filter(user -> DistanceCalculator.calculateDistance(
                        latitude, longitude, user.getLatitude(), user.getLongitude()) <= radius)
                .map(UserLocationDto::getId)
                .collect(Collectors.toList());

        List<Product> products = productRepository.findByOwnerIdIn(userIdsInRange);

        if (category != null && !category.isEmpty()) {
            products = products.stream()
                    .filter(p -> p.getCategory() != null && p.getCategory().equalsIgnoreCase(category))
                    .collect(Collectors.toList());
        }
        if (keyword != null && !keyword.isEmpty()) {
            products = products.stream()
                    .filter(p -> p.getTitle() != null && p.getTitle().toLowerCase().contains(keyword.toLowerCase()))
                    .collect(Collectors.toList());
        }

        return products.stream().map(product -> mapToDto(product, token)).collect(Collectors.toList());
    }

    public ProductDto mapToDto(Product product, String token) {
        ProductDto dto = new ProductDto();
        dto.setId(product.getId());
        dto.setOwnerId(product.getOwnerId());
        dto.setTitle(product.getTitle());
        dto.setImageUrl(product.getImageUrl());
        dto.setDescription(product.getDescription());
        dto.setCategory(product.getCategory());
        dto.setStatus(product.getStatus());
        dto.setAttributes(product.getAttributes());
        dto.setPrice(product.getPrice());
        dto.setCreatedAt(product.getCreatedAt());
        dto.setImageId(product.getImageId());

        // Calcular isFavorite y favoriteCount
        if (token != null) {
            String cleanToken = token.startsWith("Bearer ") ? token.replace("Bearer ", "") : token;
            Long userId = getOwnerIdFromToken(cleanToken);
            dto.setIsFavorite(favoriteRepository.existsByUserIdAndProductId(userId, product.getId()));
            long favoriteCount = favoriteRepository.countByProductId(product.getId());
            dto.setFavoriteCount(favoriteCount);
        } else {
            dto.setIsFavorite(false);
            dto.setFavoriteCount(0);
        }

        // Obtener la ubicación del usuario propietario
        if (token != null) {
            List<UserLocationDto> users = userClient.getUsersWithLocation(token);
            UserLocationDto ownerLocation = users.stream()
                    .filter(user -> user.getId().equals(product.getOwnerId()))
                    .findFirst()
                    .orElse(null);

            if (ownerLocation != null) {
                dto.setLatitude(ownerLocation.getLatitude());
                dto.setLongitude(ownerLocation.getLongitude());
                dto.setOwnerLocation(ownerLocation.getLocationName() != null ? ownerLocation.getLocationName() : "Ubicación no disponible");
                dto.setOwnerUsername(ownerLocation.getUsername() != null ? ownerLocation.getUsername() : "Desconocido");
                dto.setOwnerRating(ownerLocation.getRating() != null ? ownerLocation.getRating() : 0.0);
                dto.setOwnerReviewCount(ownerLocation.getReviewCount() != null ? ownerLocation.getReviewCount() : 0);
            } else {
                dto.setLatitude(null);
                dto.setLongitude(null);
                dto.setOwnerLocation("Ubicación no disponible");
                dto.setOwnerUsername("Desconocido");
                dto.setOwnerRating(0.0);
                dto.setOwnerReviewCount(0);
            }
        } else {
            dto.setLatitude(null);
            dto.setLongitude(null);
            dto.setOwnerLocation("Ubicación no disponible");
            dto.setOwnerUsername("Desconocido");
            dto.setOwnerRating(0.0);
            dto.setOwnerReviewCount(0);
        }

        return dto;
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