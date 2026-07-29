package com.cortexa.backend.chat.repository;

import com.cortexa.backend.chat.entity.ChatSession;
import com.cortexa.backend.project.entity.Project;
import com.cortexa.backend.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {

    List<ChatSession> findAllByProject(Project project);

    Optional<ChatSession> findByIdAndProject(Long id, Project project);

    Optional<ChatSession> findByIdAndProjectOwner(Long id, User owner);
}