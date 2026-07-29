package com.cortexa.backend.chat.service;

import com.cortexa.backend.common.exception.ResourceNotFoundException;
import com.cortexa.backend.user.entity.User;
import com.cortexa.backend.user.repository.UserRepository;
import com.cortexa.backend.chat.dto.*;
import com.cortexa.backend.chat.entity.ChatMessage;
import com.cortexa.backend.chat.entity.ChatSession;
import com.cortexa.backend.chat.enums.MessageRole;
import com.cortexa.backend.chat.repository.ChatMessageRepository;
import com.cortexa.backend.chat.repository.ChatSessionRepository;
import com.cortexa.backend.project.entity.Project;
import com.cortexa.backend.project.repository.ProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import reactor.core.publisher.Flux;

import com.cortexa.backend.ai.dto.AiResponse;
import com.cortexa.backend.ai.service.AiGatewayService;

import java.util.List;

@Service
public class ChatService {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final AiGatewayService aiGatewayService;
    private final TransactionTemplate transactionTemplate;

    public ChatService(ChatSessionRepository chatSessionRepository,
                       ChatMessageRepository chatMessageRepository,
                       ProjectRepository projectRepository,
                       UserRepository userRepository,
                       AiGatewayService aiGatewayService,
                       PlatformTransactionManager transactionManager) {

        this.chatSessionRepository = chatSessionRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.aiGatewayService = aiGatewayService;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }

    @Transactional
    public ChatResponse createChat(Long projectId,
                                   CreateChatRequest request,
                                   String email) {

        User user = getUser(email);

        Project project = projectRepository.findByIdAndOwner(projectId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found or access denied"));

        ChatSession session = new ChatSession(request.title(), project);
        session = chatSessionRepository.save(session);

        return mapToChatResponse(session);
    }

    @Transactional(readOnly = true)
    public List<ChatResponse> getChats(Long projectId,
                                       String email) {

        User user = getUser(email);

        Project project = projectRepository.findByIdAndOwner(projectId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found or access denied"));

        return chatSessionRepository.findAllByProject(project)
                .stream()
                .map(this::mapToChatResponse)
                .toList();
    }

    @Transactional
    public void deleteChat(Long projectId,
                           Long chatId,
                           String email) {

        User user = getUser(email);

        Project project = projectRepository.findByIdAndOwner(projectId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found or access denied"));

        ChatSession session = chatSessionRepository
                .findByIdAndProject(chatId, project)
                .orElseThrow(() -> new ResourceNotFoundException("ChatSession", "id", chatId));

        chatSessionRepository.delete(session);
    }

    @Transactional
    public MessageResponse sendMessage(Long chatId,
                                       SendMessageRequest request,
                                       String email) {

        User user = getUser(email);

        ChatSession session = chatSessionRepository
                .findByIdAndProjectOwner(chatId, user)
                .orElseThrow(() ->
                        new ResourceNotFoundException("ChatSession", "id", chatId));

        // Save USER message
        ChatMessage userMessage = new ChatMessage(
                MessageRole.USER,
                request.content(),
                session
        );

        chatMessageRepository.save(userMessage);

        // Call AI service
        AiResponse aiResponse = aiGatewayService.generateResponse(
                session.getId(),
                request.content()
        );

        // Save ASSISTANT message
        ChatMessage assistantMessage = new ChatMessage(
                MessageRole.ASSISTANT,
                aiResponse.response(),
                session
        );

        assistantMessage = chatMessageRepository.save(assistantMessage);

        return mapToMessageResponse(assistantMessage);
    }

    @Transactional
    public Flux<String> sendMessageStream(Long chatId,
                                           SendMessageRequest request,
                                           String email) {

        User user = getUser(email);

        ChatSession session = chatSessionRepository
                .findByIdAndProjectOwner(chatId, user)
                .orElseThrow(() ->
                        new ResourceNotFoundException("ChatSession", "id", chatId));

        // Save USER message
        ChatMessage userMessage = new ChatMessage(
                MessageRole.USER,
                request.content(),
                session
        );

        chatMessageRepository.save(userMessage);

        StringBuilder fullResponse = new StringBuilder();
        Long sessionId = session.getId();

        return aiGatewayService.generateStreamResponse(
                session.getId(),
                request.content()
        ).doOnNext(chunk -> {
            if (chunk != null) {
                fullResponse.append(chunk).append("\n");
            }
        }).doOnComplete(() -> {
            try {
                String rawStr = fullResponse.toString();
                StringBuilder cleanText = new StringBuilder();

                for (String line : rawStr.split("\n")) {
                    String trimmed = line.trim();
                    if (trimmed.startsWith("data:")) {
                        trimmed = trimmed.substring(5).trim();
                    }
                    if (trimmed.isEmpty()) continue;

                    if (trimmed.contains("\"content\":")) {
                        try {
                            int idx = trimmed.indexOf("\"content\":");
                            String sub = trimmed.substring(idx + 10).trim();
                            if (sub.startsWith("\"")) {
                                int end = sub.indexOf("\"", 1);
                                if (end > 0) {
                                    cleanText.append(sub.substring(1, end));
                                }
                            }
                        } catch (Exception ignored) {}
                    } else if (trimmed.contains("\"response\":")) {
                        try {
                            int idx = trimmed.indexOf("\"response\":");
                            String sub = trimmed.substring(idx + 11).trim();
                            if (sub.startsWith("\"")) {
                                int end = sub.lastIndexOf("\"");
                                if (end > 0) {
                                    cleanText.setLength(0);
                                    cleanText.append(sub.substring(1, end));
                                }
                            }
                        } catch (Exception ignored) {}
                    }
                }

                String finalContent = cleanText.toString();
                if (finalContent.isBlank()) {
                    finalContent = rawStr.contains("data:") ? "Response completed." : rawStr.trim();
                }

                final String toSave = finalContent.isBlank() ? "Response completed." : finalContent;
                transactionTemplate.executeWithoutResult(status -> {
                    chatSessionRepository.findById(sessionId).ifPresent(s -> {
                        ChatMessage assistantMessage = new ChatMessage(
                                MessageRole.ASSISTANT,
                                toSave,
                                s
                        );
                        chatMessageRepository.save(assistantMessage);
                    });
                });
            } catch (Exception ignored) {}
        });
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> getMessages(Long chatId,
                                             String email) {

        User user = getUser(email);

        // Ownership is checked directly at the database query level
        ChatSession session = chatSessionRepository
                .findByIdAndProjectOwner(chatId, user)
                .orElseThrow(() -> new ResourceNotFoundException("ChatSession", "id", chatId));

        return chatMessageRepository
                .findAllByChatSessionOrderByCreatedAtAsc(session)
                .stream()
                .map(this::mapToMessageResponse)
                .toList();
    }

    private ChatResponse mapToChatResponse(ChatSession session) {
        return new ChatResponse(
                session.getId(),
                session.getTitle(),
                session.getCreatedAt(),
                session.getUpdatedAt()
        );
    }

    private MessageResponse mapToMessageResponse(ChatMessage message) {
        return new MessageResponse(
                message.getId(),
                message.getRole(),
                message.getContent(),
                message.getCreatedAt()
        );
    }
}