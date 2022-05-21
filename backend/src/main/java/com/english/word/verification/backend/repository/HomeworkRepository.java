package com.english.word.verification.backend.repository;

import com.english.word.verification.backend.entity.Homework;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface HomeworkRepository extends MongoRepository<Homework, String> {
}
