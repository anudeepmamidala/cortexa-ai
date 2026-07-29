package com.cortexa.backend.auth.dto;

public record AuthResponse(
        String accessToken,
        String tokenType
) {}