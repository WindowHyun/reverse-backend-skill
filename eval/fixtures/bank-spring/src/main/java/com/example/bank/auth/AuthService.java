package com.example.bank.auth;

import com.example.bank.customer.Customer;
import com.example.bank.customer.CustomerRepository;
import com.example.bank.security.JwtService;
import com.example.bank.user.Role;
import com.example.bank.user.User;
import com.example.bank.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UserRepository users;
    private final CustomerRepository customers;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthService(UserRepository users, CustomerRepository customers, PasswordEncoder encoder, JwtService jwt) {
        this.users = users;
        this.customers = customers;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    public String login(LoginRequest req) {
        User user = users.findByEmail(req.email())
                .filter(u -> encoder.matches(req.password(), u.getPasswordHash()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "bad credentials"));
        return jwt.issue(user);
    }

    public User register(RegisterRequest req) {
        User user = new User();
        user.setEmail(req.email());
        user.setPasswordHash(encoder.encode(req.password()));
        user.setRole(req.role() != null ? req.role() : Role.USER);
        user = users.save(user);
        Customer c = new Customer();
        c.setName(req.name());
        c.setEmail(req.email());
        customers.save(c);
        return user;
    }
}
