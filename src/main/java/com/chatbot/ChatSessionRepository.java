package com.chatbot;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {
    List<ChatSession> findAllByOrderByUpdatedAtDesc();
    List<ChatSession> findByUserIdOrderByUpdatedAtDesc(Long userId);
}