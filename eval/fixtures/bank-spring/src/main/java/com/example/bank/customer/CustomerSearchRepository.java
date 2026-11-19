package com.example.bank.customer;

import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class CustomerSearchRepository {

    private final JdbcTemplate jdbc;

    public CustomerSearchRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Map<String, Object>> search(String q) {
        return jdbc.queryForList("SELECT id, name, email FROM customer WHERE name LIKE '%" + q + "%'");
    }
}
