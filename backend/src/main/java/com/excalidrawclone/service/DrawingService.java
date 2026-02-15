package com.excalidrawclone.service;

import com.excalidrawclone.dto.*;
import com.excalidrawclone.exception.ResourceNotFoundException;
import com.excalidrawclone.exception.UnauthorizedException;
import com.excalidrawclone.model.Drawing;
import com.excalidrawclone.model.User;
import com.excalidrawclone.repository.DrawingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DrawingService {

    private final DrawingRepository drawingRepository;

    @Transactional(readOnly = true)
    public Page<DrawingListItem> listByOwner(UUID ownerId, Pageable pageable) {
        return drawingRepository.findByOwnerIdOrderByUpdatedAtDesc(ownerId, pageable)
                .map(DrawingListItem::from);
    }

    @Transactional(readOnly = true)
    public DrawingResponse getById(UUID id, UUID requesterId) {
        Drawing drawing = drawingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Drawing not found"));

        if (!drawing.getIsPublic() && !drawing.getOwner().getId().equals(requesterId)) {
            throw new UnauthorizedException("Access denied");
        }

        return DrawingResponse.from(drawing);
    }

    @Transactional
    public DrawingResponse create(DrawingRequest request, User owner) {
        Drawing drawing = Drawing.builder()
                .title(request.getTitle())
                .owner(owner)
                .elements(request.getElements())
                .appState(request.getAppState())
                .build();

        drawing = drawingRepository.save(drawing);
        return DrawingResponse.from(drawing);
    }

    @Transactional
    public DrawingResponse update(UUID id, DrawingUpdateRequest request, UUID ownerId) {
        Drawing drawing = drawingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Drawing not found"));

        if (!drawing.getOwner().getId().equals(ownerId)) {
            throw new UnauthorizedException("Access denied");
        }

        if (request.getTitle() != null) {
            drawing.setTitle(request.getTitle());
        }
        if (request.getElements() != null) {
            drawing.setElements(request.getElements());
        }
        if (request.getAppState() != null) {
            drawing.setAppState(request.getAppState());
        }

        drawing = drawingRepository.save(drawing);
        return DrawingResponse.from(drawing);
    }

    @Transactional
    public CanvasStateResponse saveCanvasState(UUID id, CanvasStateRequest request, UUID ownerId) {
        Drawing drawing = drawingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Drawing not found"));

        if (!drawing.getOwner().getId().equals(ownerId)) {
            throw new UnauthorizedException("Access denied");
        }

        drawing.setElements(request.getElements());
        drawing.setAppState(request.getAppState());

        drawing = drawingRepository.save(drawing);
        return CanvasStateResponse.from(drawing);
    }

    @Transactional
    public void delete(UUID id, UUID ownerId) {
        Drawing drawing = drawingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Drawing not found"));

        if (!drawing.getOwner().getId().equals(ownerId)) {
            throw new UnauthorizedException("Access denied");
        }

        drawingRepository.delete(drawing);
    }
}
