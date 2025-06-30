package com.example.demo.services;

import com.example.demo.dtos.CreditHistoryDto;
import com.example.demo.dtos.CreditRequestDto;
import com.example.demo.entities.CreditHistory;
import com.example.demo.entities.User;
import com.example.demo.interfaces.CreditHistoryService;
import com.example.demo.interfaces.UserService;
import com.example.demo.repositories.CreditHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CreditHistoryServiceImpl implements CreditHistoryService {

    @Autowired
    private CreditHistoryRepository creditHistoryRepository;

    @Autowired
    private UserService userService;

    @Override
    public void addCredits(Long userId, CreditRequestDto dto) {
        // Actualizar los créditos del usuario a través de UserService
        userService.updateCredits(userId, dto.getAmount());

        // Obtener el usuario para asociarlo al historial
        User user = new User();
        user.setId(userId); // Solo necesitamos el ID para la relación

        // Registrar la transacción en el historial
        CreditHistory history = new CreditHistory();
        history.setUser(user);
        history.setAmount(dto.getAmount());
        history.setReason(dto.getReason());
        history.setTimestamp(LocalDateTime.now());
        creditHistoryRepository.save(history);
    }

    @Override
    public List<CreditHistoryDto> getCreditHistory(Long userId) {
        // Verificar que el usuario existe
        userService.getUser(userId); // Esto lanza EntityNotFoundException si no existe
        return creditHistoryRepository.findByUserId(userId).stream()
                .map(h -> new CreditHistoryDto(h.getAmount(), h.getReason(), h.getTimestamp()))
                .collect(Collectors.toList());
    }
}