package com.english.word.verification.backend.service;

import com.english.word.verification.backend.dto.ExaminationDTO;

import java.time.LocalDateTime;

public interface AttendanceService {
    ExaminationDTO getExaminationForStudent(String examId, LocalDateTime beginningDate, LocalDateTime deadlineDate);
}
