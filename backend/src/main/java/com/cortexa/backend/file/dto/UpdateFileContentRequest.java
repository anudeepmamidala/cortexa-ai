package com.cortexa.backend.file.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateFileContentRequest(
        @NotBlank(message = "Path cannot be blank")
        String path,
        String content
) {}
