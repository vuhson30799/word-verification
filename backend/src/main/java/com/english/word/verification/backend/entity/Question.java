package com.english.word.verification.backend.entity;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.mongodb.core.mapping.Field;

import java.util.List;

@Data
@Builder
public class Question {
    @Field("title")
    private String title;

    @Field("keys")
    private List<String> keys;

    @Field("timeout")
    private Integer timeout; // in second

    @Field("question_type")
    private QuestionType questionType;
}
