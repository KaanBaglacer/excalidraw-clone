package com.excalidrawclone.dto;

import com.excalidrawclone.model.Drawing;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class DrawingResponse {
    private UUID id;
    private String title;
    private UUID ownerId;
    private String elements;
    private String appState;
    private String thumbnailUrl;
    private boolean isPublic;
    private Instant createdAt;
    private Instant updatedAt;

    public static DrawingResponse from(Drawing drawing) {
        return DrawingResponse.builder()
                .id(drawing.getId())
                .title(drawing.getTitle())
                .ownerId(drawing.getOwner().getId())
                .elements(drawing.getElements())
                .appState(drawing.getAppState())
                .thumbnailUrl(drawing.getThumbnailUrl())
                .isPublic(drawing.getIsPublic())
                .createdAt(drawing.getCreatedAt())
                .updatedAt(drawing.getUpdatedAt())
                .build();
    }
}
