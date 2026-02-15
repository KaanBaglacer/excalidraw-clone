package com.excalidrawclone.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CanvasStateRequest {
    @NotBlank
    @Size(max = 10_000_000)
    private String elements;

    @NotBlank
    @Size(max = 2_000_000)
    private String appState;
}
