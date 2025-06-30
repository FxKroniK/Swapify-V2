package com.example.demo.repositories;

import com.example.demo.entities.Product;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.UUID;

public interface ProductRepository extends MongoRepository<Product, String> {

    List<Product> findByCategory(String category);

    @Query("{'$or': [ {'title': {$regex: ?0, $options: 'i'}}, {'description': {$regex: ?0, $options: 'i'}} ]}")
    List<Product> findByKeyword(String keyword);

    Product findByOwnerIdAndId(long ownerId, String productId);

    List<Product> findByOwnerId(long ownerId);
    List<Product> findByOwnerIdIn(List<Long> ownerIds);

}