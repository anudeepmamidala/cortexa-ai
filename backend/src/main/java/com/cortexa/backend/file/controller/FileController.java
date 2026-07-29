package com.cortexa.backend.file.controller;

import com.cortexa.backend.file.dto.CreateFileRequest;
import com.cortexa.backend.file.dto.FileContentResponse;
import com.cortexa.backend.file.dto.FileNodeDto;
import com.cortexa.backend.file.dto.UpdateFileContentRequest;
import com.cortexa.backend.file.service.FileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/projects/{projectId}/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    @GetMapping("/tree")
    public ResponseEntity<FileNodeDto> getFileTree(
            @PathVariable Long projectId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                fileService.getFileTree(projectId, authentication.getName())
        );
    }

    @GetMapping("/content")
    public ResponseEntity<FileContentResponse> getFileContent(
            @PathVariable Long projectId,
            @RequestParam String path,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                fileService.getFileContent(projectId, path, authentication.getName())
        );
    }

    @PutMapping("/content")
    public ResponseEntity<FileContentResponse> updateFileContent(
            @PathVariable Long projectId,
            @Valid @RequestBody UpdateFileContentRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                fileService.updateFileContent(projectId, request, authentication.getName())
        );
    }

    @PostMapping
    public ResponseEntity<FileNodeDto> createFileOrDirectory(
            @PathVariable Long projectId,
            @Valid @RequestBody CreateFileRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                fileService.createFileOrDirectory(projectId, request, authentication.getName())
        );
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteFileOrDirectory(
            @PathVariable Long projectId,
            @RequestParam String path,
            Authentication authentication
    ) {
        fileService.deleteFileOrDirectory(projectId, path, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
