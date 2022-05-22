package com.english.word.verification.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

@Getter
public class HomeworkAssignmentDTO {
    @JsonProperty("beginningDate")
    private String beginningDate;

    @JsonProperty("deadlineDate")
    private String deadlineDate;
}
