package com.cortexa.backend.ai.dto;
import com.fasterxml.jackson.annotation.JsonProperty;

public record AiRequest(

    @JsonProperty("thread_id")
    String threadId,

    String message
) {}