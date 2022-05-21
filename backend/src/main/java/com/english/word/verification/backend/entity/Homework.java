package com.english.word.verification.backend.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;

@Data
@Document(collection = "homework")
@NoArgsConstructor
public class Homework {
    @Id
    private String id;

    @Field("url")
    private String url;

    @Field("beginning_date")
    private LocalDateTime beginningDate;

    @Field("deadline_date")
    private LocalDateTime deadlineDate;
}
