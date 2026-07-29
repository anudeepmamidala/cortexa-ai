package com.cortexa.backend.file.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateFileRequest(
        @NotBlank(message = "Path cannot be blank")
        String path,
        boolean isDirectory
) {}
