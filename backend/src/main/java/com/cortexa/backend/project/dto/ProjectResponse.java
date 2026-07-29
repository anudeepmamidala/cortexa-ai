package com.cortexa.backend.project.dto;

import java.time.LocalDateTime;

public record ProjectResponse(

        Long id,

        String name,

        String description,

        LocalDateTime createdAt,

        LocalDateTime updatedAt

) {
    
}