package com.example.bank.transfer;

import com.example.bank.account.Account;
import com.example.bank.account.AccountRepository;
import com.example.bank.security.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TransferService {

    private final AccountRepository accounts;
    private final TransferRepository transfers;
    private final KafkaTemplate<String, String> kafka;

    public TransferService(AccountRepository accounts, TransferRepository transfers, KafkaTemplate<String, String> kafka) {
        this.accounts = accounts;
        this.transfers = transfers;
        this.kafka = kafka;
    }

    @Transactional
    public Transfer create(TransferRequest req, UserPrincipal principal) {
        Account from = accounts.findById(req.fromAccountId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Account to = accounts.findById(req.toAccountId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!from.getOwnerId().equals(principal.id())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "not your account");
        }
        from.setBalance(from.getBalance().subtract(req.amount()));
        to.setBalance(to.getBalance().add(req.amount()));
        Transfer t = new Transfer();
        t.setFromAccountId(from.getId());
        t.setToAccountId(to.getId());
        t.setAmount(req.amount());
        t = transfers.save(t);
        kafka.send("transfer-events", String.valueOf(t.getId()));
        return t;
    }

    @Transactional
    public Transfer reverse(Long id) {
        Transfer t = transfers.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Account from = accounts.findById(t.getFromAccountId()).orElseThrow();
        Account to = accounts.findById(t.getToAccountId()).orElseThrow();
        from.setBalance(from.getBalance().add(t.getAmount()));
        to.setBalance(to.getBalance().subtract(t.getAmount()));
        t.setReversed(true);
        return transfers.save(t);
    }
}
