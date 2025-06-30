package com.example.demo.dtos;

import lombok.Data;

@Data
public class FavoriteRequestDto {
    private String productId;

    public String getProductId() {
        return productId;
    }

    public void setProductId(String productId) {
        this.productId = productId;
    }
}