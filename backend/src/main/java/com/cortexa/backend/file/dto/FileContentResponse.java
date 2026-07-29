package com.cortexa.backend.file.dto;

public record FileContentResponse(
        String path,
        String content
) {}
