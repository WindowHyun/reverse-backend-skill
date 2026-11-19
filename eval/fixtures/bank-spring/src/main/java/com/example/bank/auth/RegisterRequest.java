package com.example.bank.auth;

import com.example.bank.user.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record RegisterRequest(@Email String email, @NotBlank String password, @NotBlank String name, Role role) {}
