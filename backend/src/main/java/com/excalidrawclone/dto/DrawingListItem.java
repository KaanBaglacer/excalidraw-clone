package com.excalidrawclone.dto;

import com.excalidrawclone.model.Drawing;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class DrawingListItem {
    private UUID id;
    private String title;
    private String thumbnailUrl;
    private boolean isPublic;
    private Instant updatedAt;

    public static DrawingListItem from(Drawing drawing) {
        return DrawingListItem.builder()
                .id(drawing.getId())
                .title(drawing.getTitle())
                .thumbnailUrl(drawing.getThumbnailUrl())
                .isPublic(drawing.getIsPublic())
                .updatedAt(drawing.getUpdatedAt())
                .build();
    }
}
