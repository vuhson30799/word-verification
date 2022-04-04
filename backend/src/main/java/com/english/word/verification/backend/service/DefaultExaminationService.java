package com.english.word.verification.backend.service;

import com.english.word.verification.backend.dto.ExaminationDTO;
import com.english.word.verification.backend.entity.Examination;
import com.english.word.verification.backend.mapper.ExaminationMapper;
import com.english.word.verification.backend.repository.ExaminationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DefaultExaminationService implements ExaminationService {
    private final ExaminationRepository examinationRepository;
    private final ExaminationMapper examinationMapper;

    @Override
    public List<Examination> findAll() {
        return examinationRepository.findAll();
    }

    @Override
    public void createExamination(ExaminationDTO examinationDTO) {
        examinationRepository.save(examinationMapper.toExamination(examinationDTO));
    }
}
