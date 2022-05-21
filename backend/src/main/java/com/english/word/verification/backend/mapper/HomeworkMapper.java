package com.english.word.verification.backend.mapper;

import com.english.word.verification.backend.dto.HomeworkAssignmentDTO;
import com.english.word.verification.backend.entity.Homework;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import static com.english.word.verification.backend.constant.ApplicationConstant.HOMEWORK_URI_PREFIX;
import static com.english.word.verification.backend.constant.ApplicationConstant.SERVER_ADDRESS;

@Mapper
public abstract class HomeworkMapper {

    @Mapping(target = "url", expression = "java( toHomeworkURL(examId, homeworkAssignmentDTO) )")
    public abstract Homework toHomework(String examId, HomeworkAssignmentDTO homeworkAssignmentDTO);

    protected String toHomeworkURL(String examId, HomeworkAssignmentDTO homeworkAssignmentDTO) {
        return SERVER_ADDRESS +
                HOMEWORK_URI_PREFIX +
                "examId=" +
                examId +
                "&begin=" +
                homeworkAssignmentDTO.getBeginningDate() +
                "&deadline=" +
                homeworkAssignmentDTO.getDeadlineDate();
    }
}
