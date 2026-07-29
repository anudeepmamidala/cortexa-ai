package com.cortexa.backend.chat.dto;

import jakarta.validation.constraints.NotBlank;

public record SendMessageRequest(

        @NotBlank(message = "Message cannot be empty")
        String content

) {
}