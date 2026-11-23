package com.example.bank.account;

import com.example.bank.security.UserPrincipal;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/accounts")
public class AccountController {

    private final AccountRepository accounts;

    public AccountController(AccountRepository accounts) {
        this.accounts = accounts;
    }

    @GetMapping
    public List<Account> mine(@AuthenticationPrincipal UserPrincipal principal) {
        return accounts.findByOwnerId(principal.id());
    }

    @GetMapping("/{id}")
    public Account get(@PathVariable Long id) {
        return accounts.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @GetMapping("/{id}/statement")
    @PreAuthorize("@accessChecker.canView(#id, authentication)")
    public Map<String, Object> statement(@PathVariable Long id) {
        Account a = accounts.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return Map.of("accountId", a.getId(), "balance", a.getBalance());
    }
}
