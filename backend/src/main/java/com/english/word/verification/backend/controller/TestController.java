package com.english.word.verification.backend.controller;

import com.english.word.verification.backend.dto.ExaminationDTO;
import com.english.word.verification.backend.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
@Slf4j
public class TestController {
    private final AttendanceService attendanceService;

    @GetMapping("/join")
    public ExaminationDTO getExaminationWithHashAnswer(@RequestParam("examId") String examId,
                                                      @RequestParam("beginningDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime beginningDate,
                                                      @RequestParam("deadlineDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime deadlineDate) {
        log.info("Retrieving exam {} for assigned homework at {} with deadline {}.", examId, beginningDate, deadlineDate);
        ExaminationDTO examinationDTO = attendanceService.getExaminationForStudent(examId, beginningDate, deadlineDate);
        log.info("Retrieved exam {} for assigned homework at {} with deadline {}.", examId, beginningDate, deadlineDate);
        return examinationDTO;
    }
}
