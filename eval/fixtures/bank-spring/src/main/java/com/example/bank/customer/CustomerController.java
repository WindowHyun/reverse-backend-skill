package com.example.bank.customer;

import com.example.bank.security.UserPrincipal;
import java.util.List;
import java.util.Map;
import org.springframework.beans.BeanUtils;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/customers")
public class CustomerController {

    private final CustomerRepository customers;
    private final CustomerSearchRepository search;

    public CustomerController(CustomerRepository customers, CustomerSearchRepository search) {
        this.customers = customers;
        this.search = search;
    }

    @GetMapping("/me")
    public Customer me(@AuthenticationPrincipal UserPrincipal principal) {
        return customers.findById(principal.id()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @GetMapping("/search")
    public List<Map<String, Object>> search(@RequestParam String q) {
        return search.search(q);
    }

    @GetMapping("/{id}")
    public Customer get(@PathVariable Long id) {
        return customers.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @PutMapping("/{id}")
    public Customer update(@PathVariable Long id, @RequestBody Customer body) {
        Customer existing = customers.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        BeanUtils.copyProperties(body, existing, "id");
        return customers.save(existing);
    }
}
