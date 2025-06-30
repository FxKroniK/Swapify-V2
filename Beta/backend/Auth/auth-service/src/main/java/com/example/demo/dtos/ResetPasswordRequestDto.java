package com.example.demo.dtos;

import lombok.Data;

@Data
public class ResetPasswordRequestDto {
 private  String useremail;

 public ResetPasswordRequestDto(String useremail) {
  this.useremail = useremail;
 }

 public ResetPasswordRequestDto() {}
}
