package shrenikcom.example.campusPlacementSystem.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import shrenikcom.example.campusPlacementSystem.dto.ParsedResume;

import java.io.InputStream;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class ResumeParserService {

    // ── Skill dictionary ────────────────────────────────────────────────────
    private static final Set<String> SKILL_DICTIONARY = Set.of(
            // Languages
            "java", "python", "javascript", "typescript", "c++", "c#", "go", "golang",
            "ruby", "php", "swift", "kotlin", "rust", "scala", "r", "matlab",
            "html", "css", "sass", "less",

            // Frameworks & Libraries
            "spring", "spring boot", "springboot", "hibernate", "jpa",
            "react", "reactjs", "react.js", "angular", "angularjs", "vue", "vuejs", "vue.js",
            "next.js", "nextjs", "express", "expressjs", "express.js",
            "node.js", "nodejs", "django", "flask", "fastapi",
            "tailwind", "tailwindcss", "bootstrap", "material ui",
            ".net", "asp.net", "rails", "laravel",

            // Databases
            "sql", "mysql", "postgresql", "postgres", "mongodb", "redis",
            "oracle", "sqlite", "cassandra", "dynamodb", "firebase", "supabase",

            // Cloud & DevOps
            "aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "k8s",
            "jenkins", "ci/cd", "terraform", "ansible", "nginx",
            "heroku", "vercel", "netlify", "cloudinary",

            // Tools & Concepts
            "git", "github", "gitlab", "bitbucket",
            "rest", "rest api", "restful", "graphql", "grpc",
            "microservices", "monolith", "mvc", "mvvm",
            "agile", "scrum", "kanban", "jira",
            "junit", "mockito", "selenium", "cypress", "jest",
            "maven", "gradle", "npm", "yarn", "webpack", "vite",
            "linux", "bash", "powershell",

            // Data & ML
            "machine learning", "deep learning", "nlp", "computer vision",
            "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch",
            "data structures", "algorithms", "dsa",
            "hadoop", "spark", "kafka",

            // Security & Auth
            "jwt", "oauth", "oauth2", "spring security",
            "encryption", "ssl", "tls",

            // Other
            "figma", "postman", "swagger", "api documentation",
            "responsive design", "cross-browser", "accessibility",
            "oop", "object oriented", "functional programming",
            "design patterns", "solid principles",
            "multithreading", "concurrency",
            "websocket", "sse", "socket.io"
    );

    // ── Education keyword set ───────────────────────────────────────────────
    private static final Set<String> EDUCATION_KEYWORDS = Set.of(
            "b.tech", "btech", "b.e", "m.tech", "mtech", "m.e",
            "bca", "mca", "bsc", "msc", "b.sc", "m.sc",
            "mba", "phd", "diploma",
            "computer science", "information technology", "software engineering",
            "electronics", "electrical", "mechanical",
            "cgpa", "gpa", "percentage"
    );

    // ── Regex patterns ──────────────────────────────────────────────────────
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}"
    );

    private static final Pattern PHONE_PATTERN = Pattern.compile(
            "(?:\\+?91[-\\s]?)?[6-9]\\d{9}|\\+?1[-\\s]?\\(?\\d{3}\\)?[-\\s]?\\d{3}[-\\s]?\\d{4}"
    );

    /**
     * Parse a PDF resume from an InputStream and extract structured data.
     */
    public ParsedResume parse(InputStream pdfStream) {
        String rawText;
        try (PDDocument document = PDDocument.load(pdfStream)) {
            PDFTextStripper stripper = new PDFTextStripper();
            rawText = stripper.getText(document);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse PDF: " + e.getMessage());
        }

        String lowerText = rawText.toLowerCase();

        // Extract email
        String email = extractFirst(EMAIL_PATTERN, rawText);

        // Extract phone
        String phone = extractFirst(PHONE_PATTERN, rawText);

        // Extract skills
        List<String> skills = SKILL_DICTIONARY.stream()
                .filter(lowerText::contains)
                .sorted()
                .collect(Collectors.toList());

        // Extract education keywords
        List<String> education = EDUCATION_KEYWORDS.stream()
                .filter(lowerText::contains)
                .sorted()
                .collect(Collectors.toList());

        return ParsedResume.builder()
                .email(email)
                .phone(phone)
                .skills(skills)
                .educationKeywords(education)
                .rawText(rawText.length() > 5000 ? rawText.substring(0, 5000) + "..." : rawText)
                .build();
    }

    private String extractFirst(Pattern pattern, String text) {
        Matcher matcher = pattern.matcher(text);
        return matcher.find() ? matcher.group() : null;
    }
}
