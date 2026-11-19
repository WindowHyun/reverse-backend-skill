package com.example.bank.job;

import com.example.bank.account.Account;
import com.example.bank.account.AccountRepository;
import java.math.BigDecimal;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class InterestJob {

    private final AccountRepository accounts;

    public InterestJob(AccountRepository accounts) {
        this.accounts = accounts;
    }

    @Scheduled(cron = "0 0 2 * * *")
    public void accrue() {
        for (Account a : accounts.findAll()) {
            a.setBalance(a.getBalance().multiply(new BigDecimal("1.0001")));
            accounts.save(a);
        }
    }
}
