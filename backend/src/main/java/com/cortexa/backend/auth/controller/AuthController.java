package com.cortexa.backend.auth.controller;

import com.cortexa.backend.auth.dto.AuthResponse;
import com.cortexa.backend.auth.dto.LoginRequest;
import com.cortexa.backend.auth.dto.RegisterRequest;
import com.cortexa.backend.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public AuthResponse register(
            @Valid @RequestBody RegisterRequest request) {

        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(
            @Valid @RequestBody LoginRequest request) {

        return authService.login(request);
    }
}