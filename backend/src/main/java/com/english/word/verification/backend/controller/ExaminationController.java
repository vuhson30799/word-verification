package com.english.word.verification.backend.controller;

import com.english.word.verification.backend.dto.ExaminationDTO;
import com.english.word.verification.backend.entity.Examination;
import com.english.word.verification.backend.service.ExaminationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/exams")
@RequiredArgsConstructor
public class ExaminationController {
    private final ExaminationService examinationService;

    @GetMapping
    public List<Examination> getExaminations() {
        return examinationService.findAll();
    }

    @PostMapping
    public void createExamination(@RequestBody ExaminationDTO examinationDTO) {
        examinationService.createExamination(examinationDTO);
    }
}
