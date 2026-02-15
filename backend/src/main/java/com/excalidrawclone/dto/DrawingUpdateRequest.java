package com.excalidrawclone.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DrawingUpdateRequest {
    private String title;

    @Size(max = 10_000_000)
    private String elements;

    private String appState;
}
