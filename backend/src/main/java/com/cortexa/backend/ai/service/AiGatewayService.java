package com.cortexa.backend.ai.service;

import com.cortexa.backend.ai.dto.AiRequest;
import com.cortexa.backend.ai.dto.AiResponse;
import com.cortexa.backend.ai.exception.AiServiceException;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;

@Service
public class AiGatewayService {

    private final WebClient webClient;

    public AiGatewayService(WebClient aiWebClient) {
        this.webClient = aiWebClient;
    }

    public AiResponse generateResponse(Long chatId, String message) {

        try {

            AiRequest request = new AiRequest(chatId.toString(), message);

            return webClient
                    .post()
                    .uri("/chat/")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(AiResponse.class)
                    .block();

        } catch (Exception e) {

            throw new AiServiceException(
                    "Failed to communicate with AI service",
                    e
            );

        }
    }

    public Flux<String> generateStreamResponse(Long chatId, String message) {
        try {
            AiRequest request = new AiRequest(chatId.toString(), message);

            return webClient
                    .post()
                    .uri("/chat/stream")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(request)
                    .accept(MediaType.TEXT_EVENT_STREAM)
                    .retrieve()
                    .bodyToFlux(String.class);

        } catch (Exception e) {
            throw new AiServiceException(
                    "Failed to establish streaming connection with AI service",
                    e
            );
        }
    }
}