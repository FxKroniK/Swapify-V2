package com.example.demo.repositories;

import com.example.demo.entities.CreditHistory;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CreditHistoryRepository extends JpaRepository<CreditHistory, Long> {
    List<CreditHistory> findByUserId(Long userId);
}