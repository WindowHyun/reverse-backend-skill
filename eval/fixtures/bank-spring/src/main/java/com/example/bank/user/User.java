package com.example.bank.user;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "users")
@Getter
@Setter
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true)
    private String email;
    @JsonIgnore
    private String passwordHash;
    @Enumerated(EnumType.STRING)
    private Role role = Role.USER;
}
