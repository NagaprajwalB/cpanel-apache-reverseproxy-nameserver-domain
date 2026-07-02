package com.apphox.ashvayana.controllers;

import com.apphox.ashvayana.dtos.ApiResponse;
import com.apphox.ashvayana.exceptions.InvalidApiKeyException;
import com.apphox.ashvayana.services.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.io.IOException;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class FileUploadController {

    private final CloudinaryService cloudinaryService;

    @PostMapping
    public ResponseEntity<ApiResponse<String>> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            String url = cloudinaryService.uploadFile(file);
            return ResponseEntity.ok(ApiResponse.success("File uploaded successfully", url));
        } catch (InvalidApiKeyException e) {
            String mockUrl = "https://res.cloudinary.com/demo/image/upload/v1/placeholder.png";
            return ResponseEntity.ok(ApiResponse.success("File uploaded successfully (mock)", mockUrl));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to upload file", e.getMessage()));
        }
    }
}



