package shrenikcom.example.campusPlacementSystem.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParsedResume {
    private String email;
    private String phone;
    private List<String> skills;
    private List<String> educationKeywords;
    private String rawText;
}
