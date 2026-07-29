package com.cortexa.backend.chat.controller;

import com.cortexa.backend.chat.dto.ChatResponse;
import com.cortexa.backend.chat.dto.CreateChatRequest;
import com.cortexa.backend.chat.dto.MessageResponse;
import com.cortexa.backend.chat.dto.SendMessageRequest;
import com.cortexa.backend.chat.service.ChatService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping("/projects/{projectId}/chats")
    public ResponseEntity<ChatResponse> createChat(
            @PathVariable Long projectId,
            @Valid @RequestBody CreateChatRequest request,
            Authentication authentication
    ) {

        ChatResponse response = chatService.createChat(
                projectId,
                request,
                authentication.getName()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/projects/{projectId}/chats")
    public ResponseEntity<List<ChatResponse>> getChats(
            @PathVariable Long projectId,
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                chatService.getChats(projectId, authentication.getName())
        );
    }

    @DeleteMapping("/projects/{projectId}/chats/{chatId}")
    public ResponseEntity<Void> deleteChat(
            @PathVariable Long projectId,
            @PathVariable Long chatId,
            Authentication authentication
    ) {

        chatService.deleteChat(
                projectId,
                chatId,
                authentication.getName()
        );

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/chats/{chatId}/messages")
    public ResponseEntity<MessageResponse> sendMessage(
            @PathVariable Long chatId,
            @Valid @RequestBody SendMessageRequest request,
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                chatService.sendMessage(
                        chatId,
                        request,
                        authentication.getName()
                )
        );
    }

    @PostMapping(value = "/chats/{chatId}/messages/stream", produces = org.springframework.http.MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> sendMessageStream(
            @PathVariable Long chatId,
            @Valid @RequestBody SendMessageRequest request,
            Authentication authentication
    ) {
        return chatService.sendMessageStream(
                chatId,
                request,
                authentication.getName()
        );
    }

    @GetMapping("/chats/{chatId}/messages")
    public ResponseEntity<List<MessageResponse>> getMessages(
            @PathVariable Long chatId,
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                chatService.getMessages(
                        chatId,
                        authentication.getName()
                )
        );
    }
}