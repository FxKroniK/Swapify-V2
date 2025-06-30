package com.example.demo.dtos;

import lombok.Data;

@Data
public class UserDto {
    private Long id;
    private String usermail;
    private int credits;
    private String nickname;

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public UserDto() {
    }

    public UserDto(Long id, String usermail, String nickname,int credits) {
        this.id = id;
        this.usermail = usermail;
        this.nickname = nickname;
        this.credits = credits;
    }


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsermail() {
        return usermail;
    }

    public void setUsermail(String usermail) {
        this.usermail = usermail;
    }

    public int getCredits() {
        return credits;
    }

    public void setCredits(int credits) {
        this.credits = credits;
    }


}