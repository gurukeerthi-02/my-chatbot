package com.chatbot;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;

@Service
public class GroqService {
    
    @Value("${groq.api.key}")
    private String apiKey;
    
    @Value("${groq.api.url}")
    private String apiUrl;
    
    private final WebClient webClient;
    
    public GroqService() {
        this.webClient = WebClient.builder().build();
    }
    
    public String getChatResponse(String message, int maxTokens) {
        if (apiKey == null || apiKey.equals("YOUR_GROQ_API_KEY_HERE")) {
            return "Please configure your Groq API key in application.properties";
        }
        
        for (int attempt = 1; attempt <= 3; attempt++) {
            try {
                String cleanMessage = message.replace("\"", "\\\"").replace("\r", "").replace("\n", " ");
                String requestBody = "{\"model\":\"llama-3.1-8b-instant\",\"messages\":[{\"role\":\"user\",\"content\":\"" + cleanMessage + "\"}],\"max_tokens\":" + maxTokens + "}";
                
                System.out.println("Request body: " + requestBody);
                
                String result = webClient.post()
                    .uri(apiUrl)
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .bodyValue(requestBody)
                    .retrieve()
                    .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                        response -> response.bodyToMono(String.class)
                            .map(body -> {
                                System.err.println("Error response body: " + body);
                                return new RuntimeException("API Error: " + body);
                            }))
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(30))
                    .block();
                
                return extractContentFromResponse(result);
                
            } catch (Exception e) {
                System.err.println("Full error: " + e.getClass().getSimpleName() + ": " + e.getMessage());
                e.printStackTrace();
                
                if (e.getMessage() != null && e.getMessage().contains("429")) {
                    if (attempt < 3) {
                        try {
                            Thread.sleep(2000 * attempt);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                        }
                        continue;
                    }
                    return "Rate limit exceeded. Please wait a moment and try again.";
                }
                
                if (e.getMessage() != null && e.getMessage().contains("401")) {
                    return "Invalid API key. Please check your Groq API key.";
                }
                
                return "Service error: " + (e.getMessage() != null ? e.getMessage() : "Unknown error");
            }
        }
        return "Service unavailable after retries.";
    }
    
    private String extractContentFromResponse(String response) {
        try {
            System.out.println("Full API response: " + response);
            
            int choicesStart = response.indexOf("\"choices\":");
            int contentStart = response.indexOf("\"content\":\"", choicesStart) + 11;
            
            // Find the end of content more carefully
            int contentEnd = contentStart;
            int braceCount = 0;
            boolean inQuotes = false;
            boolean escaped = false;
            
            for (int i = contentStart; i < response.length(); i++) {
                char c = response.charAt(i);
                
                if (escaped) {
                    escaped = false;
                    continue;
                }
                
                if (c == '\\') {
                    escaped = true;
                    continue;
                }
                
                if (c == '"' && !escaped) {
                    if (!inQuotes) {
                        contentEnd = i;
                        break;
                    }
                }
            }
            
            if (contentStart > 10 && contentEnd > contentStart) {
                String content = response.substring(contentStart, contentEnd)
                    .replace("\\n", "\n")
                    .replace("\\\"", "\"")
                    .replace("\\t", "\t");
                
                System.out.println("Extracted content length: " + content.length());
                return content;
            }
            return "Could not parse AI response";
        } catch (Exception e) {
            e.printStackTrace();
            return "Response parsing error: " + e.getMessage();
        }
    }
}