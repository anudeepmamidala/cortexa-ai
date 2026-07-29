package com.cortexa.backend.chat.dto;

import java.time.LocalDateTime;

public record ChatResponse(

        Long id,
        String title,
        LocalDateTime createdAt,
        LocalDateTime updatedAt

) {
}