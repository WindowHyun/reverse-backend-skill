package com.example.bank.export;

import com.example.bank.customer.Customer;
import com.example.bank.customer.CustomerRepository;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/export")
public class PublicExportController {

    private final CustomerRepository customers;

    public PublicExportController(CustomerRepository customers) {
        this.customers = customers;
    }

    // used by the partner reconciliation job
    @GetMapping("/customers")
    public List<Customer> customers() {
        return customers.findAll();
    }
}
