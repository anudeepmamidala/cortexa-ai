package com.cortexa.backend.project.service;

import com.cortexa.backend.common.exception.ResourceNotFoundException;
import com.cortexa.backend.file.service.FileService;
import com.cortexa.backend.project.dto.CreateProjectRequest;
import com.cortexa.backend.project.dto.ProjectResponse;
import com.cortexa.backend.project.dto.UpdateProjectRequest;
import com.cortexa.backend.project.entity.Project;
import com.cortexa.backend.project.repository.ProjectRepository;
import com.cortexa.backend.user.entity.User;
import com.cortexa.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final FileService fileService;

    public ProjectResponse createProject(CreateProjectRequest request, String email) {

        User user = getUser(email);

        Project project = Project.builder()
                .name(request.name())
                .description(request.description())
                .owner(user)
                .build();

        Project saved = projectRepository.save(project);
        
        // Auto-initialize workspace storage directory & starter files
        try {
            fileService.getFileTree(saved.getId(), email);
        } catch (Exception ignored) {}

        return mapToResponse(saved);
    }

    public List<ProjectResponse> getProjects(String email) {

        User user = getUser(email);

        return projectRepository.findAllByOwner(user)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public ProjectResponse getProject(Long id, String email) {

        User user = getUser(email);

        Project project = projectRepository.findByIdAndOwner(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", id));

        return mapToResponse(project);
    }

    public ProjectResponse updateProject(Long id,
                                          UpdateProjectRequest request,
                                          String email) {

        User user = getUser(email);

        Project project = projectRepository.findByIdAndOwner(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", id));

        project.setName(request.name());
        project.setDescription(request.description());

        return mapToResponse(projectRepository.save(project));
    }

    public void deleteProject(Long id, String email) {

        User user = getUser(email);

        Project project = projectRepository.findByIdAndOwner(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", id));

        projectRepository.delete(project);
    }

    private User getUser(String email) {

        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User", "email", email));
    }

    private ProjectResponse mapToResponse(Project project) {

        return new ProjectResponse(
                project.getId(),
                project.getName(),
                project.getDescription(),
                project.getCreatedAt(),
                project.getUpdatedAt()
        );
    }
}