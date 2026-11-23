package com.example.bank.security;

import com.example.bank.account.AccountRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component("accessChecker")
public class AccessChecker {

    private final AccountRepository accounts;

    public AccessChecker(AccountRepository accounts) {
        this.accounts = accounts;
    }

    public boolean canView(Long accountId, Authentication auth) {
        UserPrincipal p = (UserPrincipal) auth.getPrincipal();
        return accounts.findById(accountId).map(a -> a.getOwnerId().equals(p.id())).orElse(false);
    }
}
