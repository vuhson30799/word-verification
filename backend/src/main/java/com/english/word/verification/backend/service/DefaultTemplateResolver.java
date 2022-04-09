package com.english.word.verification.backend.service;

import com.english.word.verification.backend.entity.Question;
import com.english.word.verification.backend.entity.QuestionType;
import org.apache.commons.lang3.StringUtils;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
public class DefaultTemplateResolver implements TemplateResolver {
    @Override
    public List<Question> createQuestionsFromTemplate(MultipartFile file) throws IOException {
        Workbook workbook = new XSSFWorkbook(file.getInputStream());
        List<Question> questions = new ArrayList<>();
        Sheet sheet = workbook.getSheetAt(0);
        for (Row row : sheet) {
            String title = row.getCell(0).getStringCellValue();
            if (row.getRowNum() < 2 || StringUtils.isBlank(title)) {
                continue;
            }
            questions.add(Question.builder()
                                  .title(title)
                                  .questionType(QuestionType.valueOf(row.getCell(1).getStringCellValue()))
                                  .keys(getKeysFromRow(row))
                                  .timeout((int) row.getCell(8).getNumericCellValue())
                                  .build());
        }
        return questions;
    }

    private List<String> getKeysFromRow(Row row) {
        List<String> keys = new ArrayList<>();
        for (int i = 2; i < 7; i++) {
            String key = row.getCell(i).getStringCellValue();
            if (StringUtils.isNotBlank(key)) {
                keys.add(key);
            }
        }
        return keys;
    }
}
