package com.english.word.verification.backend.dto;

import com.english.word.verification.backend.entity.Question;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ExaminationDTO {
    private String id;

    @JsonProperty("title")
    private String title;

    @JsonProperty("question")
    private List<Question> questions;

    @JsonProperty("created_date")
    private String createdDate;

    @JsonProperty("grade")
    private Integer grade;

    @JsonProperty("creator")
    private String creator;
}
