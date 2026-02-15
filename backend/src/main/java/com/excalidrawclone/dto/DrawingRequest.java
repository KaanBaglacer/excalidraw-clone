package com.excalidrawclone.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DrawingRequest {
    @NotBlank
    private String title = "Untitled";

    @Size(max = 10_000_000)
    private String elements = "[]";

    private String appState = "{}";
}
