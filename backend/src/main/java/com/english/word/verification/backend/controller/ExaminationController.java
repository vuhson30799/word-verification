package com.english.word.verification.backend.controller;

import com.english.word.verification.backend.dto.ExaminationDTO;
import com.english.word.verification.backend.dto.HomeworkAssignmentDTO;
import com.english.word.verification.backend.entity.Examination;
import com.english.word.verification.backend.service.ExaminationService;
import com.english.word.verification.backend.service.HomeworkService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/exams")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
@Slf4j
public class ExaminationController {
    private final ExaminationService examinationService;
    private final HomeworkService homeworkService;

    @GetMapping
    public List<Examination> getExaminations() {
        return examinationService.findAll();
    }

    @PostMapping(consumes = "multipart/form-data")
    public void createExaminationByTemplate(@RequestParam("file") MultipartFile file, @ModelAttribute ExaminationDTO examinationDTO) {
        log.info("Creating an examination by requested template");
        examinationService.createExaminationByTemplate(file, examinationDTO);
        log.info("An examination has been created successfully.");
    }

    @GetMapping("/{id}")
    public Examination retrieveExamination(@PathVariable("id")String id) {
        log.info("Getting examination by id {}", id);
        Examination examination = examinationService.findById(id);
        log.info("Examination with id {} returned.", id);
        return examination;
    }

    @PostMapping("/{id}")
    public String retrieveHomeworkURL(@PathVariable("id")String examId, @RequestBody HomeworkAssignmentDTO homeworkAssignmentDTO) {
        log.info("Generating homework url for exam with id {}", examId);
        String homeworkURL = homeworkService.generateHomeworkURL(examId, homeworkAssignmentDTO);
        log.info("Homework url: {} has been generated successfully.", homeworkURL);
        return homeworkURL;
    }

}
