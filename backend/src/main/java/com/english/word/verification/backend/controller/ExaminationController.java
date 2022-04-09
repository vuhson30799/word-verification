package com.english.word.verification.backend.controller;

import com.english.word.verification.backend.dto.ExaminationDTO;
import com.english.word.verification.backend.entity.Examination;
import com.english.word.verification.backend.service.ExaminationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/exams")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class ExaminationController {
    private final ExaminationService examinationService;

    @GetMapping
    public List<Examination> getExaminations() {
        return examinationService.findAll();
    }

    @PostMapping(consumes = "multipart/form-data")
    public void createExaminationByTemplate(@RequestParam("file") MultipartFile file, @ModelAttribute ExaminationDTO examinationDTO) {
       examinationService.createExaminationByTemplate(file, examinationDTO);
    }
}
