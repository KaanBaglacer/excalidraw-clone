package com.excalidrawclone.repository;

import com.excalidrawclone.model.Drawing;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface DrawingRepository extends JpaRepository<Drawing, UUID> {
    Page<Drawing> findByOwnerIdOrderByUpdatedAtDesc(UUID ownerId, Pageable pageable);
}
