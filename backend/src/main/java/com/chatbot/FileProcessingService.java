package com.chatbot;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Service
public class FileProcessingService {

    public String extractTextFromFile(MultipartFile file) throws IOException {
        String contentType = file.getContentType();
        
        if (contentType == null) {
            throw new IOException("Unknown file type");
        }
        
        switch (contentType) {
            case "application/pdf":
                return extractTextFromPDF(file);
            case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                return extractTextFromDOCX(file);
            case "text/plain":
                return extractTextFromTXT(file);
            default:
                throw new IOException("Unsupported file type: " + contentType);
        }
    }
    
    private String extractTextFromPDF(MultipartFile file) throws IOException {
        try (PDDocument document = PDDocument.load(file.getInputStream())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }
    
    private String extractTextFromDOCX(MultipartFile file) throws IOException {
        try (XWPFDocument document = new XWPFDocument(file.getInputStream());
             XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
            return extractor.getText();
        }
    }
    
    private String extractTextFromTXT(MultipartFile file) throws IOException {
        return new String(file.getBytes(), StandardCharsets.UTF_8);
    }
}