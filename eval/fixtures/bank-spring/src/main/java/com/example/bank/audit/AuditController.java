package com.example.bank.audit;

import com.example.bank.transfer.Transfer;
import com.example.bank.transfer.TransferRepository;
import java.util.List;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/audit")
public class AuditController {

    private final TransferRepository transfers;

    public AuditController(TransferRepository transfers) {
        this.transfers = transfers;
    }

    @GetMapping("/export")
    @Secured("ROLE_ADMIN")
    public List<Transfer> export() {
        return transfers.findAll();
    }
}
