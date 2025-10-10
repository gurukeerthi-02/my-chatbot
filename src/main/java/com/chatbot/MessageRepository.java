package com.chatbot;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findAllByOrderByTimestampAsc();
    List<Message> findBySessionIdOrderByTimestampAsc(Long sessionId);
    
    @org.springframework.data.jpa.repository.Query("SELECT m FROM Message m WHERE m.session.user.id = :userId AND LOWER(m.content) LIKE LOWER(CONCAT('%', :searchTerm, '%')) ORDER BY m.timestamp DESC")
    List<Message> searchMessagesByUser(@org.springframework.data.repository.query.Param("userId") Long userId, @org.springframework.data.repository.query.Param("searchTerm") String searchTerm);
}