package com.example.cloudinary_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class 	CloudinaryServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(CloudinaryServiceApplication.class, args);
		System.out.println(">>>> Cloudinary Service is UP <<<<");
	}

}
