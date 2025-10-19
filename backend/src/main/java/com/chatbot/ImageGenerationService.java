package com.chatbot;

import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.time.Duration;

@Service
public class ImageGenerationService {
    
    private final WebClient webClient;
    private static final String POLLINATIONS_URL = "https://image.pollinations.ai/prompt/";
    
    public ImageGenerationService() {
        this.webClient = WebClient.builder()
            .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(10 * 1024 * 1024)) // 10MB
            .build();
    }
    
    public String generateImage(String prompt) {
        try {
            System.out.println("Generating image for prompt: " + prompt);
            
            // Try Pollinations.ai first
            String encodedPrompt = URLEncoder.encode(prompt, StandardCharsets.UTF_8);
            String imageUrl = POLLINATIONS_URL + encodedPrompt + "?width=512&height=512&nologo=true&enhance=true";
            
            System.out.println("Image URL: " + imageUrl);
            
            byte[] imageBytes = webClient.get()
                .uri(imageUrl)
                .retrieve()
                .bodyToMono(byte[].class)
                .timeout(Duration.ofSeconds(30))
                .block();
            
            if (imageBytes != null && imageBytes.length > 0) {
                System.out.println("Image generated successfully, size: " + imageBytes.length + " bytes");
                return Base64.getEncoder().encodeToString(imageBytes);
            }
            
            throw new RuntimeException("No image data received from Pollinations API");
        } catch (Exception e) {
            System.err.println("Primary image generation failed: " + e.getMessage());
            
            // Try alternative URL format
            try {
                String encodedPrompt = URLEncoder.encode(prompt, StandardCharsets.UTF_8);
                String altImageUrl = "https://image.pollinations.ai/prompt/" + encodedPrompt + "?nologo=true&enhance=true";
                
                System.out.println("Trying alternative URL: " + altImageUrl);
                
                byte[] imageBytes = webClient.get()
                    .uri(altImageUrl)
                    .retrieve()
                    .bodyToMono(byte[].class)
                    .timeout(Duration.ofSeconds(30))
                    .block();
                
                if (imageBytes != null && imageBytes.length > 0) {
                    System.out.println("Alternative image generated successfully, size: " + imageBytes.length + " bytes");
                    return Base64.getEncoder().encodeToString(imageBytes);
                }
            } catch (Exception altE) {
                System.err.println("Alternative image generation also failed: " + altE.getMessage());
            }
            
            throw new RuntimeException("Failed to generate image: " + e.getMessage());
        }
    }
}