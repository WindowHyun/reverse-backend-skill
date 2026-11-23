package com.example.bank.legacy;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

// Old end-of-day batch, kept for reference
@Component
public class LegacyBatchRunner implements CommandLineRunner {

    @Override
    public void run(String... args) {
        System.out.println("legacy batch: nothing to do");
        // TODO: migrate statement generation to the new service
    }
}
