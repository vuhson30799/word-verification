package com.english.word.verification.backend.service;

import com.english.word.verification.backend.dto.ExaminationDTO;
import com.english.word.verification.backend.entity.Examination;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ExaminationService {
    List<Examination> findAll();

    void createExamination(ExaminationDTO examinationDTO);

    void createExaminationByTemplate(MultipartFile file, ExaminationDTO examinationDTO);
}
