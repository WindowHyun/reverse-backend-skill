package com.example.bank.transfer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class TransferEventsListener {

    private static final Logger log = LoggerFactory.getLogger(TransferEventsListener.class);

    @KafkaListener(topics = "transfer-events", groupId = "audit")
    public void onTransfer(String transferId) {
        log.info("audit: transfer {} completed", transferId);
    }
}
