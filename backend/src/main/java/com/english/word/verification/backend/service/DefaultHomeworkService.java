package com.english.word.verification.backend.service;

import com.english.word.verification.backend.dto.HomeworkAssignmentDTO;
import com.english.word.verification.backend.entity.Homework;
import com.english.word.verification.backend.mapper.HomeworkMapper;
import com.english.word.verification.backend.repository.HomeworkRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DefaultHomeworkService implements HomeworkService {
    private final HomeworkRepository homeworkRepository;
    private final HomeworkMapper homeworkMapper;

    @Override
    public String generateHomeworkURL(String examId, HomeworkAssignmentDTO homeworkAssignmentDTO) {
        Homework homework = homeworkRepository.save(homeworkMapper.toHomework(examId, homeworkAssignmentDTO));
        return homework.getUrl();
    }

    @Override
    public List<Homework> findAllHomeworkByExamId(String examId) {
        return homeworkRepository.findAllByExamId(examId);
    }
}
