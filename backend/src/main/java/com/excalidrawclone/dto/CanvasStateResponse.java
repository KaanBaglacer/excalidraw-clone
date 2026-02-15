package com.excalidrawclone.dto;

import com.excalidrawclone.model.Drawing;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class CanvasStateResponse {
    private UUID drawingId;
    private String elements;
    private String appState;
    private Instant updatedAt;

    public static CanvasStateResponse from(Drawing drawing) {
        return CanvasStateResponse.builder()
                .drawingId(drawing.getId())
                .elements(drawing.getElements())
                .appState(drawing.getAppState())
                .updatedAt(drawing.getUpdatedAt())
                .build();
    }
}
