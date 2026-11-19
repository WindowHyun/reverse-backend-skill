package com.example.bank.customer;

import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class Customer {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String email;
    private String ssn;
    private String tier = "STANDARD";
    private BigDecimal creditLimit = BigDecimal.ZERO;
}
