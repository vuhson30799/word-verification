package com.english.word.verification.backend.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;
import java.util.List;


@Data
@Document(collection = "examination")
@NoArgsConstructor
public class Examination {
    @Id
    private String id;

    @Field("title")
    private String title;

    @Field("question")
    private List<Question> questions;

    @Field("created_date")
    private LocalDateTime createdDate;

    @Field("grade")
    private Integer grade;

    @Field("creator")
    private String creator;
}
