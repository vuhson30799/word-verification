package com.english.word.verification.backend.service;

import com.english.word.verification.backend.entity.Question;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface TemplateResolver {

    List<Question> createQuestionsFromTemplate(MultipartFile file) throws IOException;
}
