package com.english.word.verification.backend.repository;

import com.english.word.verification.backend.entity.Examination;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ExaminationRepository extends MongoRepository<Examination, String> {
}
