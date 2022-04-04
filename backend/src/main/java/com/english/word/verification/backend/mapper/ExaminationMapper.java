package com.english.word.verification.backend.mapper;

import com.english.word.verification.backend.dto.ExaminationDTO;
import com.english.word.verification.backend.entity.Examination;
import org.mapstruct.Mapper;

@Mapper
public interface ExaminationMapper {
    Examination toExamination(ExaminationDTO examinationDTO);

    ExaminationDTO toExaminationDTO(Examination examination);
}
