package com.chatbot;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;
    
    @Column(nullable = false)
    private String sender;
    
    @Column(nullable = false)
    private LocalDateTime timestamp;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private ChatSession session;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_message_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Message parentMessage;
    
    @OneToMany(mappedBy = "parentMessage", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private java.util.List<Message> replies;
    
    public Message() {
        this.timestamp = LocalDateTime.now();
    }
    
    public Message(String content, String sender) {
        this.content = content;
        this.sender = sender;
        this.timestamp = LocalDateTime.now();
    }
    
    public String getFormattedTimestamp() {
        return timestamp.format(java.time.format.DateTimeFormatter.ofPattern("MMM dd, HH:mm"));
    }
    
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    
    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }
    
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    
    public ChatSession getSession() { return session; }
    public void setSession(ChatSession session) { this.session = session; }
    
    public Message getParentMessage() { return parentMessage; }
    public void setParentMessage(Message parentMessage) { this.parentMessage = parentMessage; }
    
    public java.util.List<Message> getReplies() { return replies; }
    public void setReplies(java.util.List<Message> replies) { this.replies = replies; }
}