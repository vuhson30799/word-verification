package com.english.word.verification.backend.mapper;

import com.english.word.verification.backend.constant.ApplicationConstant;
import com.english.word.verification.backend.dto.ExaminationDTO;
import com.english.word.verification.backend.entity.Examination;
import com.english.word.verification.backend.entity.Question;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.stream.Collectors;

@Mapper
public interface ExaminationMapper {
    Examination toExamination(ExaminationDTO examinationDTO);

    ExaminationDTO toExaminationDTO(Examination examination);

    @Mapping(target = "questions", expression = "java( encodeKeyByHash(examination))")
    ExaminationDTO toExaminationDTOWithHashAnswer(Examination examination);

    default List<Question> encodeKeyByHash(Examination examination) {
        return examination.getQuestions()
                .stream()
                .map(this::encodeQuestionKeys)
                .collect(Collectors.toList());
    }

    private Question encodeQuestionKeys(Question question) {
        List<String> encodedKeys = question.getKeys()
                .stream()
                .map(this::encodeKeyByBase64)
                .collect(Collectors.toList());
        question.setKeys(encodedKeys);
        return question;
    }

    private String encodeKeyByBase64(String key) {
        Base64.Encoder encoder = Base64.getEncoder();
        String encodedKey = encoder.encodeToString(key.getBytes(StandardCharsets.UTF_8));
        String keyBeforeEncoding = encodedKey.concat(ApplicationConstant.API_KEY);
        return encoder.encodeToString(keyBeforeEncoding.getBytes(StandardCharsets.UTF_8));
    }
}
