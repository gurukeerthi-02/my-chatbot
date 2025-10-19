package com.chatbot;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.Map;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ChatController {
    
    @Autowired
    private MessageRepository messageRepository;
    
    @Autowired
    private ChatSessionRepository sessionRepository;
    
    @Autowired
    private GroqService groqService;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private FileProcessingService fileProcessingService;
    
    @Autowired
    private FileUploadRepository fileUploadRepository;
    
    @Autowired
    private ImageGenerationService imageGenerationService;
    

    
    @GetMapping("/users")
    public List<User> getUsers() {
        return userRepository.findAll();
    }
    
    @PostMapping("/users")
    public User createUser(@RequestBody UserRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        User user = new User(request.getUsername(), request.getDisplayName());
        user.setAvatar(request.getAvatar());
        return userRepository.save(user);
    }
    
    @GetMapping("/users/{userId}/sessions")
    public List<ChatSession> getUserSessions(@PathVariable Long userId) {
        return sessionRepository.findByUserIdOrderByUpdatedAtDesc(userId);
    }
    
    @PostMapping("/users/{userId}/sessions")
    public ChatSession createSession(@PathVariable Long userId, @RequestBody SessionRequest request) {
        User user = userRepository.findById(userId).orElseThrow();
        ChatSession session = new ChatSession(request.getTitle());
        session.setUser(user);
        return sessionRepository.save(session);
    }
    
    @GetMapping("/sessions/{sessionId}/messages")
    public List<Message> getMessages(@PathVariable Long sessionId) {
        return messageRepository.findBySessionIdOrderByTimestampAsc(sessionId);
    }
    
    @PostMapping("/sessions/{sessionId}/messages")
    public Message sendMessage(@PathVariable Long sessionId, @RequestBody MessageRequest request) {
        ChatSession session = sessionRepository.findById(sessionId).orElseThrow();
        
        Message userMessage = new Message(request.getContent(), "user");
        userMessage.setSession(session);
        
        // Set parent message if this is a reply
        if (request.getParentMessageId() != null) {
            Message parentMessage = messageRepository.findById(request.getParentMessageId()).orElse(null);
            if (parentMessage != null) {
                userMessage.setParentMessage(parentMessage);
            }
        }
        
        messageRepository.save(userMessage);
        
        // Build context for AI if replying to a message
        String aiPrompt = request.getContent();
        if (request.getParentMessageId() != null && userMessage.getParentMessage() != null) {
            aiPrompt = "Replying to: \"" + userMessage.getParentMessage().getContent() + "\"\n\n" + request.getContent();
        }
        
        int maxTokens = request.getMaxTokens() != null ? request.getMaxTokens() : 2000;
        String botResponse = groqService.getChatResponse(aiPrompt, maxTokens);
        Message botMessage = new Message(botResponse, "bot");
        botMessage.setSession(session);
        
        // Set parent for bot reply too if user was replying
        if (userMessage.getParentMessage() != null) {
            botMessage.setParentMessage(userMessage.getParentMessage());
        }
        
        messageRepository.save(botMessage);
        
        session.setUpdatedAt(java.time.LocalDateTime.now());
        sessionRepository.save(session);
        
        return botMessage;
    }
    
    @PutMapping("/sessions/{sessionId}")
    public ChatSession updateSession(@PathVariable Long sessionId, @RequestBody SessionRequest request) {
        ChatSession session = sessionRepository.findById(sessionId).orElseThrow();
        session.setTitle(request.getTitle());
        session.setUpdatedAt(java.time.LocalDateTime.now());
        return sessionRepository.save(session);
    }
    
    @DeleteMapping("/sessions/{sessionId}")
    public void deleteSession(@PathVariable Long sessionId) {
        sessionRepository.deleteById(sessionId);
    }
    
    @GetMapping("/users/{userId}/search")
    public List<MessageSearchResult> searchMessages(@PathVariable Long userId, @RequestParam String q) {
        List<Message> messages = messageRepository.searchMessagesByUser(userId, q);
        return messages.stream()
            .map(m -> new MessageSearchResult(
                m.getId(),
                m.getContent(),
                m.getSender(),
                m.getTimestamp(),
                m.getSession().getId(),
                m.getSession().getTitle()
            ))
            .collect(java.util.stream.Collectors.toList());
    }
    
    @PostMapping("/sessions/{sessionId}/upload")
    public ResponseEntity<Message> uploadFile(@PathVariable Long sessionId, @RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                throw new RuntimeException("File is empty");
            }
            
            String extractedText = fileProcessingService.extractTextFromFile(file);
            
            FileUpload fileUpload = new FileUpload(
                file.getOriginalFilename(),
                file.getContentType(),
                file.getSize(),
                "uploads/" + file.getOriginalFilename()
            );
            fileUpload.setExtractedText(extractedText);
            fileUploadRepository.save(fileUpload);
            
            ChatSession session = sessionRepository.findById(sessionId).orElseThrow();
            
            String aiPrompt = "Analyze and summarize this document: " + file.getOriginalFilename() + "\n\nContent: " + extractedText + "\n\nProvide only your analysis and insights without repeating the document content.";
            String aiResponse = groqService.getChatResponse(aiPrompt, 2000);
            
            Message botMessage = new Message(aiResponse, "bot");
            botMessage.setSession(session);
            messageRepository.save(botMessage);
            
            session.setUpdatedAt(LocalDateTime.now());
            sessionRepository.save(session);
            
            return ResponseEntity.ok(botMessage);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }
    
    @PostMapping("/sessions/{sessionId}/generate-image")
    public ResponseEntity<Message> generateImage(@PathVariable Long sessionId, @RequestBody ImageRequest request) {
        try {
            System.out.println("Image generation request for session: " + sessionId + ", prompt: " + request.getPrompt());
            
            ChatSession session = sessionRepository.findById(sessionId).orElseThrow();
            
            // Save user message
            Message userMessage = new Message("🎨 Generate image: " + request.getPrompt(), "user");
            userMessage.setSession(session);
            messageRepository.save(userMessage);
            
            // Generate image
            String base64Image = imageGenerationService.generateImage(request.getPrompt());
            String imageContent = "![Generated Image](data:image/png;base64," + base64Image + ")";
            
            // Save bot message with image
            Message botMessage = new Message(imageContent, "bot");
            botMessage.setSession(session);
            messageRepository.save(botMessage);
            
            // Update session timestamp
            session.setUpdatedAt(LocalDateTime.now());
            sessionRepository.save(session);
            
            return ResponseEntity.ok(botMessage);
        } catch (Exception e) {
            System.err.println("Image generation error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(null);
        }
    }
    
    static class ImageRequest {
        private String prompt;
        
        public String getPrompt() { return prompt; }
        public void setPrompt(String prompt) { this.prompt = prompt; }
    }
    
    static class MessageRequest {
        private String content;
        private Integer maxTokens;
        private Long parentMessageId;
        
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
        
        public Integer getMaxTokens() { return maxTokens; }
        public void setMaxTokens(Integer maxTokens) { this.maxTokens = maxTokens; }
        
        public Long getParentMessageId() { return parentMessageId; }
        public void setParentMessageId(Long parentMessageId) { this.parentMessageId = parentMessageId; }
    }
    

    
    static class SessionRequest {
        private String title;
        
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
    }
    
    static class UserRequest {
        private String username;
        private String displayName;
        private String avatar;
        
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        
        public String getDisplayName() { return displayName; }
        public void setDisplayName(String displayName) { this.displayName = displayName; }
        
        public String getAvatar() { return avatar; }
        public void setAvatar(String avatar) { this.avatar = avatar; }
    }
    
    static class MessageSearchResult {
        private Long id;
        private String content;
        private String sender;
        private java.time.LocalDateTime timestamp;
        private Long sessionId;
        private String sessionTitle;
        
        public MessageSearchResult(Long id, String content, String sender, java.time.LocalDateTime timestamp, Long sessionId, String sessionTitle) {
            this.id = id;
            this.content = content;
            this.sender = sender;
            this.timestamp = timestamp;
            this.sessionId = sessionId;
            this.sessionTitle = sessionTitle;
        }
        
        public Long getId() { return id; }
        public String getContent() { return content; }
        public String getSender() { return sender; }
        public java.time.LocalDateTime getTimestamp() { return timestamp; }
        public Long getSessionId() { return sessionId; }
        public String getSessionTitle() { return sessionTitle; }
    }
}