package com.english.word.verification.backend.service;

import com.english.word.verification.backend.dto.HomeworkAssignmentDTO;

public interface HomeworkService {

    String generateHomeworkURL(String examId, HomeworkAssignmentDTO homeworkAssignmentDTO);
}
