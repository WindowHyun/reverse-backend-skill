package com.example.bank.admin;

import com.example.bank.account.Account;
import com.example.bank.account.AccountRepository;
import com.example.bank.customer.Customer;
import com.example.bank.customer.CustomerRepository;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final CustomerRepository customers;
    private final AccountRepository accounts;

    public AdminController(CustomerRepository customers, AccountRepository accounts) {
        this.customers = customers;
        this.accounts = accounts;
    }

    @GetMapping("/customers")
    public List<Customer> allCustomers() {
        return customers.findAll();
    }

    @PostMapping("/accounts/{id}/freeze")
    public Account freeze(@PathVariable Long id) {
        Account a = accounts.findById(id).orElseThrow();
        a.setStatus("FROZEN");
        return accounts.save(a);
    }
}
