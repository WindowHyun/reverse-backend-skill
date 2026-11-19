package com.example.bank.account;

import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class Account {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long ownerId;
    private BigDecimal balance = BigDecimal.ZERO;
    private String status = "ACTIVE";
}
