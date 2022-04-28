package com.english.word.verification.backend.entity;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDate;
import java.util.List;


@Data
@Builder
@Document(collection = "examination")
public class Examination {
    @Id
    private String id;

    @Field("title")
    private String title;

    @Field("question")
    private List<Question> questions;

    @Field("created_date")
    private LocalDate createdDate;

    @Field("grade")
    private Integer grade;

    @Field("creator")
    private String creator;
}
