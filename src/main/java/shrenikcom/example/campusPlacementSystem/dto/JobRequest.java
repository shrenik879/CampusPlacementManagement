package shrenikcom.example.campusPlacementSystem.dto;

import lombok.Data;

import java.util.List;

@Data
public class JobRequest {
    private String title;
    private String description;
    private List<String> rounds; // e.g. ["Aptitude Test", "Coding Round", "Technical Interview"]
}
