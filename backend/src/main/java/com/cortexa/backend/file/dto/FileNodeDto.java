package com.cortexa.backend.file.dto;

import java.util.List;

public record FileNodeDto(
        String name,
        String path,
        boolean isDirectory,
        long size,
        List<FileNodeDto> children
) {}
