package com.example.bank.error;

import java.net.URI;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ProblemDetail handleStatus(ResponseStatusException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(ex.getStatusCode(), ex.getReason());
        pd.setType(URI.create("https://bank.example.com/problems/" + ex.getStatusCode().value()));
        return pd;
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleAny(Exception ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, ex.toString());
    }
}
