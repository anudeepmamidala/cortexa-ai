package com.cortexa.backend.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateProjectRequest(

        @NotBlank(message = "Project name is required")
        @Size(max = 100, message = "Project name cannot exceed 100 characters")
        String name,

        @Size(max = 1000, message = "Description cannot exceed 1000 characters")
        String description

) {}