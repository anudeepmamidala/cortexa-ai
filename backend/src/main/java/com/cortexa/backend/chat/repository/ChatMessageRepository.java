package com.cortexa.backend.chat.repository;

import com.cortexa.backend.chat.entity.ChatMessage;
import com.cortexa.backend.chat.entity.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findAllByChatSessionOrderByCreatedAtAsc(ChatSession chatSession);
}