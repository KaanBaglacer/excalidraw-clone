package com.excalidrawclone.controller;

import com.excalidrawclone.dto.*;
import com.excalidrawclone.model.User;
import com.excalidrawclone.service.DrawingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/drawings")
@RequiredArgsConstructor
public class DrawingController {

    private final DrawingService drawingService;

    @GetMapping
    public ResponseEntity<Page<DrawingListItem>> list(
            @AuthenticationPrincipal User user,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(drawingService.listByOwner(user.getId(), pageable));
    }

    @PostMapping
    public ResponseEntity<DrawingResponse> create(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody DrawingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(drawingService.create(request, user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DrawingResponse> get(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        UUID requesterId = user != null ? user.getId() : null;
        return ResponseEntity.ok(drawingService.getById(id, requesterId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DrawingResponse> update(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user,
            @Valid @RequestBody DrawingUpdateRequest request) {
        return ResponseEntity.ok(drawingService.update(id, request, user.getId()));
    }

    @PutMapping("/{id}/state")
    public ResponseEntity<CanvasStateResponse> saveCanvasState(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CanvasStateRequest request) {
        return ResponseEntity.ok(drawingService.saveCanvasState(id, request, user.getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        drawingService.delete(id, user.getId());
        return ResponseEntity.noContent().build();
    }
}
