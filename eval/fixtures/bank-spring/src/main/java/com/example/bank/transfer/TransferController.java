package com.example.bank.transfer;

import com.example.bank.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/transfers")
public class TransferController {

    private final TransferService service;

    public TransferController(TransferService service) {
        this.service = service;
    }

    @PostMapping
    public Transfer create(@Valid @RequestBody TransferRequest req, @AuthenticationPrincipal UserPrincipal principal) {
        return service.create(req, principal);
    }

    @PostMapping("/{id}/reverse")
    @PreAuthorize("hasRole('ADMIN')")
    public Transfer reverse(@PathVariable Long id) {
        return service.reverse(id);
    }
}
