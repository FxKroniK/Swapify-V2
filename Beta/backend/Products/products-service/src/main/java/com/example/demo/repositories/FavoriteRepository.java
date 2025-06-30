package com.example.demo.repositories;

import com.example.demo.entities.Favorite;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FavoriteRepository extends MongoRepository<Favorite, String> {
    List<Favorite> findByUserId(Long userId);

    boolean existsByUserIdAndProductId(Long userId, String productId);

    void deleteByUserIdAndProductId(Long userId, String productId);

    @Query(value = "{ 'product_id': ?0 }", count = true)
    long countByProductId(String productId);

    @Aggregation(pipeline = {
            "{ $group: { _id: '$product_id', count: { $sum: 1 } } }",
            "{ $sort: { count: -1 } }",
            "{ $limit: 10 }"
    })
    List<ProductFavoriteCount> findProductsByFavoriteCount();

    default void saveFavorite(Long userId, String productId) {
        Favorite favorite = new Favorite();
        favorite.setUserId(userId);
        favorite.setProductId(productId);
        save(favorite);
    }

    interface ProductFavoriteCount {
        String getProductId(); // Cambiado de getId a getProductId para claridad
        long getCount();
    }
}