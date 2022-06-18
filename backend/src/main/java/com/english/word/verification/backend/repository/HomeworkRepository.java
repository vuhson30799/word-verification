package com.english.word.verification.backend.repository;

import com.english.word.verification.backend.entity.Homework;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface HomeworkRepository extends MongoRepository<Homework, String> {
    List<Homework> findAllByExamId(String examId);
    boolean existsByExamIdAndBeginningDateAndDeadlineDate(String examId, LocalDateTime beginningDate, LocalDateTime deadlineDate);
}
