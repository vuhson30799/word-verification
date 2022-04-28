package com.english.word.verification.backend.service;

import com.english.word.verification.backend.dto.ExaminationDTO;
import com.english.word.verification.backend.entity.Examination;
import com.english.word.verification.backend.entity.Question;
import com.english.word.verification.backend.mapper.ExaminationMapper;
import com.english.word.verification.backend.repository.ExaminationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DefaultExaminationService implements ExaminationService {
    private final ExaminationRepository examinationRepository;
    private final ExaminationMapper examinationMapper;
    private final TemplateResolver templateResolver;

    @Override
    public List<Examination> findAll() {
        return examinationRepository.findAll();
    }

    @Override
    public void createExamination(ExaminationDTO examinationDTO) {
        examinationRepository.save(examinationMapper.toExamination(examinationDTO));
    }

    @Override
    public void createExaminationByTemplate(MultipartFile file, ExaminationDTO examinationDTO) {
        try {
            List<Question> questions = templateResolver.createQuestionsFromTemplate(file);
            examinationDTO.setQuestions(questions);
            examinationRepository.save(examinationMapper.toExamination(examinationDTO));
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @Override
    public Examination findById(String id) {
        Optional<Examination> examination = examinationRepository.findById(id);
        return examination.orElseGet(Examination::new);
    }
}
