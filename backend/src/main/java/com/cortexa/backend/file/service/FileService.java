package com.cortexa.backend.file.service;

import com.cortexa.backend.common.exception.BadRequestException;
import com.cortexa.backend.common.exception.ResourceNotFoundException;
import com.cortexa.backend.file.dto.CreateFileRequest;
import com.cortexa.backend.file.dto.FileContentResponse;
import com.cortexa.backend.file.dto.FileNodeDto;
import com.cortexa.backend.file.dto.UpdateFileContentRequest;
import com.cortexa.backend.project.entity.Project;
import com.cortexa.backend.project.repository.ProjectRepository;
import com.cortexa.backend.user.entity.User;
import com.cortexa.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class FileService {

    private static final String BASE_STORAGE_DIR = "storage/workspaces";

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public FileNodeDto getFileTree(Long projectId, String email) {
        Path projectRoot = getProjectRootPath(projectId, email);
        if (!Files.exists(projectRoot)) {
            try {
                Files.createDirectories(projectRoot);
                initDefaultProjectFiles(projectRoot, projectId);
            } catch (IOException e) {
                throw new BadRequestException("Failed to initialize project directory workspace", e);
            }
        }

        return buildNode(projectRoot, projectRoot);
    }

    public FileContentResponse getFileContent(Long projectId, String relativePath, String email) {
        Path projectRoot = getProjectRootPath(projectId, email);
        Path targetPath = resolveAndSanitizePath(projectRoot, relativePath);

        if (!Files.exists(targetPath) || Files.isDirectory(targetPath)) {
            throw new ResourceNotFoundException("File", "path", relativePath);
        }

        try {
            String content = Files.readString(targetPath);
            return new FileContentResponse(relativePath, content);
        } catch (IOException e) {
            throw new BadRequestException("Failed to read file content: " + relativePath, e);
        }
    }

    public FileContentResponse updateFileContent(Long projectId, UpdateFileContentRequest request, String email) {
        Path projectRoot = getProjectRootPath(projectId, email);
        Path targetPath = resolveAndSanitizePath(projectRoot, request.path());

        try {
            if (targetPath.getParent() != null && !Files.exists(targetPath.getParent())) {
                Files.createDirectories(targetPath.getParent());
            }
            Files.writeString(targetPath, request.content() != null ? request.content() : "", StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
            return new FileContentResponse(request.path(), request.content());
        } catch (IOException e) {
            throw new BadRequestException("Failed to save file content: " + request.path(), e);
        }
    }

    public FileNodeDto createFileOrDirectory(Long projectId, CreateFileRequest request, String email) {
        Path projectRoot = getProjectRootPath(projectId, email);
        Path targetPath = resolveAndSanitizePath(projectRoot, request.path());

        try {
            if (request.isDirectory()) {
                Files.createDirectories(targetPath);
            } else {
                if (targetPath.getParent() != null && !Files.exists(targetPath.getParent())) {
                    Files.createDirectories(targetPath.getParent());
                }
                if (!Files.exists(targetPath)) {
                    Files.createFile(targetPath);
                }
            }
            return buildNode(targetPath, projectRoot);
        } catch (IOException e) {
            throw new BadRequestException("Failed to create file/directory at path: " + request.path(), e);
        }
    }

    public void deleteFileOrDirectory(Long projectId, String relativePath, String email) {
        Path projectRoot = getProjectRootPath(projectId, email);
        Path targetPath = resolveAndSanitizePath(projectRoot, relativePath);

        if (!Files.exists(targetPath)) {
            throw new ResourceNotFoundException("File or directory", "path", relativePath);
        }

        try {
            if (Files.isDirectory(targetPath)) {
                try (Stream<Path> walk = Files.walk(targetPath)) {
                    walk.sorted(Comparator.reverseOrder())
                        .map(Path::toFile)
                        .forEach(File::delete);
                }
            } else {
                Files.delete(targetPath);
            }
        } catch (IOException e) {
            throw new BadRequestException("Failed to delete file or directory at path: " + relativePath, e);
        }
    }

    private Path getProjectRootPath(Long projectId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Project project = projectRepository.findByIdAndOwner(projectId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        return Paths.get(BASE_STORAGE_DIR, "project_" + project.getId()).toAbsolutePath().normalize();
    }

    private Path resolveAndSanitizePath(Path root, String relativePath) {
        if (relativePath == null || relativePath.isBlank()) {
            return root;
        }
        Path resolved = root.resolve(relativePath).normalize();
        if (!resolved.startsWith(root)) {
            throw new BadRequestException("Access denied: Invalid file path traversal detected.");
        }
        return resolved;
    }

    private FileNodeDto buildNode(Path path, Path root) {
        String name = path.getFileName() != null ? path.getFileName().toString() : "";
        String relativePath = root.relativize(path).toString().replace("\\", "/");
        boolean isDir = Files.isDirectory(path);
        long size = 0;
        List<FileNodeDto> children = null;

        if (isDir) {
            children = new ArrayList<>();
            try (DirectoryStream<Path> stream = Files.newDirectoryStream(path)) {
                for (Path entry : stream) {
                    children.add(buildNode(entry, root));
                }
            } catch (IOException ignored) {}
            children.sort((a, b) -> {
                if (a.isDirectory() != b.isDirectory()) {
                    return a.isDirectory() ? -1 : 1;
                }
                return a.name().compareToIgnoreCase(b.name());
            });
        } else {
            try {
                size = Files.size(path);
            } catch (IOException ignored) {}
        }

        return new FileNodeDto(name.isEmpty() ? root.getFileName().toString() : name, relativePath, isDir, size, children);
    }

    private void initDefaultProjectFiles(Path projectRoot, Long projectId) throws IOException {
        Path readme = projectRoot.resolve("README.md");
        Files.writeString(readme, "# Project Workspace #" + projectId + "\n\nWelcome to your Cortexa AI IDE project workspace!\n");

        Path src = projectRoot.resolve("src");
        Files.createDirectories(src);

        Path mainFile = src.resolve("Main.java");
        Files.writeString(mainFile, "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello from Cortexa AI IDE!\");\n    }\n}\n");
    }
}
