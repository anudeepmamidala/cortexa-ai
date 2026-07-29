package com.cortexa.backend.chat.dto;

import com.cortexa.backend.chat.enums.MessageRole;

import java.time.LocalDateTime;

public record MessageResponse(

        Long id,
        MessageRole role,
        String content,
        LocalDateTime createdAt

) {
}