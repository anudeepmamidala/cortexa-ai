package com.cortexa.backend.project.repository;

import com.cortexa.backend.project.entity.Project;
import com.cortexa.backend.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findAllByOwner(User owner);

    Optional<Project> findByIdAndOwner(Long id, User owner);
}