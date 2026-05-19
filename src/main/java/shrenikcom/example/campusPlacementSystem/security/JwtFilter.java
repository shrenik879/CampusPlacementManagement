package shrenikcom.example.campusPlacementSystem.security;


import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import shrenikcom.example.campusPlacementSystem.entity.User;
import shrenikcom.example.campusPlacementSystem.repository.UserRepository;

import java.io.IOException;

@Component
public class JwtFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;



    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
       // 1. Try Authorization header first
       String token = null;
       String authHeader = request.getHeader("Authorization");

       if (authHeader != null && authHeader.startsWith("Bearer ")) {
           token = authHeader.substring(7);
       }

       // 2. Fallback: check query parameter (needed for SSE — EventSource can't send headers)
       if (token == null) {
           token = request.getParameter("token");
       }

       if (token == null || token.isBlank()) {
           filterChain.doFilter(request, response);
           return;
       }

        try {
            String email = jwtUtil.extractEmail(token);

            User user = userRepository.findByEmail(email).orElse(null);

            if (user != null) {
                request.setAttribute("user", user);
            }
        } catch (Exception e) {
            // Token is invalid, expired, or has a mismatched signature. 
            // We ignore it so that public endpoints like /register still work.
            // Protected endpoints will correctly block the request later because no user is set.
        }

        filterChain.doFilter(request, response);

    }
}
