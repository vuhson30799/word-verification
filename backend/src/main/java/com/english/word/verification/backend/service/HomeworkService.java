package com.english.word.verification.backend.service;

import com.english.word.verification.backend.dto.HomeworkAssignmentDTO;
import com.english.word.verification.backend.entity.Homework;

import java.time.LocalDateTime;
import java.util.List;

public interface HomeworkService {

    String generateHomeworkURL(String examId, HomeworkAssignmentDTO homeworkAssignmentDTO);

    List<Homework> findAllHomeworkByExamId(String examId);

    boolean isHomeworkExistInRange(String examId, LocalDateTime beginningDate, LocalDateTime deadlineDate);
}
