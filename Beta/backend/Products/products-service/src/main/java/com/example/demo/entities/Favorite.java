package com.example.demo.entities;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.DBRef;

@Document(collection = "favorites") // Especifica la colección en MongoDB
@Data
public class Favorite {
    @Id
    private String id; // Cambiado a String, común en MongoDB para IDs

    @Field("user_id") // Mapea el campo a "user_id" en MongoDB
    private Long userId;

    @Field("product_id") // Mapea el campo a "product_id" en MongoDB
    private String productId;

    // Relación con Product (opcional, usando DBRef para referenciar el documento Product)
    @DBRef
    private Product product; // Referencia al documento Product en la colección "products"

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getProductId() {
        return productId;
    }

    public void setProductId(String productId) {
        this.productId = productId;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }
}