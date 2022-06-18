package com.english.word.verification.backend.service;

import com.english.word.verification.backend.dto.ExaminationDTO;
import com.english.word.verification.backend.entity.Examination;
import com.english.word.verification.backend.mapper.ExaminationMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class DefaultAttendanceService implements AttendanceService {
    private final ExaminationService examinationService;
    private final HomeworkService homeworkService;
    private final ExaminationMapper examinationMapper;
    @Override
    public ExaminationDTO getExaminationForStudent(String examId, LocalDateTime beginningDate, LocalDateTime deadlineDate) {
        boolean isHomeworkExist = homeworkService.isHomeworkExistInRange(examId, beginningDate, deadlineDate);
        if (!isHomeworkExist) {
            throw new IllegalArgumentException("Homework is not exist.");
        }

        Examination examination = examinationService.findById(examId);
        return examinationMapper.toExaminationDTOWithHashAnswer(examination);
    }
}
